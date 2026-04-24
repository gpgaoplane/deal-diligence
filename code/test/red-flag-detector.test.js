// code/test/red-flag-detector.test.js
// Node 22 built-in test runner. Run with:
//   node --test code/test/red-flag-detector.test.js
//
// Coverage target (design plan §2.7): ~35 tests across 10 detectors.
// Per detector: positive match + negation variant(s) + edge case.
// ---------------------------------------------------------------------
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const rfd = require('../red-flag-detector.js');
const { detectFlags, _internal } = rfd;

// Convenience — build an ExtractionOutput-shaped doc with just the fields a test exercises.
function mkExtraction(opts = {}) {
  return {
    source_name: opts.source_name || 'Test S-1 Filing',
    source_type: 'regulatory_filing',
    extracted_facts: {
      customer_profile: {
        concentration_top_1: opts.concentration_top_1 ?? null,
        concentration_top_2: opts.concentration_top_2 ?? null,
        concentration_top_5: null,
        retention_rate: null,
        citations: [],
      },
      financial_performance: {
        revenue_latest_period: { value: null, period: null, citation: null },
        revenue_growth_yoy: {
          value: opts.revenue_growth_yoy ?? null,
          period: null,
          citation: null,
        },
        gross_margin: { value: null, citation: null },
        operating_loss: { value: null, period: null, citation: null },
        cash_balance: { value: opts.cash_balance ?? null, period: null, citation: null },
        monthly_burn: { value: opts.monthly_burn ?? null, period: null, citation: null },
      },
    },
  };
}

function mkRaw(text, source_name = 'Test S-1 Filing', source_type = 'regulatory_filing') {
  return [{ source_name, source_type, text }];
}

// ---------------------------------------------------------------------
// Static regression (P-1): no new Function / eval in the detector source
// ---------------------------------------------------------------------
test('detector source contains no new Function or eval', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'red-flag-detector.js'), 'utf8');
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
  assert.ok(!/\bnew\s+Function\b/.test(stripped), 'new Function() present');
  assert.ok(!/\beval\s*\(/.test(stripped), 'eval() present');
});

// ---------------------------------------------------------------------
// 1. customer_concentration_high (MEDIUM, 30% <= top_1 < 50%)
// ---------------------------------------------------------------------

test('ccHigh: top_1=35 → flags MEDIUM', () => {
  const r = detectFlags([mkExtraction({ concentration_top_1: 35 })], []);
  const f = r.red_flags.find(x => x.flag_type === 'customer_concentration_high');
  assert.ok(f, 'missing customer_concentration_high');
  assert.equal(f.severity, 'MEDIUM');
  assert.equal(f.evidence.actual_value, 35);
  assert.equal(f.deterministic, true);
});

test('ccHigh: top_1=29 → no flag (below threshold)', () => {
  const r = detectFlags([mkExtraction({ concentration_top_1: 29 })], []);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'customer_concentration_high'));
});

test('ccHigh: top_1=62 → suppressed by EXTREME', () => {
  const r = detectFlags([mkExtraction({ concentration_top_1: 62 })], []);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'customer_concentration_high'));
  assert.ok(r.red_flags.find(x => x.flag_type === 'customer_concentration_extreme'));
});

test('ccHigh: null concentration → no flag, no crash', () => {
  const r = detectFlags([mkExtraction({ concentration_top_1: null })], []);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'customer_concentration_high'));
});

// ---------------------------------------------------------------------
// 2. customer_concentration_extreme (HIGH, top_1>=50 OR top_2>=70)
// ---------------------------------------------------------------------

test('ccExtreme: top_1=62 → flags HIGH', () => {
  const r = detectFlags([mkExtraction({ concentration_top_1: 62 })], []);
  const f = r.red_flags.find(x => x.flag_type === 'customer_concentration_extreme');
  assert.ok(f);
  assert.equal(f.severity, 'HIGH');
  assert.equal(f.evidence.actual_value, 62);
});

test('ccExtreme: top_1=45, top_2=86 → flags via top_2', () => {
  const r = detectFlags([mkExtraction({ concentration_top_1: 45, concentration_top_2: 86 })], []);
  const f = r.red_flags.find(x => x.flag_type === 'customer_concentration_extreme');
  assert.ok(f);
  assert.equal(f.evidence.actual_value, 86);
});

test('ccExtreme: top_1=49, top_2=69 → no flag', () => {
  const r = detectFlags([mkExtraction({ concentration_top_1: 49, concentration_top_2: 69 })], []);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'customer_concentration_extreme'));
});

test('ccExtreme: fires with Cerebras-like 86% case', () => {
  const r = detectFlags([mkExtraction({ source_name: 'Cerebras S-1 Filing', concentration_top_2: 86 })], []);
  const f = r.red_flags.find(x => x.flag_type === 'customer_concentration_extreme');
  assert.ok(f);
  assert.equal(f.evidence.source, 'Cerebras S-1 Filing');
});

// ---------------------------------------------------------------------
// 3. material_weakness (HIGH; regex + negation guard)
// ---------------------------------------------------------------------

