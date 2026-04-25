// code/citation-validity.js
// ---------------------------------------------------------------------
// Citation Validity Check — Phase 3 task 3.10.
// Per design plan §3.1: layer-2 citation enforcement.
//
// Layer 1 (schema-level pattern regex on every citation string) is
// already enforced upstream by the validators wrapping each agent's
// JSON Schema. Layer 2 — implemented here — checks that every
// source_name prefix actually appears in the Coordinator's
// source_manifest. Unknown sources strip the claim from the memo
// and populate `unresolved_sources` for downstream surfacing.
//
// No LLM. No randomness. Pure function (memo, sourceManifest) -> result.
//
// Public output contract (matches schemas/agent-output-schemas.json
// EvaluatorOutput.unresolved_sources):
//   unresolved_sources: [{ claim, invalid_source_name }]
//   - `claim`              = the claim text (strength / risk / claim)
//   - `invalid_source_name` = the rejected source identifier
//                            (extracted name when regex matched, or
//                             the full citation when it was malformed)
//
// Internal diagnostic output (`dropped_claims`, `stats`, plus per-entry
// `reason` codes inside dropped_claims._unresolved) is preserved for
// debugging but is NOT part of the EvaluatorOutput contract.
// ---------------------------------------------------------------------
'use strict';

// Source-name prefix extractor.
// Matches the leading <CompanyName> <SourceTypeHuman> [(#N)] portion
// of any canonical citation. Mirrors the schema regex (citationFormat
// in schemas/agent-output-schemas.json) but only on the prefix half.
const SOURCE_NAME_PREFIX_RE = /^([A-Z][A-Za-z0-9 &.,'\-]+ (?:S-1 Filing|10-K Filing|10-Q Filing|8-K Filing|20-F Filing|Press Release|Analyst Report|Expert Transcript|Management Deck)(?: \(#\d+\))?) (?:p\. ~?\d+|Risk Factors p\. \d+)$/;

/**
 * Extract the source_name prefix from a single citation string.
 * Returns null if the citation doesn't match the canonical pattern.
 * @param {string} citation
 * @returns {string|null}
 */
function extractSourceName(citation) {
  if (typeof citation !== 'string') return null;
  const m = citation.match(SOURCE_NAME_PREFIX_RE);
  return m ? m[1] : null;
}

/**
 * Build the set of valid source names from the Coordinator's source_manifest.
 *
 * Accepts BOTH live shapes:
 *   - string array: ["CoreWeave S-1 Filing", "CoreWeave Press Release"]
 *     This is what the live Coordinator emits per design plan §2.2 and
 *     n8n/workflow.json.
 *   - object array: [{ source_name: "...", source_type: "...", ... }]
 *     This is what test fixtures and helper scripts may pass.
 *
 * @param {Array<string|{source_name: string}>} sourceManifest
 * @returns {Set<string>}
 */
function manifestNameSet(sourceManifest) {
  const out = new Set();
  for (const entry of sourceManifest || []) {
    if (typeof entry === 'string' && entry.length > 0) {
      out.add(entry);
    } else if (entry && typeof entry.source_name === 'string') {
      out.add(entry.source_name);
    }
  }
  return out;
}

/**
 * Filter an array of citation strings: keep only those whose source_name
 * prefix is in the manifest. Return the kept strings AND a list of the
 * unresolved (rejected) ones with reason codes + the rejected identifier.
 *
 * Reason codes (internal diagnostic):
 *   - "malformed"       — citation didn't match the canonical regex
 *   - "unknown_source"  — source_name prefix not in source_manifest
 *
 * Returned `unresolved` shape:
 *   { citation, reason, invalid_source_name }
 *   where invalid_source_name is the extracted source_name when the
 *   regex matched, or the full citation when it didn't.
 *
 * @param {string[]} citations
 * @param {Set<string>} validSources
 * @returns {{kept: string[], unresolved: Array<{citation: string, reason: string, invalid_source_name: string}>}}
 */
function filterCitations(citations, validSources) {
  const kept = [];
  const unresolved = [];
  for (const c of citations || []) {
    const name = extractSourceName(c);
    if (name === null) {
      unresolved.push({
        citation: typeof c === 'string' ? c : String(c),
        reason: 'malformed',
        invalid_source_name: typeof c === 'string' ? c : String(c),
      });
      continue;
    }
    if (!validSources.has(name)) {
      unresolved.push({
        citation: c,
        reason: 'unknown_source',
        invalid_source_name: name,
      });
      continue;
    }
    kept.push(c);
  }
  return { kept, unresolved };
}

/**
 * Walk a memo claim array (key_strengths, key_risks, contradictions),
 * stripping any claim whose `sources` are entirely unresolved after
 * filtering. Claims with at least one valid source survive (with
 * unresolved citations removed); claims with zero valid sources are
 * dropped from the memo and contribute their original citations to
 * the unresolved list.
 *
 * @param {Array<Object>} claims  array of claim objects with a `sources` field
 * @param {Set<string>} validSources
 * @param {string} claimType  'key_strengths' | 'key_risks' | 'contradictions'
 * @returns {{
 *   kept: Array<Object>,
 *   dropped: Array<Object>,
 *   unresolved_pairs: Array<{claim_text: string, claim_type: string, citation: string, reason: string, invalid_source_name: string}>
 * }}
 */
function filterClaimArray(claims, validSources, claimType) {
  const kept = [];
  const dropped = [];
  const unresolvedPairs = [];

  for (const claim of claims || []) {
    if (!claim || typeof claim !== 'object') continue;
    const claimText = claimTextOf(claim, claimType);
    const result = filterCitations(claim.sources, validSources);

    for (const u of result.unresolved) {
      unresolvedPairs.push({
        claim_text: claimText,
        claim_type: claimType,
        citation: u.citation,
        reason: u.reason,
        invalid_source_name: u.invalid_source_name,
      });
    }

    if (result.kept.length === 0) {
      dropped.push({ ...claim, _drop_reason: 'all_sources_unresolved' });
      continue;
    }
    kept.push({ ...claim, sources: result.kept });
  }
  return { kept, dropped, unresolved_pairs: unresolvedPairs };
}

/**
 * Extract the claim text from a claim object based on its array type.
 */
function claimTextOf(claim, claimType) {
  if (claimType === 'key_strengths') return typeof claim.strength === 'string' ? claim.strength : '';
  if (claimType === 'key_risks') return typeof claim.risk === 'string' ? claim.risk : '';
  if (claimType === 'contradictions') return typeof claim.claim === 'string' ? claim.claim : '';
  return '';
}

/**
 * Public entrypoint. Given a MemoGenerationOutput-shaped object and the
 * Coordinator's source_manifest (string array OR object array), return
 * a cleaned memo with only valid citations plus the list of unresolved
 * citations and dropped claims.
 *
 * Cleaning behavior (per design plan §3.1):
 *   - For key_strengths / key_risks / contradictions: any claim whose
 *     `sources` array becomes empty after filtering is dropped.
 *   - Surviving claims have their `sources` arrays restricted to the
 *     subset that maps to valid source_manifest entries.
 *   - Top-level memo fields (executive_summary, recommendation, etc.)
 *     are passed through unchanged — only sourced claim arrays are
 *     filtered.
 *   - missing_information arrays carry no citations, so they pass through.
 *
 * Returned shape (the `unresolved_sources` field is shaped to match
 * EvaluatorOutput.unresolved_sources in the schema):
 *
 *   {
 *     cleanedMemo:        <memo with filtered citations / dropped claims>,
 *     unresolved_sources: [
 *       { claim: "<claim text>", invalid_source_name: "<extracted name OR full citation>" }
 *     ],
 *     dropped_claims:     [...original claim objects that were dropped...],
 *     diagnostic: {
 *       unresolved_pairs: [...full per-citation entries with reason codes...]
 *     },
 *     stats: {
 *       claims_input:  <int>,
 *       claims_kept:   <int>,
 *       claims_dropped:<int>,
 *       citations_input:    <int>,
 *       citations_kept:     <int>,
 *       citations_unresolved: <int>
 *     }
 *   }
 *
 * @param {Object} memo  MemoGenerationOutput
 * @param {Array<string|{source_name: string, source_type?: string, file_id?: string}>} sourceManifest
 */
function validateCitations(memo, sourceManifest) {
  if (!memo || typeof memo !== 'object') {
    throw new Error('validateCitations: memo must be an object');
  }
  const validSources = manifestNameSet(sourceManifest);

  const claimArrays = ['key_strengths', 'key_risks', 'contradictions'];
  const cleaned = { ...memo };
  const allUnresolvedPairs = [];
  const droppedClaims = [];

  let claimsInput = 0;
  let claimsKept = 0;
  let claimsDropped = 0;
  let citationsInput = 0;
  let citationsKept = 0;

  for (const key of claimArrays) {
    const original = Array.isArray(memo[key]) ? memo[key] : [];
    claimsInput += original.length;
    for (const claim of original) {
      if (Array.isArray(claim?.sources)) citationsInput += claim.sources.length;
    }
    const result = filterClaimArray(original, validSources, key);
    cleaned[key] = result.kept;
    claimsKept += result.kept.length;
    claimsDropped += result.dropped.length;
    for (const c of result.kept) {
      if (Array.isArray(c.sources)) citationsKept += c.sources.length;
    }
    droppedClaims.push(...result.dropped);
    allUnresolvedPairs.push(...result.unresolved_pairs);
  }

  // Public schema-compliant unresolved_sources: { claim, invalid_source_name }.
  const unresolvedSources = allUnresolvedPairs.map((p) => ({
    claim: p.claim_text,
    invalid_source_name: p.invalid_source_name,
  }));

  return {
    cleanedMemo: cleaned,
    unresolved_sources: unresolvedSources,
    dropped_claims: droppedClaims,
    diagnostic: {
      unresolved_pairs: allUnresolvedPairs,
    },
    stats: {
      claims_input: claimsInput,
      claims_kept: claimsKept,
      claims_dropped: claimsDropped,
      citations_input: citationsInput,
      citations_kept: citationsKept,
      citations_unresolved: citationsInput - citationsKept,
    },
  };
}

module.exports = {
  validateCitations,
  // Exported for unit tests.
  _internal: {
    extractSourceName,
    manifestNameSet,
    filterCitations,
    filterClaimArray,
    claimTextOf,
    SOURCE_NAME_PREFIX_RE,
  },
};
