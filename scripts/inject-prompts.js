#!/usr/bin/env node
// scripts/inject-prompts.js
// ---------------------------------------------------------------------
// D-6 mitigation: keep prompts/*.md files as the single source of truth
// for specialist-agent system prompts, and inject the canonical text
// into n8n/workflow.json's "Build {Agent} Request" nodes.
//
// Each Build node has a JS line of the form:
//   const systemPrompt = "..."; // JSON-encoded literal
// This script replaces that literal with the JSON-encoded contents of
// the first fenced code block in the corresponding prompts/*.md file.
//
// Usage:
//   node scripts/inject-prompts.js          # write injections to workflow.json
//   node scripts/inject-prompts.js --check  # report drift without writing
//   node scripts/inject-prompts.js --node "Build Memo Request"  # single node
//
// Recommended: run before ./scripts/import-workflow.sh whenever a prompt
// markdown file changes. Idempotent — re-running with no drift is a no-op.
//
// Mapping is below. Add entries as new specialists wire up.
// ---------------------------------------------------------------------
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const WORKFLOW = path.join(REPO_ROOT, 'n8n', 'workflow.json');

// Build node name -> prompts file. Add entries as specialists wire up.
//
// NOTE: prompts/contradiction-agent.tool-use.md is NOT in this mapping.
// Codex authored that file with a different markdown structure (the only
// fenced block is a JSON example, not the prompt itself), and the
// embedded copy in n8n/workflow.json's Build Contradiction Request was
// hand-curated. Keep the manual sync there for now; convert to the
// fenced-block format if/when the prompt is re-refined.
const MAPPING = [
  { node: 'Build Extraction Request',     prompt: 'prompts/extraction-agent.md' },
  { node: 'Build Gap Analysis Request',   prompt: 'prompts/gap-analysis-agent.md' },
  { node: 'Build Portfolio Fit Request',  prompt: 'prompts/portfolio-fit-agent.md' },
  { node: 'Build Memo Request',           prompt: 'prompts/memo-generation-agent.md' },
  { node: 'Build Evaluator Request',      prompt: 'prompts/evaluator-agent.md' },
];

// Matches either:
//   const systemPrompt = "JSON-encoded string";
//   const systemPrompt = `template literal`;
// Group 1 = opening delimiter (" or `). Group 2 = inner content.
//
// On replacement we always emit the JSON-string form (double-quoted) for
// safety — backtick form risks accidental ${} interpolation if a prompt
// ever contains that sequence.
const SYSTEM_PROMPT_RE = /const systemPrompt = (["`])([\s\S]*?)\1;/;

function parseArgs(argv) {
  const args = { check: false, node: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--check') { args.check = true; }
    else if (argv[i] === '--node' && argv[i + 1]) { args.node = argv[++i]; }
  }
  return args;
}

function extractSystemPromptFromMd(markdown, mdPath) {
  // Match the FIRST plain fenced code block (no language tag). Prompts are
  // wrapped in ``` ... ``` (no language) by convention; example JSON blocks
  // typically use ```json which won't match.
  const m = markdown.match(/(?:^|\n)```\n([\s\S]+?)\n```/);
  if (!m) {
    return null;
  }
  return m[1];
}

function syncOne(wf, entry, opts) {
  const target = wf.nodes.find((n) => n.name === entry.node);
  if (!target) {
    return { node: entry.node, status: 'missing-node' };
  }

  const promptPath = path.join(REPO_ROOT, entry.prompt);
  if (!fs.existsSync(promptPath)) {
    return { node: entry.node, status: 'missing-prompt' };
  }
  const md = fs.readFileSync(promptPath, 'utf8');
  const promptText = extractSystemPromptFromMd(md, entry.prompt);
  if (promptText === null) {
    return { node: entry.node, status: 'no-fenced-block-in-prompt' };
  }
  const newLiteral = JSON.stringify(promptText);

  const js = target.parameters.jsCode;
  const match = js.match(SYSTEM_PROMPT_RE);
  if (!match) {
    return { node: entry.node, status: 'no-injection-site' };
  }

  const oldDelim = match[1];
  const oldInner = match[2];
  // For comparison: reconstruct what the OLD content represents as a string,
  // unescape based on delimiter. JSON form already canonicalizes via parse;
  // template-literal form is just the raw content (we trust no ${} usage).
  let oldText;
  if (oldDelim === '"') {
    try { oldText = JSON.parse(`"${oldInner}"`); }
    catch { oldText = null; }
  } else {
    oldText = oldInner;
  }

  if (oldText === promptText) {
    return { node: entry.node, status: 'in-sync', delim: oldDelim };
  }

  if (opts.check) {
    return {
      node: entry.node,
      status: 'drift',
      oldLength: oldInner.length,
      newLength: newLiteral.length,
      delim: oldDelim,
    };
  }

  // Always replace with JSON-string (double-quoted) form for safety.
  target.parameters.jsCode = js.replace(SYSTEM_PROMPT_RE, `const systemPrompt = ${newLiteral};`);
  return {
    node: entry.node,
    status: 'updated',
    oldLength: oldInner.length,
    newLength: newLiteral.length,
    delim: oldDelim,
    converted: oldDelim === '`' ? 'backtick->json' : null,
  };
}

function bumpVersion(wf) {
  const prev = wf.versionId || '';
  const m = prev.match(/(.*-v)(\d+)$/);
  if (m) {
    wf.versionId = `${m[1]}${parseInt(m[2], 10) + 1}`;
  } else {
    wf.versionId = 'phase3-injected-v1';
  }
}

function main() {
  const args = parseArgs(process.argv);
  const wf = JSON.parse(fs.readFileSync(WORKFLOW, 'utf8'));

  const entries = args.node
    ? MAPPING.filter((e) => e.node === args.node)
    : MAPPING;

  if (args.node && entries.length === 0) {
    console.error(`No mapping entry for node "${args.node}".`);
    console.error('Known nodes: ' + MAPPING.map((e) => e.node).join(', '));
    process.exit(2);
  }

  const results = entries.map((e) => syncOne(wf, e, args));
  let driftCount = 0;
  let updatedCount = 0;
  let missingCount = 0;
  for (const r of results) {
    const tag = `[${r.status}]`.padEnd(20);
    const sizeNote = r.oldLength != null ? ` (${r.oldLength} -> ${r.newLength} bytes)` : '';
    console.log(`${tag} ${r.node}${sizeNote}`);
    if (r.status === 'drift') driftCount++;
    if (r.status === 'updated') updatedCount++;
    if (r.status === 'missing-node' || r.status === 'missing-prompt' || r.status === 'no-injection-site') missingCount++;
  }

  if (!args.check && updatedCount > 0) {
    bumpVersion(wf);
    fs.writeFileSync(WORKFLOW, JSON.stringify(wf, null, 2));
    console.log(`\nWrote ${updatedCount} update(s). versionId -> ${wf.versionId}`);
  }

  if (args.check && driftCount > 0) {
    console.log(`\nDrift detected on ${driftCount} node(s). Re-run without --check to apply.`);
    process.exit(1);
  }

  if (missingCount > 0) {
    console.log(`\n${missingCount} entry/entries skipped (missing node, prompt, or injection site).`);
  }

  process.exit(0);
}

main();