test('materialWeakness: positive "we identified a material weakness" → HIGH flag', () => {
  const raw = mkRaw('In connection with our audit, we identified a material weakness in internal controls.');
  const r = detectFlags([], raw);
  const f = r.red_flags.find(x => x.flag_type === 'material_weakness');
  assert.ok(f);
  assert.equal(f.severity, 'HIGH');
  assert.ok(/material weakness/i.test(f.evidence.raw_text));
});

test('materialWeakness: negation "no material weakness identified" → no flag', () => {
  const raw = mkRaw('Our auditors concluded there was no material weakness identified in our internal controls.');
  const r = detectFlags([], raw);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'material_weakness'));
});

test('materialWeakness: negation "did not identify any material weakness" → no flag', () => {
  const raw = mkRaw('Management did not identify any material weakness as of the reporting date.');
  const r = detectFlags([], raw);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'material_weakness'));
});

test('materialWeakness: ignored when source_type != regulatory_filing', () => {
  const raw = [{ source_name: 'Press Release', source_type: 'press_release', text: 'We disclosed a material weakness.' }];
  const r = detectFlags([], raw);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'material_weakness'));
});

// ---------------------------------------------------------------------
// 4. going_concern (HIGH)
// ---------------------------------------------------------------------

test('goingConcern: "substantial doubt about our ability to continue as a going concern" → HIGH', () => {
  const raw = mkRaw('There is substantial doubt about our ability to continue as a going concern.');
  const r = detectFlags([], raw);
  assert.ok(r.red_flags.find(x => x.flag_type === 'going_concern'));
});

test('goingConcern: "no substantial doubt" → no flag', () => {
  const raw = mkRaw('Management believes there is no substantial doubt regarding our ongoing operations.');
  const r = detectFlags([], raw);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'going_concern'));
});

test('goingConcern: matches "going concern" phrase alone', () => {
  const raw = mkRaw('The auditor raised a going concern based on current cash reserves.');
  const r = detectFlags([], raw);
  assert.ok(r.red_flags.find(x => x.flag_type === 'going_concern'));
});

// ---------------------------------------------------------------------
// 5. related_party_above_threshold (MEDIUM; text presence)
// ---------------------------------------------------------------------

test('relatedParty: sentence mentioning "related party transaction" → MEDIUM flag', () => {
  const raw = mkRaw('The Company disclosed a related party transaction with its largest shareholder.');
  const r = detectFlags([], raw);
  const f = r.red_flags.find(x => x.flag_type === 'related_party_above_threshold');
  assert.ok(f);
  assert.equal(f.severity, 'MEDIUM');
});

test('relatedParty: no mention → no flag', () => {
  const raw = mkRaw('The Company has diversified revenue across unrelated enterprise customers.');
  const r = detectFlags([], raw);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'related_party_above_threshold'));
});

test('relatedParty: matches plural "related parties transaction"', () => {
  const raw = mkRaw('Certain related parties transactions were entered into during the period.');
  const r = detectFlags([], raw);
  assert.ok(r.red_flags.find(x => x.flag_type === 'related_party_above_threshold'));
});

// ---------------------------------------------------------------------
// 6. revenue_growth_anomalous (LOW; extracted >=500%)
// ---------------------------------------------------------------------

test('revenueGrowth: yoy=650 → LOW flag', () => {
  const r = detectFlags([mkExtraction({ revenue_growth_yoy: 650 })], []);
  const f = r.red_flags.find(x => x.flag_type === 'revenue_growth_anomalous');
  assert.ok(f);
  assert.equal(f.severity, 'LOW');
  assert.equal(f.evidence.actual_value, 650);
});

test('revenueGrowth: yoy=120 → no flag', () => {
  const r = detectFlags([mkExtraction({ revenue_growth_yoy: 120 })], []);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'revenue_growth_anomalous'));
});

test('revenueGrowth: yoy=500 (boundary) → flag', () => {
  const r = detectFlags([mkExtraction({ revenue_growth_yoy: 500 })], []);
  assert.ok(r.red_flags.find(x => x.flag_type === 'revenue_growth_anomalous'));
});

// ---------------------------------------------------------------------
// 7. burn_rate_runway_short (MEDIUM; cash/burn < 12 months)
// ---------------------------------------------------------------------

test('runway: cash=100M, burn=20M/mo → runway 5 months → MEDIUM flag', () => {
  const r = detectFlags([mkExtraction({ cash_balance: 100_000_000, monthly_burn: 20_000_000 })], []);
  const f = r.red_flags.find(x => x.flag_type === 'burn_rate_runway_short');
  assert.ok(f);
  assert.equal(f.severity, 'MEDIUM');
  assert.equal(f.evidence.actual_value, 5);
});

test('runway: cash=500M, burn=20M/mo → runway 25 months → no flag', () => {
  const r = detectFlags([mkExtraction({ cash_balance: 500_000_000, monthly_burn: 20_000_000 })], []);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'burn_rate_runway_short'));
});

