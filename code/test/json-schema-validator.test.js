// code/test/json-schema-validator.test.js
// Node 22 built-in test runner. Run with: node --test code/test/json-schema-validator.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createValidator } = require('../json-schema-validator.js');

// ---------------------------------------------------------------------
// Regression test for P-1 pitfall: validator MUST NOT call new Function
// or eval. If anyone adds a dependency that uses runtime code gen, this
// test catches it by static grep of the source.
// ---------------------------------------------------------------------
test('validator source contains no new Function or eval calls', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'json-schema-validator.js'), 'utf8');
  // Strip comments before grepping so "no new Function" mentions in
  // docstrings don't false-positive. Simple block + line comment strip.
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');
  assert.ok(!/\bnew\s+Function\b/.test(code), 'validator code contains "new Function(" — incompatible with n8n sandbox');
  assert.ok(!/\beval\s*\(/.test(code), 'validator code contains "eval(" — incompatible with n8n sandbox');
});

// ---------------------------------------------------------------------
// Per-keyword unit tests
// ---------------------------------------------------------------------

test('type: string / number / boolean / null basic matching', () => {
  const v = createValidator({ $defs: {
    S: { type: 'string' },
    N: { type: 'number' },
    B: { type: 'boolean' },
    Z: { type: 'null' },
  }});
  assert.equal(v.validateDef('hi', 'S').valid, true);
  assert.equal(v.validateDef(42,  'S').valid, false);
  assert.equal(v.validateDef(42,   'N').valid, true);
  assert.equal(v.validateDef('x',  'N').valid, false);
  assert.equal(v.validateDef(true, 'B').valid, true);
  assert.equal(v.validateDef(null, 'Z').valid, true);
  assert.equal(v.validateDef(undefined, 'Z').valid, false);
});

test('type: null-union ["string","null"]', () => {
  const v = createValidator({ $defs: { X: { type: ['string', 'null'] } } });
  assert.equal(v.validateDef('ok', 'X').valid, true);
  assert.equal(v.validateDef(null, 'X').valid, true);
  assert.equal(v.validateDef(42,   'X').valid, false);
});

test('type: integer rejects non-integer numbers', () => {
  const v = createValidator({ $defs: { I: { type: 'integer' } } });
  assert.equal(v.validateDef(7,   'I').valid, true);
  assert.equal(v.validateDef(7.5, 'I').valid, false);
});

test('required: missing property reports path', () => {
  const v = createValidator({ $defs: { O: { type: 'object', required: ['x', 'y'] } } });
  const r = v.validateDef({ x: 1 }, 'O');
  assert.equal(r.valid, false);
  assert.ok(r.errors.some(e => e.path === '/y' && /required/.test(e.message)));
});

test('enum: rejects values not in set', () => {
  const v = createValidator({ $defs: { E: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] } } });
  assert.equal(v.validateDef('HIGH', 'E').valid, true);
  assert.equal(v.validateDef('high', 'E').valid, false);
});

test('const: strict equality', () => {
  const v = createValidator({ $defs: { D: { const: true } } });
  assert.equal(v.validateDef(true, 'D').valid, true);
  assert.equal(v.validateDef(false, 'D').valid, false);
});

test('pattern: string regex match', () => {
  const v = createValidator({ $defs: { P: { type: 'string', pattern: '^[A-Z][a-z]+$' } } });
  assert.equal(v.validateDef('Foo', 'P').valid, true);
  assert.equal(v.validateDef('foo', 'P').valid, false);
  assert.equal(v.validateDef('FOO', 'P').valid, false);
});

test('minLength / minItems', () => {
  const v = createValidator({ $defs: {
    S: { type: 'string', minLength: 3 },
    A: { type: 'array', minItems: 2, items: { type: 'number' } },
  }});
  assert.equal(v.validateDef('ab',  'S').valid, false);
  assert.equal(v.validateDef('abc', 'S').valid, true);
  assert.equal(v.validateDef([1],   'A').valid, false);
  assert.equal(v.validateDef([1,2], 'A').valid, true);
});

test('minimum / maximum', () => {
  const v = createValidator({ $defs: { N: { type: 'number', minimum: 0, maximum: 10 } } });
  assert.equal(v.validateDef(-1, 'N').valid, false);
  assert.equal(v.validateDef(0,  'N').valid, true);
  assert.equal(v.validateDef(10, 'N').valid, true);
  assert.equal(v.validateDef(11, 'N').valid, false);
});

