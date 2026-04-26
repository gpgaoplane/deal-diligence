// code/red-flag-detector.js
// ---------------------------------------------------------------------
// Deterministic red-flag detection. No LLM calls. No Math.random.
// No time-dependent logic. See invariant I-2 in .claude/memory/context.md.
//
// Design plan §2.7 is the authoritative spec.
// Output shape matches schemas/agent-output-schemas.json#/$defs/RedFlagDetectorOutput.
// ---------------------------------------------------------------------
'use strict';

// ----- Thresholds (all named constants; no magic numbers inline) -----
const CUSTOMER_CONCENTRATION_HIGH_PCT     = 30;   // single customer % of revenue
const CUSTOMER_CONCENTRATION_EXTREME_PCT  = 50;   // single customer % of revenue
const CUSTOMER_CONCENTRATION_TOP2_EXTREME = 70;   // top 2 combined % of revenue
const RELATED_PARTY_THRESHOLD_PCT         = 5;    // of revenue
const REVENUE_GROWTH_ANOMALOUS_PCT        = 500;  // YoY growth flag
const RUNWAY_SHORT_MONTHS                 = 12;   // cash / monthly burn
const AUDITOR_CHANGE_WINDOW_YEARS         = 2;    // (reserved; not used by current detector)

// ----- Regex patterns (with negation guards; per design plan §2.7) -----
// Rule: positive match AND no negation within the SAME sentence.
// All flags are case-insensitive; no /g — single match is sufficient.

const MATERIAL_WEAKNESS_POS = /(?:(?:identified|disclose[ds]?|found|reported|existence of|presence of)[^.!?]{0,60}material weakness(?:es)?|material weakness(?:es)?[^.!?]{0,30}(?:exist|remain|persist|are present|were noted|have been (?:identified|disclosed|found|noted|reported)))/i;
const MATERIAL_WEAKNESS_NEG = /(?:(?:no |without |absence of |did not (?:identify|find|disclose|report) (?:any )?|no such )material weakness|material weakness(?:es)?[^.!?]{0,30}(?:do not exist|no longer exist|have been remediated|were remediated|are no longer present))/i;

const GOING_CONCERN_POS = /(?:substantial doubt|going concern|ability to continue as a going concern)/i;
const GOING_CONCERN_NEG = /(?:no substantial doubt|without substantial doubt|no going concern|absence of going concern)/i;

const RELATED_PARTY_CONTEXT = /related part(?:y|ies) transaction/i;

const AUDITOR_CHANGE_POS = /(?:chang(?:e|ed|ing) of auditor|appoint(?:ed|ment of) new auditor|dismiss(?:ed|al of) (?:our|the) auditor)/i;
const AUDITOR_CHANGE_NEG = /(?:no (?:chang(?:e|es) of )?auditor|auditor (?:has )?not chang(?:e|ed))/i;

const DUAL_CLASS_POS = /(?:class [AB] common stock|super[- ]?voting|triple[- ]?class|dual[- ]?class share structure)/i;

const S1_WITHDRAWN_POS = /(?:previously (?:filed and )?withdrew|withdrawal of (?:prior |previous )?registration|previous S-?1 (?:was )?withdrawn)/i;

// ----- Helpers -----

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

/**
 * Iterate over regulatory_filing documents and return the first
 * {source_name, sentence} where POS matches without NEG in the same sentence.
 * Preserves per-document source attribution (lost by regulatoryTextOnly).
 * @returns {{source_name: string, sentence: string}|null}
 */
function firstRegulatoryMatch(documentsRaw, pos, neg) {
  for (const d of documentsRaw || []) {
    if (!d || d.source_type !== 'regulatory_filing') continue;
    const r = matchWithNegationGuard(d.text || '', pos, neg);
    if (r.matched) return { source_name: d.source_name || 'Regulatory filing', sentence: r.sentence };
  }
  return null;
}

/**
 * Safely read a nested numeric value from an ExtractionOutput-shaped object.
 * Returns null if any level is missing or the terminal value isn't a number.
 */
function readNum(obj, path) {
  let node = obj;
  for (const k of path) {
    if (node == null || typeof node !== 'object') return null;
    node = node[k];
  }
  return typeof node === 'number' && !Number.isNaN(node) ? node : null;
}

// ----- Individual detectors -----

/**
 * customer_concentration_high — MEDIUM. Single customer >=30% but <50% of revenue.
 * (Suppressed when the EXTREME threshold is also met — EXTREME supersedes.)
 */
