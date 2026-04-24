// code/red-flag-detector.js
// ---------------------------------------------------------------------
// Deterministic red-flag detection. No LLM calls. No Math.random.
// No time-dependent logic. See invariant I-2 in .claude/memory/context.md.
//
// Design plan §2.7 is the authoritative spec.
//
// This file is the Phase 2 SKELETON — constants + exported signature +
// empty helpers. Phase 3 task 3.P7 fills in the ten detectors.
// Phase 3 task 3.P7t adds ~35 unit tests (Node 22 --test runner).
// ---------------------------------------------------------------------
'use strict';

// ----- Thresholds (all named constants; no magic numbers inline) -----
const CUSTOMER_CONCENTRATION_HIGH_PCT     = 30;   // single customer % of revenue
const CUSTOMER_CONCENTRATION_EXTREME_PCT  = 50;   // single customer % of revenue
const CUSTOMER_CONCENTRATION_TOP2_EXTREME = 70;   // top 2 combined % of revenue
const RELATED_PARTY_THRESHOLD_PCT         = 5;    // of revenue
const REVENUE_GROWTH_ANOMALOUS_PCT        = 500;  // YoY growth flag
const RUNWAY_SHORT_MONTHS                 = 12;   // cash / monthly burn
const AUDITOR_CHANGE_WINDOW_YEARS         = 2;

// ----- Regex patterns (with negation guards; per design plan §2.7) -----
// Rule: positive match AND no negation within same sentence (±80 chars).
// All flags are case-insensitive; no /g — single match is sufficient.

const MATERIAL_WEAKNESS_POS = /(?:identified|disclose[ds]?|found|reported|existence of|presence of)[^.!?]{0,60}material weakness(?:es)?/i;
const MATERIAL_WEAKNESS_NEG = /(?:no |without |absence of |did not (?:identify|find|disclose|report) (?:any )?|no such )material weakness/i;

const GOING_CONCERN_POS = /(?:substantial doubt|going concern|ability to continue as a going concern)/i;
const GOING_CONCERN_NEG = /(?:no substantial doubt|without substantial doubt|no going concern|absence of going concern)/i;

const RELATED_PARTY_CONTEXT = /related part(?:y|ies) transaction/i;

const AUDITOR_CHANGE_POS = /(?:chang(?:e|ed|ing) of auditor|appoint(?:ed|ment of) new auditor|dismiss(?:ed|al of) (?:our|the) auditor)/i;
const AUDITOR_CHANGE_NEG = /(?:no (?:chang(?:e|es) of)? auditor|auditor (?:has )?not chang(?:e|ed))/i;

const DUAL_CLASS_POS = /(?:class [AB] common stock|super[- ]?voting|triple[- ]?class|dual[- ]?class share structure)/i;

const S1_WITHDRAWN_POS = /(?:previously (?:filed and )?withdrew|withdrawal of (?:prior |previous )?registration|previous S-?1 (?:was )?withdrawn)/i;

// ----- Helpers (skeleton) -----

/**
 * Split raw text into sentences for negation-context checking.
 * Handles ., !, ? followed by whitespace. Naive but sufficient for regulatory prose.
 * @param {string} text
 * @returns {string[]}
 */
function splitSentences(text) {
  if (!text) return [];
  return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
}

/**
 * True iff POS matches inside some sentence AND that same sentence does NOT match NEG.
 * @param {string} text
 * @param {RegExp} pos
 * @param {RegExp|null} neg
 * @returns {{matched: boolean, sentence: string|null}}
 */
function matchWithNegationGuard(text, pos, neg) {
  for (const s of splitSentences(text)) {
    if (pos.test(s) && !(neg && neg.test(s))) {
      return { matched: true, sentence: s };
    }
  }
  return { matched: false, sentence: null };
}

/**
 * Scope raw text to regulatory_filing sources only for regex flags.
 * @param {Array<{source_name: string, source_type: string, text: string}>} documentsRaw
 * @returns {string} concatenated regulatory-filing text
 */
function regulatoryTextOnly(documentsRaw) {
  return (documentsRaw || [])
    .filter(d => d && d.source_type === 'regulatory_filing')
    .map(d => d.text || '')
    .join('\n\n');
}