test('properties: recursive object validation', () => {
  const v = createValidator({ $defs: {
    Inner: { type: 'object', properties: { y: { type: 'number' } }, required: ['y'] },
    Outer: { type: 'object', properties: { inner: { $ref: '#/$defs/Inner' } }, required: ['inner'] },
  }});
  assert.equal(v.validateDef({ inner: { y: 1 } },    'Outer').valid, true);
  assert.equal(v.validateDef({ inner: { y: 'no' } }, 'Outer').valid, false);
  assert.equal(v.validateDef({ inner: {} },          'Outer').valid, false);
});

test('items: each array element validated against subschema', () => {
  const v = createValidator({ $defs: { A: { type: 'array', items: { type: 'string', minLength: 2 } } } });
  assert.equal(v.validateDef(['ok', 'yes'], 'A').valid, true);
  assert.equal(v.validateDef(['ok', 'x'],   'A').valid, false);
});

test('anyOf: at least one branch passes', () => {
  const v = createValidator({ $defs: { Mixed: { anyOf: [
    { type: 'string', pattern: '^id-\\d+$' },
    { type: 'null' },
  ]}}});
  assert.equal(v.validateDef('id-42', 'Mixed').valid, true);
  assert.equal(v.validateDef(null,    'Mixed').valid, true);
  assert.equal(v.validateDef('bad',   'Mixed').valid, false);
});

test('$ref: internal reference resolution', () => {
  const v = createValidator({ $defs: {
    Severity: { type: 'string', enum: ['HIGH','MEDIUM','LOW'] },
    Issue: { type: 'object', properties: { sev: { $ref: '#/$defs/Severity' } }, required: ['sev'] },
  }});
  assert.equal(v.validateDef({ sev: 'HIGH' },  'Issue').valid, true);
  assert.equal(v.validateDef({ sev: 'maybe' }, 'Issue').valid, false);
});

test('$ref: external refs are rejected with a clear error', () => {
  const v = createValidator({ $defs: { X: { $ref: 'https://example.com/remote.json' } } });
  // resolveRef throws for non-internal refs. Catch via validateDef —
  // this currently throws up the stack; test asserts we get a meaningful message.
  assert.throws(() => v.validateDef({}, 'X'), /Unsupported \$ref/);
});

test('error path reports nested JSON pointer', () => {
  const v = createValidator({ $defs: { O: {
    type: 'object',
    properties: { arr: { type: 'array', items: { type: 'string' } } },
    required: ['arr'],
  }}});
  const r = v.validateDef({ arr: ['a', 42, 'c'] }, 'O');
  assert.equal(r.valid, false);
  assert.ok(r.errors.some(e => e.path === '/arr[1]' && /type/.test(e.message)));
});

// ---------------------------------------------------------------------
// Integration tests against schemas/agent-output-schemas.json
// ---------------------------------------------------------------------

const agentSchemas = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'schemas', 'agent-output-schemas.json'), 'utf8')
);

test('integration: all 7 agent schemas resolvable', () => {
  const v = createValidator(agentSchemas);
  for (const name of [
    'ExtractionOutput', 'ContradictionOutput', 'GapAnalysisOutput',
    'RedFlagDetectorOutput', 'PortfolioFitOutput', 'MemoGenerationOutput',
    'EvaluatorOutput',
  ]) {
    assert.ok(v.resolveRef('#/$defs/' + name), 'missing $defs/' + name);
  }
});

test('integration: RedFlagDetectorOutput accepts empty red_flags (bypass case)', () => {
  const v = createValidator(agentSchemas);
  assert.equal(v.validateDef({ red_flags: [] }, 'RedFlagDetectorOutput').valid, true);
});

test('integration: RedFlagDetectorOutput accepts a well-formed flag', () => {
  const v = createValidator(agentSchemas);
  const good = { red_flags: [{
    flag_type: 'customer_concentration_extreme',
    severity: 'HIGH',
    evidence: { actual_value: 86, threshold: 70, source: 'Cerebras S-1 Filing Risk Factors p. 23', raw_text: 'Two customers together represented approximately 86% of our revenue' },
    deterministic: true,
  }]};
  const r = v.validateDef(good, 'RedFlagDetectorOutput');
  assert.deepEqual(r.errors, []);
  assert.equal(r.valid, true);
});