function _detectCustomerConcentrationHigh(extractedPerDoc) {
  for (const doc of extractedPerDoc || []) {
    const top1 = readNum(doc, ['extracted_facts', 'customer_profile', 'concentration_top_1']);
    const top2 = readNum(doc, ['extracted_facts', 'customer_profile', 'concentration_top_2']);
    // EXTREME condition: don't double-flag
    const isExtreme =
      (top1 != null && top1 >= CUSTOMER_CONCENTRATION_EXTREME_PCT) ||
      (top2 != null && top2 >= CUSTOMER_CONCENTRATION_TOP2_EXTREME);
    if (isExtreme) continue;
    if (top1 != null && top1 >= CUSTOMER_CONCENTRATION_HIGH_PCT) {
      return {
        flag_type: 'customer_concentration_high',
        severity: 'MEDIUM',
        evidence: {
          actual_value: top1,
          threshold: CUSTOMER_CONCENTRATION_HIGH_PCT,
          source: doc.source_name || 'Extraction',
          raw_text: null,
        },
      };
    }
  }
  return null;
}

/**
 * customer_concentration_extreme — HIGH. Single customer >=50% OR top-2 combined >=70%.
 */
function _detectCustomerConcentrationExtreme(extractedPerDoc) {
  for (const doc of extractedPerDoc || []) {
    const top1 = readNum(doc, ['extracted_facts', 'customer_profile', 'concentration_top_1']);
    const top2 = readNum(doc, ['extracted_facts', 'customer_profile', 'concentration_top_2']);
    if (top1 != null && top1 >= CUSTOMER_CONCENTRATION_EXTREME_PCT) {
      return {
        flag_type: 'customer_concentration_extreme',
        severity: 'HIGH',
        evidence: {
          actual_value: top1,
          threshold: CUSTOMER_CONCENTRATION_EXTREME_PCT,
          source: doc.source_name || 'Extraction',
          raw_text: null,
        },
      };
    }
    if (top2 != null && top2 >= CUSTOMER_CONCENTRATION_TOP2_EXTREME) {
      return {
        flag_type: 'customer_concentration_extreme',
        severity: 'HIGH',
        evidence: {
          actual_value: top2,
          threshold: CUSTOMER_CONCENTRATION_TOP2_EXTREME,
          source: doc.source_name || 'Extraction',
          raw_text: null,
        },
      };
    }
  }
  return null;
}

/**
 * material_weakness — HIGH. Positive regex match in regulatory filing, no negation.
 */
function _detectMaterialWeakness(documentsRaw) {
  const m = firstRegulatoryMatch(documentsRaw, MATERIAL_WEAKNESS_POS, MATERIAL_WEAKNESS_NEG);
  if (!m) return null;
  return {
    flag_type: 'material_weakness',
    severity: 'HIGH',
    evidence: {
      actual_value: 'disclosed',
      threshold: null,
      source: m.source_name,
      raw_text: m.sentence,
    },
  };
}

/**
 * going_concern — HIGH. Positive regex match, no negation.
 */
function _detectGoingConcern(documentsRaw) {
  const m = firstRegulatoryMatch(documentsRaw, GOING_CONCERN_POS, GOING_CONCERN_NEG);
  if (!m) return null;
  return {
    flag_type: 'going_concern',
    severity: 'HIGH',
    evidence: {
      actual_value: 'disclosed',
      threshold: null,
      source: m.source_name,
      raw_text: m.sentence,
    },
  };
}

/**
 * related_party_above_threshold — MEDIUM. Regex match for related-party context
 * in a regulatory filing (our ExtractionOutput schema doesn't yet carry a
 * `related_party_pct_of_revenue` number, so we detect presence-in-text only).
 */
function _detectRelatedPartyAboveThreshold(extractedPerDoc, documentsRaw) {
  for (const d of documentsRaw || []) {
    if (!d || d.source_type !== 'regulatory_filing') continue;
    for (const s of splitSentences(d.text || '')) {
      if (RELATED_PARTY_CONTEXT.test(s)) {
        return {
          flag_type: 'related_party_above_threshold',
          severity: 'MEDIUM',
          evidence: {
            actual_value: 'disclosed',
            threshold: RELATED_PARTY_THRESHOLD_PCT,
            source: d.source_name || 'Regulatory filing',
            raw_text: s,
          },
        };
      }
    }
  }
  return null;
}

/**
 * revenue_growth_anomalous — LOW. YoY revenue growth >=500%.
 */
