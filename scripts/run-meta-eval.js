#!/usr/bin/env node
// scripts/run-meta-eval.js
// ---------------------------------------------------------------------
// Phase 4 task 4.16 readiness: run the Evaluator agent prompt against
// the authorship-procedurally-separated meta-eval fixtures and assert
// the discrimination gap meets the calibration target.
//
// Per design plan §4:
//   - Pass: evaluator_score(good) - evaluator_score(bad) >= 20
//   - Secondary: bad memo's evaluator_score < 35 (routes to flagged)
//   - Secondary: bad memo's critical_issues includes the planted defect
//
// Usage:
//   ALICLOUD_API_KEY=... ALICLOUD_BASE_URL=... ALICLOUD_MODEL=qwen3-max-2026-01-23 \
//     node scripts/run-meta-eval.js
//
// Optional flags:
//   --good <path>  override good fixture (default: test-cases/meta-eval/intentionally-good-memo.json)
//   --bad  <path>  override bad  fixture (default: test-cases/meta-eval/intentionally-bad-memo.json)
//   --json         print machine-readable JSON output
//
// Exits 0 if discrimination gap >= 20, 1 otherwise. Also exits 1 on
// API errors or schema validation failures of the Evaluator output.
// ---------------------------------------------------------------------
'use strict';

const fs = require('fs');
const path = require('path');
const { createValidator } = require('../code/json-schema-validator');

const REPO_ROOT = path.join(__dirname, '..');
const SCHEMA_PATH = path.join(REPO_ROOT, 'schemas', 'agent-output-schemas.json');
const PROMPT_PATH = path.join(REPO_ROOT, 'prompts', 'evaluator-agent.md');
const DEFAULT_GOOD = path.join(REPO_ROOT, 'test-cases', 'meta-eval', 'intentionally-good-memo.json');
const DEFAULT_BAD = path.join(REPO_ROOT, 'test-cases', 'meta-eval', 'intentionally-bad-memo.json');
const DISCRIMINATION_TARGET = 20;
const FLAGGED_THRESHOLD = 35;

function parseArgs(argv) {
  const args = { good: DEFAULT_GOOD, bad: DEFAULT_BAD, json: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--good' && argv[i + 1]) { args.good = argv[++i]; }
    else if (argv[i] === '--bad' && argv[i + 1]) { args.bad = argv[++i]; }
    else if (argv[i] === '--json') { args.json = true; }
  }
  return args;
}

function extractSystemPrompt(promptMarkdown) {
  // Pull the first fenced code block.
  const m = promptMarkdown.match(/```\n([\s\S]+?)\n```/);
  if (!m) throw new Error('Could not extract system prompt code block from ' + PROMPT_PATH);
  return m[1];
}

async function callEvaluator(memo, systemPrompt) {
  const apiKey = process.env.ALICLOUD_API_KEY;
  const baseUrl = process.env.ALICLOUD_BASE_URL;
  const model = process.env.ALICLOUD_MODEL || 'qwen3-max-2026-01-23';
  if (!apiKey || !baseUrl) {
    throw new Error('ALICLOUD_API_KEY and ALICLOUD_BASE_URL must be set in env.');
  }

  // Minimal upstream stub: meta-eval fixtures stand alone, with no live upstream
  // agents to forward. We pass empty arrays for the upstream-agent inputs so
  // the Evaluator runs the criteria against the memo itself.
  const userPayload = {
    memo,
    extracted_facts_per_document: [],
    contradiction_output: { contradictions: [], verified_claims: [] },
    gap_analysis_output: { missing_information: [] },
    red_flag_detector_output: { red_flags: [] },
    portfolio_fit_output: { portfolio_fit: { strategic_fit: { score: 0.5, rationale: '' }, stage_fit: { score: 0.5, rationale: '' }, synergy_potential: [], anti_patterns: [], overall_thesis_alignment: 'MEDIUM', recommended_action: 'pursue' } },
    unresolved_sources: [],
    schema_errors: [],
  };

  const body = {
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userPayload, null, 2) },
    ],
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Evaluator API call failed: ${response.status} ${response.statusText}\n${text.slice(0, 500)}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content;
  if (Array.isArray(content)) content = content.map((p) => p?.text || '').join('');
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Evaluator returned empty content.');
  }

  content = content.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  let parsed;
  try { parsed = JSON.parse(content); }
  catch (err) {
    throw new Error(`Failed to parse Evaluator JSON: ${err.message}\nRaw: ${content.slice(0, 500)}`);
  }

  return { parsed, usage: data.usage, model: data.model || model };
}