test('integration: RedFlagDetectorOutput rejects deterministic: false', () => {
  const v = createValidator(agentSchemas);
  const bad = { red_flags: [{
    flag_type: 'customer_concentration_high', severity: 'MEDIUM',
    evidence: { actual_value: 35, source: 's' }, deterministic: false,
  }]};
  assert.equal(v.validateDef(bad, 'RedFlagDetectorOutput').valid, false);
});

test('integration: Citation regex accepts "Cerebras S-1 Filing p. 23"', () => {
  const v = createValidator(agentSchemas);
  assert.equal(v.validateDef('Cerebras S-1 Filing p. 23', 'Citation').valid, true);
  assert.equal(v.validateDef('Cerebras S-1 Filing p. ~23', 'Citation').valid, true);
  assert.equal(v.validateDef('Cerebras S-1 Filing Risk Factors p. 23', 'Citation').valid, true);
  assert.equal(v.validateDef('CoreWeave Press Release p. 2', 'Citation').valid, true);
  assert.equal(v.validateDef('Cerebras Analyst Report (#2) p. 7', 'Citation').valid, true);
  assert.equal(v.validateDef(null, 'Citation').valid, true); // null-union allowed
});

test('integration: Citation regex rejects malformed citations', () => {
  const v = createValidator(agentSchemas);
  assert.equal(v.validateDef('cerebras s-1 p. 23',     'Citation').valid, false); // lowercase start
  assert.equal(v.validateDef('Cerebras Unknown p. 23', 'Citation').valid, false); // no valid SourceTypeHuman
  assert.equal(v.validateDef('Cerebras S-1 Filing',    'Citation').valid, false); // no locator
  assert.equal(v.validateDef('p. 23',                  'Citation').valid, false); // no source
});

test('integration: MemoGenerationOutput requires non-empty sources on claims', () => {
  const v = createValidator(agentSchemas);
  const baseMemo = {
    executive_summary: null, recommendation: null,
    key_strengths: [], key_risks: [], contradictions: [],
    missing_information: [], red_flags: [], open_diligence_questions: [],
    confidence_scores: { overall: 0.5 },
  };
  // Empty arrays are fine (bypass case)
  assert.equal(v.validateDef(baseMemo, 'MemoGenerationOutput').valid, true);
  // Claim without sources violates minItems: 1
  const bad = { ...baseMemo, key_risks: [{ risk: 'something', severity: 'HIGH', sources: [], confidence: 0.5 }] };
  assert.equal(v.validateDef(bad, 'MemoGenerationOutput').valid, false);
  // Claim with a valid source passes
  const good = { ...baseMemo, key_risks: [{ risk: 'something', severity: 'HIGH', sources: ['Cerebras S-1 Filing p. 12'], confidence: 0.5 }] };
  assert.equal(v.validateDef(good, 'MemoGenerationOutput').valid, true);
});

test('integration: EvaluatorOutput criteria scores bounded 0-10', () => {
  const v = createValidator(agentSchemas);
  const base = {
    evaluator_score: 40,
    criteria_scores: {
      citation_completeness: 8, contradiction_acknowledgment: 7,
      missing_information_coverage: 6, red_flag_propagation: 10,
      reasoning_coherence: 5, hallucination_check: 4,
    },
    critical_issues: [], routing_decision: 'complete',
  };
  assert.equal(v.validateDef(base, 'EvaluatorOutput').valid, true);
  // Score > 10 fails
  const bad = { ...base, criteria_scores: { ...base.criteria_scores, reasoning_coherence: 11 } };
  assert.equal(v.validateDef(bad, 'EvaluatorOutput').valid, false);
  // evaluator_score > 60 fails
  const bad2 = { ...base, evaluator_score: 61 };
  assert.equal(v.validateDef(bad2, 'EvaluatorOutput').valid, false);
});

test('integration: ContradictionOutput DISPUTED entry requires sources_making_claim', () => {
  const v = createValidator(agentSchemas);
  // sources_making_claim empty → violates minItems: 1 on that array
  const bad = {
    contradictions: [{
      claim: 'x', sources_making_claim: [], contradicting_evidence: [],
      severity: 'HIGH', classification: 'DISPUTED',
    }],
    verified_claims: [],
  };
  assert.equal(v.validateDef(bad, 'ContradictionOutput').valid, false);
});
