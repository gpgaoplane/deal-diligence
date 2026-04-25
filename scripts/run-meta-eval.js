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
//   --good <path>           override good fixture (default: test-cases/meta-eval/intentionally-good-memo.json)
//   --bad  <path>           override bad  fixture (default: test-cases/meta-eval/intentionally-bad-memo.json)
//   --extraction <path>     upstream ExtractionOutput[] JSON to feed Evaluator (default: empty array)
//   --contradictions <path> upstream ContradictionOutput JSON              (default: empty)
//   --gaps <path>           upstream GapAnalysisOutput JSON                (default: empty)
//   --red-flags <path>      upstream RedFlagDetectorOutput JSON            (default: empty)
//   --portfolio-fit <path>  upstream PortfolioFitOutput JSON               (default: neutral fit)
//   --json                  print machine-readable JSON output
//
// LIMITATION (Codex P2 finding 2026-04-25): without upstream fixture
// paths, the Evaluator's criteria 2/3/4 (contradiction_acknowledgment,
// missing_information_coverage, red_flag_propagation) cannot be
// meaningfully calibrated — those criteria score the memo against
// upstream agent outputs, and zeroed-out upstream means the Evaluator
// has nothing to compare against. For full Phase 4 calibration, supply
// upstream fixture paths via the flags above. Without them, the
// discrimination gap is computed against criteria 1, 5, 6 plus
// whatever the Evaluator infers from the memo body alone.
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
  const args = {
    good: DEFAULT_GOOD,
    bad: DEFAULT_BAD,
    extraction: null,
    contradictions: null,
    gaps: null,
    redFlags: null,
    portfolioFit: null,
    json: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];
    if (flag === '--good' && next) { args.good = argv[++i]; }
    else if (flag === '--bad' && next) { args.bad = argv[++i]; }
    else if (flag === '--extraction' && next) { args.extraction = argv[++i]; }
    else if (flag === '--contradictions' && next) { args.contradictions = argv[++i]; }
    else if (flag === '--gaps' && next) { args.gaps = argv[++i]; }
    else if (flag === '--red-flags' && next) { args.redFlags = argv[++i]; }
    else if (flag === '--portfolio-fit' && next) { args.portfolioFit = argv[++i]; }
    else if (flag === '--json') { args.json = true; }
  }
  return args;
}

function loadOptional(filePath, fallback) {
  if (!filePath) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function extractSystemPrompt(promptMarkdown) {
  // Pull the first fenced code block.
  const m = promptMarkdown.match(/```\n([\s\S]+?)\n```/);
  if (!m) throw new Error('Could not extract system prompt code block from ' + PROMPT_PATH);
  return m[1];
}

async function callEvaluator(memo, systemPrompt, upstream) {
  const apiKey = process.env.ALICLOUD_API_KEY;
  const baseUrl = process.env.ALICLOUD_BASE_URL;
  const model = process.env.ALICLOUD_MODEL || 'qwen3-max-2026-01-23';
  if (!apiKey || !baseUrl) {
    throw new Error('ALICLOUD_API_KEY and ALICLOUD_BASE_URL must be set in env.');
  }

  // Upstream artifacts: caller supplies via CLI flags or accepts the
  // empty-stub defaults. See script header LIMITATION note: empty upstream
  // means criteria 2/3/4 cannot be fully calibrated.
  const userPayload = {
    memo,
    extracted_facts_per_document: upstream.extraction,
    contradiction_output: upstream.contradictions,
    gap_analysis_output: upstream.gaps,
    red_flag_detector_output: upstream.redFlags,
    portfolio_fit_output: upstream.portfolioFit,
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

  // Build upstream payload. Defaults are empty; caller can override via flags.
  const upstream = {
    extraction: loadOptional(args.extraction, []),
    contradictions: loadOptional(args.contradictions, { contradictions: [], verified_claims: [] }),
    gaps: loadOptional(args.gaps, { missing_information: [] }),
    redFlags: loadOptional(args.redFlags, { red_flags: [] }),
    portfolioFit: loadOptional(args.portfolioFit, {
      portfolio_fit: {
        strategic_fit: { score: 0.5, rationale: '' },
        stage_fit: { score: 0.5, rationale: '' },
        synergy_potential: [],
        anti_patterns: [],
        overall_thesis_alignment: 'MEDIUM',
        recommended_action: 'pursue',
      },
    }),
  };

  // Loud warning if upstream is fully zeroed out.
  const allEmpty = (
    upstream.extraction.length === 0 &&
    upstream.contradictions.contradictions.length === 0 &&
    upstream.contradictions.verified_claims.length === 0 &&
    upstream.gaps.missing_information.length === 0 &&
    upstream.redFlags.red_flags.length === 0
  );
  if (allEmpty) {
    console.error('WARNING: upstream artifacts are all empty (no --extraction/--contradictions/--gaps/--red-flags supplied).');
    console.error('  Evaluator criteria 2/3/4 will not be meaningfully calibrated.');
    console.error('  Discrimination gap will reflect only criteria 1, 5, 6 plus what the Evaluator infers from the memo body.');
    console.error('  Provide upstream fixture paths via flags for full calibration.');
  }

  console.error('Running Evaluator on good fixture...');
  const goodResult = await callEvaluator(goodMemo, systemPrompt, upstream);
  console.error('Running Evaluator on bad fixture...');
  const badResult = await callEvaluator(badMemo, systemPrompt, upstream);

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