async function main() {
  const args = parseArgs(process.argv);

  const schemas = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const validator = createValidator(schemas);
  const promptMarkdown = fs.readFileSync(PROMPT_PATH, 'utf8');
  const systemPrompt = extractSystemPrompt(promptMarkdown);

  const goodMemo = JSON.parse(fs.readFileSync(args.good, 'utf8'));
  const badMemo = JSON.parse(fs.readFileSync(args.bad, 'utf8'));

  // Pre-flight: fixtures must be schema-valid against MemoGenerationOutput.
  for (const [label, memo] of [['good', goodMemo], ['bad', badMemo]]) {
    const v = validator.validateDef(memo, 'MemoGenerationOutput');
    if (!v.valid) {
      console.error(`Pre-flight: ${label} fixture is not schema-valid against MemoGenerationOutput.`);
      for (const e of v.errors) console.error(`  ${e.path || '/'}: ${e.message}`);
      process.exit(1);
    }
  }

  console.error('Running Evaluator on good fixture...');
  const goodResult = await callEvaluator(goodMemo, systemPrompt);
  console.error('Running Evaluator on bad fixture...');
  const badResult = await callEvaluator(badMemo, systemPrompt);

  // Validate Evaluator outputs against EvaluatorOutput schema.
  const goodValid = validator.validateDef(goodResult.parsed, 'EvaluatorOutput');
  const badValid = validator.validateDef(badResult.parsed, 'EvaluatorOutput');
  if (!goodValid.valid || !badValid.valid) {
    console.error('Evaluator output failed schema validation.');
    if (!goodValid.valid) for (const e of goodValid.errors) console.error(`  good: ${e.path}: ${e.message}`);
    if (!badValid.valid) for (const e of badValid.errors) console.error(`  bad:  ${e.path}: ${e.message}`);
    process.exit(1);
  }

  const goodScore = goodResult.parsed.evaluator_score;
  const badScore = badResult.parsed.evaluator_score;
  const gap = goodScore - badScore;
  const gapPass = gap >= DISCRIMINATION_TARGET;
  const flaggedPass = badScore < FLAGGED_THRESHOLD;

  const summary = {
    good_score: goodScore,
    bad_score: badScore,
    discrimination_gap: gap,
    discrimination_target: DISCRIMINATION_TARGET,
    discrimination_pass: gapPass,
    bad_below_flagged_threshold: flaggedPass,
    good_routing: goodResult.parsed.routing_decision,
    bad_routing: badResult.parsed.routing_decision,
    good_critical_issues: goodResult.parsed.critical_issues,
    bad_critical_issues: badResult.parsed.critical_issues,
    good_criteria: goodResult.parsed.criteria_scores,
    bad_criteria: badResult.parsed.criteria_scores,
    model: goodResult.model,
  };

  if (args.json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  } else {
    console.log('\n=== Meta-eval results ===');
    console.log(`Model: ${summary.model}`);
    console.log(`Good fixture score:  ${goodScore} / 60  (routing: ${summary.good_routing})`);
    console.log(`Bad  fixture score:  ${badScore} / 60  (routing: ${summary.bad_routing})`);
    console.log(`Discrimination gap:  ${gap}  (target: >=${DISCRIMINATION_TARGET})  ${gapPass ? '✓' : '✗'}`);
    console.log(`Bad < flagged threshold (${FLAGGED_THRESHOLD}):  ${flaggedPass ? '✓' : '✗'}`);
    if (summary.bad_critical_issues?.length) {
      console.log('Bad critical_issues:');
      for (const ci of summary.bad_critical_issues) {
        console.log(`  [${ci.severity}] ${ci.issue_type}: ${ci.description}`);
      }
    }
  }

  process.exit(gapPass ? 0 : 1);
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
