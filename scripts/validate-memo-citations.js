#!/usr/bin/env node
// scripts/validate-memo-citations.js
// ---------------------------------------------------------------------
// Runs the Citation Validity Check (design plan §3.1) against a
// MemoGenerationOutput JSON file using a source_manifest JSON file.
// Both inputs are local files; this script is the out-of-sandbox
// counterpart of the n8n Code node that wraps code/citation-validity.js.
//
// Usage:
//   node scripts/validate-memo-citations.js <memo-path> <manifest-path>
//
// Manifest file shape: array of { source_name, source_type, file_id? }
// matching the Coordinator's source_manifest emission.
//
// Output:
//   - Stats summary (claims_input/kept/dropped, citations_input/kept/unresolved).
//   - List of unresolved citations with reason codes.
//   - Cleaned memo written to <memo-path>.cleaned.json (sibling file).
//
// Exits 0 if no unresolved citations, 1 otherwise. Always writes the
// cleaned memo regardless of unresolved count (so the caller can
// inspect what would have been delivered).
// ---------------------------------------------------------------------
'use strict';

const fs = require('fs');
const path = require('path');
const { validateCitations } = require('../code/citation-validity');

function usage() {
  console.error('Usage: node scripts/validate-memo-citations.js <memo-path> <manifest-path>');
  process.exit(2);
}

function main() {
  const [, , memoPath, manifestPath] = process.argv;
  if (!memoPath || !manifestPath) usage();

  let memo;
  try {
    memo = JSON.parse(fs.readFileSync(memoPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to load memo ${memoPath}: ${err.message}`);
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to load manifest ${manifestPath}: ${err.message}`);
    process.exit(1);
  }
  if (!Array.isArray(manifest)) {
    console.error('Manifest file must be a JSON array of { source_name, source_type, ... }');
    process.exit(1);
  }

  const result = validateCitations(memo, manifest);

  console.log(`Citation Validity Check — ${memoPath}`);
  console.log(`  Manifest sources: ${manifest.length}`);
  console.log('  Stats:');
  for (const [k, v] of Object.entries(result.stats)) {
    console.log(`    ${k}: ${v}`);
  }

  if (result.unresolved_sources.length > 0) {
    console.log(`\n  Unresolved citations (${result.unresolved_sources.length}):`);
    for (const u of result.unresolved_sources) {
      console.log(`    [${u.reason}] ${u.claim_type}: ${u.citation}`);
    }
  }

  if (result.dropped_claims.length > 0) {
    console.log(`\n  Dropped claims (${result.dropped_claims.length}):`);
    for (const c of result.dropped_claims) {
      const text = c.strength || c.risk || c.claim || '<no text>';
      console.log(`    - "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`);
    }
  }

  // Write cleaned memo as sibling file.
  const cleanedPath = memoPath.replace(/\.json$/, '.cleaned.json');
  fs.writeFileSync(cleanedPath, JSON.stringify(result.cleanedMemo, null, 2));
  console.log(`\n  Cleaned memo written to: ${cleanedPath}`);

  process.exit(result.unresolved_sources.length === 0 ? 0 : 1);
}

main();