test('runway: missing burn → no flag, no crash', () => {
  const r = detectFlags([mkExtraction({ cash_balance: 100_000_000, monthly_burn: null })], []);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'burn_rate_runway_short'));
});

test('runway: burn=0 → no flag (division guard)', () => {
  const r = detectFlags([mkExtraction({ cash_balance: 100_000_000, monthly_burn: 0 })], []);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'burn_rate_runway_short'));
});

// ---------------------------------------------------------------------
// 8. auditor_change_recent (MEDIUM; regex + negation)
// ---------------------------------------------------------------------

test('auditorChange: positive → MEDIUM flag', () => {
  const raw = mkRaw('The Board approved a change of auditor effective Q2 2025.');
  const r = detectFlags([], raw);
  assert.ok(r.red_flags.find(x => x.flag_type === 'auditor_change_recent'));
});

test('auditorChange: negation "auditor has not changed" → no flag', () => {
  const raw = mkRaw('The auditor has not changed during the past three fiscal years.');
  const r = detectFlags([], raw);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'auditor_change_recent'));
});

// ---------------------------------------------------------------------
// 9. dual_class_structure (LOW)
// ---------------------------------------------------------------------

test('dualClass: "Class A common stock" phrase → LOW flag', () => {
  const raw = mkRaw('Holders of our Class A common stock will have one vote per share.');
  const r = detectFlags([], raw);
  assert.ok(r.red_flags.find(x => x.flag_type === 'dual_class_structure'));
});

test('dualClass: "super-voting" matches', () => {
  const raw = mkRaw('Our founders hold super-voting shares entitling them to ten votes per share.');
  const r = detectFlags([], raw);
  assert.ok(r.red_flags.find(x => x.flag_type === 'dual_class_structure'));
});

test('dualClass: no mention → no flag', () => {
  const raw = mkRaw('The Company has a single class of common stock with equal voting rights.');
  const r = detectFlags([], raw);
  assert.ok(!r.red_flags.find(x => x.flag_type === 'dual_class_structure'));
});

// ---------------------------------------------------------------------
// 10. s1_previously_withdrawn (MEDIUM)
// ---------------------------------------------------------------------

test('s1Withdrawn: "previously withdrew" → MEDIUM flag', () => {
  const raw = mkRaw('We previously withdrew a prior registration statement in September 2024.');
  const r = detectFlags([], raw);
  assert.ok(r.red_flags.find(x => x.flag_type === 's1_previously_withdrawn'));
});

test('s1Withdrawn: "withdrawal of prior registration" phrase → flag', () => {
  const raw = mkRaw('Following the withdrawal of prior registration in 2024, we refiled in 2026.');
  const r = detectFlags([], raw);
  assert.ok(r.red_flags.find(x => x.flag_type === 's1_previously_withdrawn'));
});

test('s1Withdrawn: no mention → no flag', () => {
  const raw = mkRaw('This is our initial registration statement under the Securities Act.');
  const r = detectFlags([], raw);
  assert.ok(!r.red_flags.find(x => x.flag_type === 's1_previously_withdrawn'));
});

// ---------------------------------------------------------------------
// Integration: all-together CoreWeave-like scenario
// ---------------------------------------------------------------------

test('integration: CoreWeave-like scenario fires expected flags', () => {
  const doc = mkExtraction({
    source_name: 'CoreWeave S-1 Filing',
    concentration_top_2: 77, // two customers = 77%
    revenue_growth_yoy: 700, // hyper-growth
  });
  const raw = mkRaw(
    'We identified a material weakness in our internal controls during the audit. ' +
    'Holders of our Class B common stock will have ten votes per share, ' +
    'compared to one vote per share for our Class A common stock.',
    'CoreWeave S-1 Filing'
  );
  const r = detectFlags([doc], raw);
  const types = r.red_flags.map(f => f.flag_type);
  assert.ok(types.includes('customer_concentration_extreme'), 'missing concentration_extreme');
  assert.ok(types.includes('material_weakness'),              'missing material_weakness');
  assert.ok(types.includes('revenue_growth_anomalous'),       'missing revenue_growth_anomalous');
  assert.ok(types.includes('dual_class_structure'),           'missing dual_class_structure');
  // All flags MUST have deterministic: true
  for (const f of r.red_flags) assert.equal(f.deterministic, true);
});

test('integration: empty input → empty red_flags (no crash)', () => {
  const r = detectFlags([], []);
  assert.deepEqual(r.red_flags, []);
});

test('integration: output validates against RedFlagDetectorOutput schema', () => {
  // Requires the hand-rolled validator + schema file. Treat as smoke test.
  const { createValidator } = require('../json-schema-validator.js');
  const schemas = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', 'schemas', 'agent-output-schemas.json'), 'utf8'),
  );
  const v = createValidator(schemas);

  const doc = mkExtraction({ concentration_top_2: 86 });
  const raw = mkRaw('We identified a material weakness in financial reporting.');
  const r = detectFlags([doc], raw);
  const check = v.validateDef(r, 'RedFlagDetectorOutput');
  assert.deepEqual(check.errors, [], JSON.stringify(check.errors));
  assert.equal(check.valid, true);
});