// ----- Individual detectors (Phase 3 task 3.P7 fills in) -----

function _detectCustomerConcentrationHigh(extracted)     { /* TODO 3.P7 */ return null; }
function _detectCustomerConcentrationExtreme(extracted)  { /* TODO 3.P7 */ return null; }
function _detectMaterialWeakness(regText)                { /* TODO 3.P7 */ return null; }
function _detectGoingConcern(regText)                    { /* TODO 3.P7 */ return null; }
function _detectRelatedPartyAboveThreshold(e, regText)   { /* TODO 3.P7 */ return null; }
function _detectRevenueGrowthAnomalous(extracted)        { /* TODO 3.P7 */ return null; }
function _detectBurnRateRunwayShort(extracted)           { /* TODO 3.P7 */ return null; }
function _detectAuditorChangeRecent(regText)             { /* TODO 3.P7 */ return null; }
function _detectDualClassStructure(regText)              { /* TODO 3.P7 */ return null; }
function _detectS1PreviouslyWithdrawn(regText)           { /* TODO 3.P7 */ return null; }

// ----- Public entrypoint -----

/**
 * Run all deterministic red-flag detectors against the deal packet.
 *
 * @param {Object[]} extractedFactsPerDocument
 *   Array of ExtractionOutput objects (one per ingested document),
 *   shape per schemas/agent-output-schemas.json#/$defs/ExtractionOutput.
 * @param {Object[]} documentsRaw
 *   Array of { source_name, source_type, text } — raw document text,
 *   used for regex-based detectors scoped to regulatory filings.
 * @returns {{ red_flags: Array<Object> }}
 *   Shape per schemas/agent-output-schemas.json#/$defs/RedFlagDetectorOutput.
 *   Every entry has `deterministic: true` — the governance field that
 *   distinguishes rule-based flags from LLM analysis in downstream consumers.
 */
function detectFlags(extractedFactsPerDocument, documentsRaw) {
  const regText = regulatoryTextOnly(documentsRaw);
  const detectors = [
    () => _detectCustomerConcentrationHigh(extractedFactsPerDocument),
    () => _detectCustomerConcentrationExtreme(extractedFactsPerDocument),
    () => _detectMaterialWeakness(regText),
    () => _detectGoingConcern(regText),
    () => _detectRelatedPartyAboveThreshold(extractedFactsPerDocument, regText),
    () => _detectRevenueGrowthAnomalous(extractedFactsPerDocument),
    () => _detectBurnRateRunwayShort(extractedFactsPerDocument),
    () => _detectAuditorChangeRecent(regText),
    () => _detectDualClassStructure(regText),
    () => _detectS1PreviouslyWithdrawn(regText),
  ];
  const red_flags = [];
  for (const d of detectors) {
    const flag = d();
    if (flag) red_flags.push({ ...flag, deterministic: true });
  }
  return { red_flags };
}

module.exports = {
  detectFlags,
  // Exported for unit tests (Phase 3 task 3.P7t).
  _internal: {
    splitSentences,
    matchWithNegationGuard,
    regulatoryTextOnly,
    constants: {
      CUSTOMER_CONCENTRATION_HIGH_PCT,
      CUSTOMER_CONCENTRATION_EXTREME_PCT,
      CUSTOMER_CONCENTRATION_TOP2_EXTREME,
      RELATED_PARTY_THRESHOLD_PCT,
      REVENUE_GROWTH_ANOMALOUS_PCT,
      RUNWAY_SHORT_MONTHS,
      AUDITOR_CHANGE_WINDOW_YEARS,
    },
    patterns: {
      MATERIAL_WEAKNESS_POS,
      MATERIAL_WEAKNESS_NEG,
      GOING_CONCERN_POS,
      GOING_CONCERN_NEG,
      RELATED_PARTY_CONTEXT,
      AUDITOR_CHANGE_POS,
      AUDITOR_CHANGE_NEG,
      DUAL_CLASS_POS,
      S1_WITHDRAWN_POS,
    },
  },
};
