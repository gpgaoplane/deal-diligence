#!/usr/bin/env node
// scripts/validate-fixture.js
// ---------------------------------------------------------------------
// Validates a JSON fixture against a named $defs schema in
// schemas/agent-output-schemas.json.
//
// Usage:
//   node scripts/validate-fixture.js <fixture-path> <schema-name>
//
// Example:
//   node scripts/validate-fixture.js \
//     test-cases/meta-eval/intentionally-good-memo.json \
//     MemoGenerationOutput
//
// Exits 0 on valid, 1 on invalid (with error details printed to stderr).
//
// Per design plan §3.2 / D-3: the in-sandbox validator at
// code/json-schema-validator.js is reused here to keep the validator
// behavior identical inside and outside n8n.
// ---------------------------------------------------------------------
'use strict';

const fs = require('fs');
const path = require('path');
const { createValidator } = require('../code/json-schema-validator');

const SCHEMA_PATH = path.join(__dirname, '..', 'schemas', 'agent-output-schemas.json');

function usage() {
  console.error('Usage: node scripts/validate-fixture.js <fixture-path> <schema-name>');
  console.error('  schema-name: name under $defs, e.g. MemoGenerationOutput, ExtractionOutput');
  process.exit(2);
}

function main() {
  const [, , fixturePath, schemaName] = process.argv;
  if (!fixturePath || !schemaName) usage();

  let fixture;
  try {
    fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  } catch (err) {
    console.error(`Failed to load fixture ${fixturePath}: ${err.message}`);
    process.exit(1);
  }

  let schemas;
  try {
    schemas = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  } catch (err) {
    console.error(`Failed to load schemas at ${SCHEMA_PATH}: ${err.message}`);
    process.exit(1);
  }

  if (!schemas.$defs || !schemas.$defs[schemaName]) {
    console.error(`Schema name "${schemaName}" not found under $defs.`);
    console.error(`Available: ${Object.keys(schemas.$defs || {}).join(', ')}`);
    process.exit(1);
  }

  const validator = createValidator(schemas);
  const result = validator.validateDef(fixture, schemaName);

  if (result.valid) {
    console.log(`OK: ${fixturePath} validates against ${schemaName}`);
    process.exit(0);
  }

  console.error(`FAIL: ${fixturePath} does not validate against ${schemaName}`);
  console.error(`Errors (${result.errors.length}):`);
  for (const e of result.errors) {
    console.error(`  ${e.path || '/'}: ${e.message}`);
  }
  process.exit(1);
}

main();