function _detectRevenueGrowthAnomalous(extractedPerDoc) {
  for (const doc of extractedPerDoc || []) {
    const g = readNum(doc, ['extracted_facts', 'financial_performance', 'revenue_growth_yoy', 'value']);
    if (g != null && g >= REVENUE_GROWTH_ANOMALOUS_PCT) {
      return {
        flag_type: 'revenue_growth_anomalous',
        severity: 'LOW',
        evidence: {
          actual_value: g,
          threshold: REVENUE_GROWTH_ANOMALOUS_PCT,
          source: doc.source_name || 'Extraction',
          raw_text: null,
        },
      };
    }
  }
  return null;
}

/**
 * burn_rate_runway_short — MEDIUM. cash / monthly_burn < 12 months.
 * Requires both cash_balance and monthly_burn to be extracted.
 */
function _detectBurnRateRunwayShort(extractedPerDoc) {
  for (const doc of extractedPerDoc || []) {
    const cash = readNum(doc, ['extracted_facts', 'financial_performance', 'cash_balance', 'value']);
    const burn = readNum(doc, ['extracted_facts', 'financial_performance', 'monthly_burn', 'value']);
    if (cash == null || burn == null || burn <= 0) continue;
    const runway = cash / burn;
    if (runway < RUNWAY_SHORT_MONTHS) {
      return {
        flag_type: 'burn_rate_runway_short',
        severity: 'MEDIUM',
        evidence: {
          actual_value: Math.round(runway * 10) / 10, // months, 1 dp
          threshold: RUNWAY_SHORT_MONTHS,
          source: doc.source_name || 'Extraction',
          raw_text: null,
        },
      };
    }
  }
  return null;
}

/**
 * auditor_change_recent — MEDIUM. Regex match with negation guard.
 */
function _detectAuditorChangeRecent(documentsRaw) {
  const m = firstRegulatoryMatch(documentsRaw, AUDITOR_CHANGE_POS, AUDITOR_CHANGE_NEG);
  if (!m) return null;
  return {
    flag_type: 'auditor_change_recent',
    severity: 'MEDIUM',
    evidence: {
      actual_value: 'disclosed',
      threshold: null,
      source: m.source_name,
      raw_text: m.sentence,
    },
  };
}

/**
 * dual_class_structure — LOW. Positive regex match (no negation guard needed —
 * mentions of dual/triple-class structure are rarely negated in regulatory prose).
 */
function _detectDualClassStructure(documentsRaw) {
  for (const d of documentsRaw || []) {
    if (!d || d.source_type !== 'regulatory_filing') continue;
    for (const s of splitSentences(d.text || '')) {
      if (DUAL_CLASS_POS.test(s)) {
        return {
          flag_type: 'dual_class_structure',
          severity: 'LOW',
          evidence: {
            actual_value: 'disclosed',
            threshold: null,
            source: d.source_name || 'Regulatory filing',
            raw_text: s,
          },
        };
      }
    }
  }
  return null;
}

/**
 * s1_previously_withdrawn — MEDIUM. Positive regex match.
 */
function _detectS1PreviouslyWithdrawn(documentsRaw) {
  for (const d of documentsRaw || []) {
    if (!d || d.source_type !== 'regulatory_filing') continue;
    for (const s of splitSentences(d.text || '')) {
      if (S1_WITHDRAWN_POS.test(s)) {
        return {
          flag_type: 's1_previously_withdrawn',
          severity: 'MEDIUM',
          evidence: {
            actual_value: 'disclosed',
            threshold: null,
            source: d.source_name || 'Regulatory filing',
            raw_text: s,
          },
        };
      }
    }
  }
  return null;
}

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
  const detectors = [
    () => _detectCustomerConcentrationHigh(extractedFactsPerDocument),
    () => _detectCustomerConcentrationExtreme(extractedFactsPerDocument),
    () => _detectMaterialWeakness(documentsRaw),
    () => _detectGoingConcern(documentsRaw),
    () => _detectRelatedPartyAboveThreshold(extractedFactsPerDocument, documentsRaw),
    () => _detectRevenueGrowthAnomalous(extractedFactsPerDocument),
    () => _detectBurnRateRunwayShort(extractedFactsPerDocument),
    () => _detectAuditorChangeRecent(documentsRaw),
    () => _detectDualClassStructure(documentsRaw),
    () => _detectS1PreviouslyWithdrawn(documentsRaw),
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
    firstRegulatoryMatch,
    readNum,
    // detectors exported for targeted tests
    _detectCustomerConcentrationHigh,
    _detectCustomerConcentrationExtreme,
    _detectMaterialWeakness,
    _detectGoingConcern,
    _detectRelatedPartyAboveThreshold,
    _detectRevenueGrowthAnomalous,
    _detectBurnRateRunwayShort,
    _detectAuditorChangeRecent,
    _detectDualClassStructure,
    _detectS1PreviouslyWithdrawn,
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
