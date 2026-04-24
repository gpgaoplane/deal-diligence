---
status: active
type: design-plan
owner: shared
last-updated: 2026-04-24T03:00:00-04:00
read-if: "you need component internals, data contracts, failure modes, or evaluation spec — this is the authoritative design for the build phases"
skip-if: "your question is only about project scope (CONTEXT.md) or phase sequencing (2026-04-24-deal-diligence-implementation.md)"
related: [CONTEXT.md, DESIGN.md, IMPLEMENTATION.md, 2026-04-24-deal-diligence-implementation.md, schemas/agent-output-schemas.json]
---

# Deal Diligence Design Plan — 2026-04-24

## §0 — Purpose and relation to originals

This document is the authoritative design specification for the build phases of the Sagard AI Deal Diligence Workspace. It supersedes the root `DESIGN.md` (v1, 2026-04-23) by refining component contracts, schema-validation machinery, citation enforcement, meta-evaluation, and failure modes into spec-precision artifacts that Phase 3 can implement without ambiguity.

**Authority hierarchy:**
- `CONTEXT.md §5` + `§5.10` — scope-locked decisions and rationales (do not modify).
- `DESIGN.md` (original, at root) — `status: reference-only` as of this plan's commit. Its content remains accurate at the level of philosophy and component purpose; where this plan refines a section, this plan wins.
- `.claude/memory/context.md` I-1…I-7 — project invariants; this plan does not restate them, only references by ID.

Explicit diff from the original `DESIGN.md` is in §14.

## §1 — Invariants (non-negotiable design axioms)

All component designs below must satisfy these. Referenced by ID throughout. Full statements in `.claude/memory/context.md`.

| ID | Invariant | Where it binds |
|---|---|---|
| I-1 | Human-in-the-loop on advance/pass decision | §2.9 Memo output shape; §2.13 Slack format |
| I-2 | Red Flag Detector is deterministic JS, never LLM | §2.7 entire section |
| I-3 | Citation enforcement at schema level (format) + post-validation (validity) | §2.9, §3.1, §3.2 |
| I-4 | Framework-per-agent specialist pattern | §2.4–§2.10 each name their framework |
| I-5 | `n8n/workflow.json` is source of truth | Implementation plan, not design |
| I-6 | Swappable components via single `Set` node | §2.3 embeddings, §2.4–§2.10 LLM config |
| I-7 | Three-doc authority with scope-locked vs framework-aligned split | Authority hierarchy above |

## §2 — Per-component contracts

### §2.1 — Form Trigger

**Purpose.** Entry point for deal evaluation requests. Exposed at `/webhook/deal-diligence` on local n8n (`http://localhost:5678/webhook/deal-diligence`).

**Input contract (form schema):**

| Field | Type | Required | Validation |
|---|---|---|---|
| `company_name` | text | yes | 1–120 chars, trimmed |
| `documents` | file[] | yes | 2–4 files; each ≤ 25 MB; MIME `application/pdf` only |

**Output (to Coordinator):** the parsed form payload with uploaded file binaries (n8n native form trigger output shape — no transformation in this node).

**Failure behavior.** Invalid file count, missing name, or non-PDF uploads return HTTP 400 with a field-level error list. The workflow does not enter the Coordinator in these cases.

### §2.2 — Coordinator (run metadata + source manifest)

**Purpose.** Initialize the run: generate identifiers, normalize source names, emit the authoritative source manifest consumed downstream.

**Output schema:**

```json
{
  "run_id": "<uuid v4>",
  "deal_id": "<slug>",
  "company_name": "<original input>",
  "timestamp_started": "<ISO-8601 UTC>",
  "documents": [
    {
      "file_id": "<uuid v4>",
      "filename": "<original filename>",
      "source_name": "<normalized canonical name>",
      "source_type": "regulatory_filing | press_release | analyst_report | expert_transcript | management_deck",
      "mime": "application/pdf",
      "bytes": "<number>"
    }
  ],
  "source_manifest": ["<source_name>", "..."]
}
```

**`deal_id` slug rules (deterministic).** `company_name.toLowerCase()` → strip diacritics → replace `/[^a-z0-9]+/g` with `-` → trim leading/trailing `-`. Collision behavior: `deal_id` may repeat across runs; uniqueness is at `run_id` level. No suffix hash.

**`source_name` normalization (canonical format):** `"<CompanyName> <SourceTypeHuman>"`.

- Human labels: `regulatory_filing` → `"S-1 Filing"` (or `"10-K Filing"` by filename match), `press_release` → `"Press Release"`, `analyst_report` → `"Analyst Report"`, `expert_transcript` → `"Expert Transcript"`, `management_deck` → `"Management Deck"`.
- Multiple of same type: suffix with ` (#2)`, ` (#3)`, etc., in upload order.
- Examples: `"Cerebras S-1 Filing"`, `"CoreWeave Press Release"`, `"Cerebras Analyst Report (#2)"`.

**`source_type` classifier — deterministic filename-regex table (no LLM).** Applied case-insensitive to the filename (not the path). First match wins; ordering matters.

| Pattern (tested in order) | source_type |
|---|---|
| `\b(s-?1|10-?k|10-?q|8-?k|20-?f|prospectus)\b` | `regulatory_filing` |
| `\b(press[\s\-_]release|announce(?:ment)?|newswire)\b` | `press_release` |
| `\b(teardown|analysis|report|breakdown|case[\s\-_]study)\b` | `analyst_report` |
| `\b(transcript|call|interview)\b` | `expert_transcript` |
| `\b(deck|presentation|pitch|slide)\b` | `management_deck` |
| (no match) | `regulatory_filing` (safest default — most diligence starts with filings) |

**Timestamps.** ISO 8601 with UTC offset, e.g., `2026-04-24T14:22:00Z`. Downstream logs and Supabase records use the same format.

### §2.3 — Document ingestion pipeline

**Purpose.** PDFs → retrievable chunks with source metadata.

**Pipeline (n8n nodes, in order):**

1. **Extract from File** (native) — PDF binary → raw text per document. Emits `{ text, pageCount }`.
2. **Set node — per-chunk metadata base** — establishes the parameterized LLM/embedding config consumed downstream:
   ```
   LLM_BASE_URL       = env ALICLOUD_BASE_URL
   LLM_MODEL          = env ALICLOUD_MODEL (default qwen3.5-plus)
   EMBED_MODEL        = env ALICLOUD_EMBEDDING_MODEL (default text-embedding-v3)
   CHUNK_SIZE         = 1000   # tokens
   CHUNK_OVERLAP      = 100    # tokens
   RETRIEVAL_K_SECTION = 5
   RETRIEVAL_K_UNION   = 8
   ```
   This single `Set` node is the swap point for I-6 (swappable components).
3. **Recursive Character Text Splitter** — chunk_size = 1000 tokens, overlap = 100 tokens. Token counts via `tiktoken` (cl100k_base approximation — acceptable drift for Qwen3.5-Plus).
4. **HTTP Request — embed** — POST to `${LLM_BASE_URL}/embeddings` with `model: EMBED_MODEL, input: chunk.text`. Retry policy per §6.
5. **Simple Vector Store (insert mode)** — stores embeddings. Per-document collections: each source's chunks live in its own collection (enables per-document retrieval in §2.4).

**Per-chunk metadata:**

```json
{
  "source_name": "Cerebras S-1 Filing",
  "source_type": "regulatory_filing",
  "file_id": "<uuid matching Coordinator>",
  "chunk_index": 42,
  "page_estimate": 23,
  "char_offset_start": 28000,
  "char_offset_end": 28980,
  "run_id": "<uuid matching Coordinator>"
}
```

**Note on `page_estimate`.** True page attribution requires PDF text extraction with per-page markers, which many n8n "Extract from File" outputs don't provide cleanly. `page_estimate` is computed from `char_offset_start / avg_chars_per_page`. Citations will use `"p. ~23"` notation when estimated; exact when extractable. The citation-validity check (§3.1) accepts both.

**Scope of lifetime.** Simple Vector Store is in-memory and resets per run (invariant). This is intentional: each deal gets a fresh retrieval context. Production would migrate to Supabase pgvector.

### §2.4 — Extraction Agent

**Framework.** IC Memo Taxonomy (11 sections; see CONTEXT.md §5.5).

**Retrieval pattern (section-targeted + union — addresses cross-cutting facts).**

For each of the 11 taxonomy sections:
- Issue one semantic retrieval against the current document's vector-store collection with `k = RETRIEVAL_K_SECTION (=5)`.
- Query string is the section header + 3–5 hand-picked keywords (e.g., Financial Performance: `"financial performance revenue gross margin operating loss net loss"`).

Plus one **union retrieval** against the full document with `k = RETRIEVAL_K_UNION (=8)`, query = `"risk factors customer concentration material weakness related party going concern debt"`. This captures cross-cutting facts (customer concentration %, material weaknesses, related-party transactions, going-concern language) that typically live in Risk Factors but bind into Financial Performance and Customer Profile sections.

Total: **12 retrievals per document × up to 4 documents = 48 retrievals per run** (upper bound). Chunks are union-merged per source into one context bundle passed to the Extraction Agent call.

**Token budget per Extraction invocation:** 11 sections × 5 chunks × ~1000 tokens + union 8 × 1000 + prompt overhead (~2K) ≈ **63K–68K input tokens per document**. Qwen3.5-Plus context window comfortably fits.

**Prompt structure.** Conforms to the 7-part checklist in `docs/project-conventions.md §3`:
1. Role — investment analyst mapping this document to IC Memo Taxonomy.
2. Framework — the 11-section taxonomy, with brief definition of each section.
3. Input — retrieved chunks with per-chunk metadata (source_name, page_estimate, chunk_index).
4. Output schema — full JSON as §4 / `schemas/agent-output-schemas.json#/$defs/ExtractionOutput`.
5. Constraints — no hallucination, no uncited claims, null-valued facts keep `citation: null`.
6. Edge cases — if a section has no retrievable content, emit the section with all `null` values and `citations: []`.
7. Citation rules — every fact's citation string format is `"<source_name> <locator>"` where locator is `p. <num>`, `p. ~<num>` (estimated), `§<section>`, or `Risk Factors p. <num>`.

**Output JSON Schema.** Authoritative definition in `schemas/agent-output-schemas.json#/$defs/ExtractionOutput` (draft-07). Shape matches original DESIGN.md §4.1; null-union encoding uses proper `"type": ["number", "null"]` (not the `"number|null"` pseudo-syntax from the original). Citation field pattern regex: `^[A-Z][A-Za-z0-9 ]+ (S-1 Filing|10-K Filing|10-Q Filing|Press Release|Analyst Report|Expert Transcript|Management Deck)( \(#\d+\))? (p\. ~?\d+|§[A-Za-z0-9\. ]+|Risk Factors p\. \d+)$` (illustrative — see the committed schema file for the exact production regex).

**Per-document invocation.** Extraction runs once per document (via n8n Split In Batches or parallel AI Agent nodes in a loop).

### §2.5 — Contradiction Agent

**Framework.** Triangulation Analysis (classifications: CORROBORATED, UNCONTRADICTED, DISPUTED, UNSUPPORTED).

**Tool-use decision — deferred to Phase 2 spike 2.0a, recorded as D-2 in `.claude/memory/decisions.md`.**

Two prompt variants are written (both committed to `prompts/`, selected at wire time per D-2):

- **Variant A — tool-use mode** (`prompts/contradiction-agent.tool-use.md`). Agent has Simple Vector Store as an n8n AI Agent tool. Agent issues retrieval queries on demand. k per query = 5.
- **Variant B — stuffed-context mode** (`prompts/contradiction-agent.stuffed.md`). Agent receives the union of all documents' Extraction outputs (with their citations) as context — no retrieval calls. Sized for ~80K input tokens across 4 documents.

**Input contract:**
- All documents' Extraction Agent outputs (structured JSON).
- In Variant A only: access to the Simple Vector Store tool (per-document or union collection).

**Output JSON Schema.** `schemas/agent-output-schemas.json#/$defs/ContradictionOutput`. Shape matches original DESIGN.md §4.2 with null-union fixes. Classification enum: `["CORROBORATED", "UNCONTRADICTED", "DISPUTED", "UNSUPPORTED"]`.

**Severity calibration.** HIGH = material impact on investment thesis; MEDIUM = factually significant but non-material; LOW = minor discrepancy. The prompt provides 2 concrete examples per severity level.

**Citation rule.** Every DISPUTED entry must cite both sides (sources_making_claim AND contradicting_evidence). Schema enforces `sources_making_claim.minItems: 1` and `contradicting_evidence.minItems: 1` when classification is DISPUTED.

### §2.6 — Gap Analysis Agent

**Framework.** Institutional LP Diligence Checklist (categories: financial, commercial, operational, legal_regulatory; see original DESIGN.md §3.6 for the full checklist — preserved verbatim).

**Retrieval strategy.** Union top-k=6 retrieval against all documents, query = `"audited financials unit economics customer concentration cohort retention covenant related party litigation"`. This is a coverage check, not fact extraction — so the retrieval priors point at known LP-checklist items.

**Input:** Extraction outputs (all docs) + Contradiction output + union retrieval chunks.

**Output JSON Schema.** `schemas/agent-output-schemas.json#/$defs/GapAnalysisOutput`. Shape matches original DESIGN.md §4.3.

**Importance calibration rule.** Prompt specifies: importance is calibrated to deal stage inferred from Extraction's `deal_structure` and `company_overview` sections.

### §2.7 — Red Flag Detector (deterministic JS)

**This section is load-bearing for the governance story. No LLM. No randomness. No time-dependent logic. Pure functions only.** See I-2.

**Module location.** `code/red-flag-detector.js`.

**Export signature:**

```js
/**
 * @param {ExtractionOutput[]} extractedFactsPerDocument - array of Extraction outputs
 * @param {Array<{ source_name: string, text: string }>} documentsRaw - concatenated raw text per source (for regex matching)
 * @returns {{ red_flags: RedFlag[] }}
 */
function detectFlags(extractedFactsPerDocument, documentsRaw) { ... }
```

**Constants block (top of file).** All thresholds named, no magic numbers inline:

```js
const CUSTOMER_CONCENTRATION_HIGH_PCT      = 30;  // single-customer % of revenue
const CUSTOMER_CONCENTRATION_EXTREME_PCT   = 50;  // single-customer % of revenue
const CUSTOMER_CONCENTRATION_TOP2_EXTREME  = 70;  // top 2 combined % of revenue
const RELATED_PARTY_THRESHOLD_PCT          = 5;   // of revenue
const REVENUE_GROWTH_ANOMALOUS_PCT         = 500; // YoY growth flag
const RUNWAY_SHORT_MONTHS                  = 12;  // cash / burn
const AUDITOR_CHANGE_WINDOW_YEARS          = 2;
```

**Regex scoping rule.** Regex-based flags (`material_weakness`, `going_concern`, `related_party`, `s1_previously_withdrawn`) are matched **only within regulatory-filing documents** (source_type === 'regulatory_filing') AND **only inside Risk Factors / Management Discussion sections** when section delimiters are recoverable. Fallback: whole-document match with negation-guarded regex. This reduces false-positives on boilerplate disclaimers.

**Regex patterns (with negation guards):**

```js
// Match "material weakness" but not "no material weakness", "did not identify any material weakness",
// "absence of material weaknesses", "no such material weakness", "without material weakness".
const MATERIAL_WEAKNESS_POS = /(?:identified|disclose[ds]?|found|reported|existence of|presence of) [^.]{0,40}material weakness(?:es)?/i;
const MATERIAL_WEAKNESS_NEG = /(?:no |without |absence of |did not (?:identify|find|disclose|report) (?:any )?|no such )material weakness/i;
// Rule: positive match AND no negation within same sentence (±80 chars).

// Going concern: similar structure.
const GOING_CONCERN_POS = /(?:substantial doubt|going concern|ability to continue as a going concern)/i;
const GOING_CONCERN_NEG = /(?:no substantial doubt|without substantial doubt|no going concern)/i;
```

All regex flags declare `i` (case-insensitive); no `g` flag (single match is sufficient for detection). Position-independent; evaluated per sentence (split on `[.!?]` followed by whitespace).

**Full flag table (preserved from original DESIGN.md §3.7 with refined detection logic):**

| flag_type | Detection logic | Severity | Source domain |
|---|---|---|---|
| `customer_concentration_high` | `extraction.customer_profile.concentration_top_1 >= 30` | MEDIUM | Extraction |
| `customer_concentration_extreme` | `concentration_top_1 >= 50` OR `concentration_top_5 ?? concentration_top_2 >= 70` | HIGH | Extraction |
| `material_weakness` | `MATERIAL_WEAKNESS_POS` matches in Risk Factors of any regulatory_filing AND no negation in same sentence | HIGH | Raw text |
| `going_concern` | `GOING_CONCERN_POS` matches AND no negation | HIGH | Raw text |
| `related_party_above_threshold` | Extracted `related_party_pct_of_revenue >= 5` OR regex match `related part(y|ies) transaction` within 60 chars of `%` numeric | MEDIUM | Extraction + raw |
| `revenue_growth_anomalous` | `extraction.financial_performance.revenue_growth_yoy.value >= 500` | LOW | Extraction |
| `burn_rate_runway_short` | `computed_runway_months < 12` where `runway = cash / monthly_burn` if both present | MEDIUM | Extraction (derived) |
| `auditor_change_recent` | Filename/text match `auditor chang` within `regulatory_filing`; no negation | MEDIUM | Raw text |
| `dual_class_structure` | Text match `class [AB] common stock` OR `super[- ]?voting shares` OR `triple[- ]?class` in any regulatory filing | LOW | Raw text |
| `s1_previously_withdrawn` | Text match `previously (?:filed and )?withdrew` OR `withdrawal of (?:prior |previous )?registration` | MEDIUM | Raw text |

**Unit test plan (`code/test/red-flag-detector.test.js`, Node 22 `--test` runner).** Target: ~35 tests total, 3–4 per flag covering positive assertion, primary negation variant, and one edge case (short text, ALL CAPS, adjacent punctuation). Not 100 — the marginal signal beyond ~35 is small and the timeline doesn't support it.

**Invocation pattern.** Called from an n8n Code node wrapping the module. Input bound from upstream Gap Analysis output (carrying through extraction facts) + raw text retrieved from Simple Vector Store (a retrieval with k=0 returns stored metadata; we recover raw text via a separate n8n Get node pointing at the vector store's document collection).

**Output JSON Schema.** `schemas/agent-output-schemas.json#/$defs/RedFlagDetectorOutput`. Shape matches original DESIGN.md §4.4; every entry has `"deterministic": true` — this boolean is the governance field that distinguishes rule-based flags from LLM analysis in downstream consumers.

### §2.8 — Portfolio Fit Agent

**Framework.** Sagard Thesis Alignment (strategic fit, stage fit, synergy potential, anti-pattern check; see DESIGN.md §3.8).

**Static portfolio data: `code/sagard-portfolio.json`.** Schema:

```json
{
  "portfolio_companies": [
    {
      "name": "KOHO",
      "sector": "fintech",
      "sub_sector": "neobank_cards",
      "stage": "series_d",
      "investment_year": 2021,
      "thesis_pillar": "consumer_fintech",
      "geography": "CA",
      "synergy_keywords": ["spending", "cards", "banking", "consumer_accounts"]
    },
    {
      "name": "Wealthsimple",
      "sector": "fintech",
      "sub_sector": "digital_wealth",
      "stage": "growth",
      "investment_year": 2017,
      "thesis_pillar": "consumer_fintech",
      "geography": "CA",
      "synergy_keywords": ["investing", "wealth", "retirement", "crypto", "brokerage"]
    },
    {
      "name": "Boosted.AI",
      "sector": "fintech",
      "sub_sector": "investment_ai",
      "stage": "series_b",
      "investment_year": 2022,
      "thesis_pillar": "ai_in_finance",
      "geography": "CA",
      "synergy_keywords": ["portfolio_management", "ai", "quantitative", "asset_managers"]
    }
  ],
  "thesis_pillars": [
    { "name": "consumer_fintech", "focus": "Consumer financial services, neobanks, payments." },
    { "name": "ai_in_finance", "focus": "AI/ML applications in institutional finance." },
    { "name": "healthtech", "focus": "Digital health, care delivery, healthcare payers." },
    { "name": "climate_tech", "focus": "Clean energy, carbon, climate mitigation." }
  ],
  "anti_patterns": [
    { "pattern": "large-cap AI infrastructure IPO ($10B+)", "reason": "Outside Sagard's typical check size; public-market exposure deviates from alternative-asset strategy." },
    { "pattern": "speculative web3 protocols", "reason": "Absent from disclosed thesis pillars." },
    { "pattern": "early-stage single-founder deeptech with no commercial traction", "reason": "Sagard's stage focus is series B+." }
  ]
}
```

This seed set is deliberately minimal (3 portfolio companies + 4 pillars + 3 anti-patterns). Full production would pull from Sagard's actual portfolio data (see Extension Points §8).

**Input:** Extraction output (all docs) + `sagard-portfolio.json` (loaded via n8n Read File).

**Output JSON Schema.** `schemas/agent-output-schemas.json#/$defs/PortfolioFitOutput`. Shape matches original DESIGN.md §3.8 output.

**Recommended action rule.** `recommended_action ∈ {pass, pursue, advance_to_deep_diligence}`. This is **directional only** (I-1). The schema comment on this field reads: "Directional signal surfaced for the human reviewer. Does not constitute a recommendation. Final advance/pass judgment is human."

### §2.9 — Memo Generation Agent

**Framework.** IC Memo Structure with Citation Enforcement.

**Input contract.** The union of all upstream outputs (Extraction ×N, Contradiction, Gap Analysis, Red Flag Detector, Portfolio Fit) passed as a single JSON payload. Total size: ~40–60 KB JSON for a 4-document deal; token count ~12–18K after serialization — fits Qwen3.5-Plus context comfortably alongside the prompt.

**Output JSON Schema.** `schemas/agent-output-schemas.json#/$defs/MemoGenerationOutput`. Shape matches original DESIGN.md §4.5 with corrected null-union syntax and strict citation constraints.

**Citation enforcement — two-layer precision (addresses advisor's "half-true claim" concern).**

**Layer 1: Schema-level format enforcement.** Every element in `key_strengths[].sources`, `key_risks[].sources`, and `contradictions[].sources` must:
- `minItems: 1` — claim has at least one source.
- `pattern` — each source string matches the canonical citation regex (§2.4).

Failure at this layer = schema validation failure = retry per §3.3.

**Layer 2: Post-validation validity enforcement.** A dedicated n8n Code node (§3.1) downstream of schema validation consumes the memo AND the Coordinator's `source_manifest`. For every `sources[]` entry, extracts the `source_name` prefix (everything before the locator) and asserts it is in `source_manifest`. If any source is unknown:
- Offending claim is marked `UNSUPPORTED` and stripped from the memo.
- The Evaluator Agent is informed via an `unresolved_sources` field.
- The memo proceeds with the remaining claims.

**Prompt-level additional rule.** The system prompt explicitly tells the agent: "If you cannot cite a claim with a source from the provided manifest, mark it UNSUPPORTED and omit from the final memo. Do not invent citations."

### §2.10 — Evaluator Agent

**Framework.** Six-Criteria Quality Check (see DESIGN.md §3.10).

**Output JSON Schema.** `schemas/agent-output-schemas.json#/$defs/EvaluatorOutput`. Shape matches DESIGN.md §4.6.

**Routing thresholds:**
- `evaluator_score < 35` → `flagged_for_review`
- `35 ≤ evaluator_score < 50` → `complete`
- `evaluator_score ≥ 50` → `complete_high_confidence`

**Critical-issue override.** Any `critical_issues` entry with severity HIGH forces `routing_decision = flagged_for_review` regardless of score.

**Calibration strategy.** See §4 Meta-evaluation.

### §2.11 — Persistence (Supabase)

**DDL source of truth.** `CONTEXT.md §5.8`. The existing DDL already provides a `source_documents JSONB` column; this plan binds to it.

**`source_documents` shape (persisted per run):**

```json
[
  {
    "source_name": "Cerebras S-1 Filing",
    "source_type": "regulatory_filing",
    "file_id": "<uuid>",
    "filename": "<original>",
    "bytes": 3452910,
    "page_count": 312
  }
]
```

This is the authoritative audit record: three months later, an auditor opening this row can verify `"Cerebras S-1 Filing"` was actually ingested. The citation-validity check (§3.1) cross-references this during the run.

**`evaluator_feedback` shape.** The existing schema defines `evaluator_feedback JSONB`. This plan defines its canonical sub-keys:

```json
{
  "evaluator_score": 47,
  "criteria_scores": { ... },
  "critical_issues": [ ... ],
  "routing_decision": "complete",
  "schema_errors": [
    { "agent": "memo_generation", "error_path": "key_risks[2].sources", "message": "minItems violated" }
  ],
  "unresolved_sources": [
    { "claim": "...", "invalid_source_name": "Fabricated Report" }
  ]
}
```

`schema_errors` is populated only on retry-fail paths (§3.3). `unresolved_sources` is populated only by the citation-validity check (§3.1). Both are empty arrays when clean.

**Write semantics.** INSERT-only. No UPSERT. Same `deal_id` may appear across runs with distinct `run_id` values — this preserves the audit history. Status state machine:

```
(new)  ──INSERT──▶  in_progress
in_progress ─────▶  complete | complete_high_confidence | flagged_for_review | error
{complete, complete_high_confidence, flagged_for_review, error} ─────▶  (terminal)
```

Transitions are UPDATE on `(run_id, deal_id)` composite; `(run_id, deal_id)` is enforced unique via `CREATE UNIQUE INDEX`.

### §2.12 — Observability (Langfuse)

**Primary instrumentation path.** The Langfuse community node (`rorubyy/n8n-nodes-openai-langfuse`) wraps every LLM call, attaching automatic generation events with prompt, completion, tokens, latency, cost.

**Session hierarchy:**

```
Session (session_id = run_id)
├── Span: coordinator
├── Span: document_ingestion (contains embedding generations, one per chunk)
├── Span: extraction_agent (one per document)
│   └── Generation: Qwen3.5-Plus call
├── Span: contradiction_agent
│   └── Generation: Qwen3.5-Plus call (+ tool-use generations in Variant A)
├── Span: gap_analysis_agent
│   └── Generation: Qwen3.5-Plus call
├── Span: red_flag_detector [manual span — see below]
├── Span: portfolio_fit_agent
│   └── Generation: Qwen3.5-Plus call
├── Span: memo_generation_agent
│   └── Generation: Qwen3.5-Plus call
└── Span: evaluator_agent
    └── Generation: Qwen3.5-Plus call
```

**Manual Langfuse span for Red Flag Detector.** Since RFD has no LLM call, the community node doesn't auto-instrument it. An explicit n8n HTTP Request node wraps the RFD sub-workflow:

- Before RFD: POST `${LANGFUSE_BASE_URL}/api/public/ingestion` with event type `span-create`, `trace_id = run_id`, `name = "red_flag_detector"`, `input = extractedFacts summary`.
- After RFD: POST `span-update` with `output = { red_flags_count, timings }`, `end_time`.

This keeps the full session trace intact in Langfuse even for deterministic components.

**Metadata on every generation:**

```json
{
  "session_id": "<run_id>",
  "user_id": "<will or reviewer>",
  "tags": ["deal-diligence", "sagard-demo"],
  "metadata": {
    "deal_id": "<slug>",
    "agent_name": "extraction_agent | ...",
    "prompt_name": "deal-diligence/extraction-agent",
    "prompt_version": "<pinned>",
    "source_name": "<when applicable>"
  }
}
```

**Prompt version pinning.** Phase 3 pins all prompts at `v1`; upgrades require explicit version bump + regeneration test. No auto-latest.

**Fallback path.** If the Langfuse community node fails to load or behaves unreliably, Phase 3 task 3.24 switches to manual HTTP Request instrumentation around every LLM call — same endpoint (`/api/public/ingestion`), same payload shape. Cost: ~30 min rework. Documented in §6.

### §2.13 — Slack notification

**Webhook target.** `${SLACK_WEBHOOK_URL}` (env var from `.env`).

**Payload — Slack Block Kit JSON (not plain text):**

```json
{
  "blocks": [
    { "type": "header", "text": { "type": "plain_text", "text": "🔔 New deal memo ready for review" } },
    { "type": "section", "fields": [
      { "type": "mrkdwn", "text": "*Company:* <company_name>" },
      { "type": "mrkdwn", "text": "*Recommendation:* <recommendation> (directional)" },
      { "type": "mrkdwn", "text": "*Quality score:* <evaluator_score>/60 (<routing_decision>)" },
      { "type": "mrkdwn", "text": "*Deal ID:* <deal_id>" }
    ]},
    { "type": "section", "text": { "type": "mrkdwn", "text": "*Top findings:*\n• <finding 1>\n• <finding 2>\n• <finding 3>" } },
    { "type": "actions", "elements": [
      { "type": "button", "text": { "type": "plain_text", "text": "View memo" }, "url": "<supabase_deep_link>" },
      { "type": "button", "text": { "type": "plain_text", "text": "View trace" }, "url": "<langfuse_session_link>" }
    ]}
  ]
}
```

**Top-findings selection rule.** Top 3 entries by severity from the union of `red_flags`, DISPUTED `contradictions`, and HIGH-importance `missing_information`. Ties broken by: `red_flags` > `contradictions` > `missing_information`; within category, alphabetical by flag_type / claim.

**Deep links:**
- Supabase: `${SUPABASE_URL}/project/<project_ref>/editor/<table_id>?filter=id.eq.<memo_uuid>` (template — real URL assembled at runtime).
- Langfuse: `${LANGFUSE_BASE_URL}/project/<project_id>/sessions/<run_id>`.

## §3 — Cross-agent contracts and enforcement machinery

### §3.1 — Citation validity check node

**Location.** `code/citation-validity.js` invoked from an n8n Code node positioned between Memo Generation and Evaluator.

**Signature:**

```js
function checkCitationValidity(memo, sourceManifest) {
  // memo: MemoGenerationOutput
  // sourceManifest: string[] — canonical source names from Coordinator
  // returns: { memo: MemoGenerationOutput, unresolved_sources: Array<{claim,invalid_source_name}> }
}
```

**Algorithm.**
1. For each source string in `memo.key_strengths[].sources`, `memo.key_risks[].sources`, `memo.contradictions[].sources`:
   - Extract `source_name` via regex capture (longest-marker-wins ordering is load-bearing):
     ```js
     const SOURCE_NAME_RE = /^(.+?)(?: Risk Factors p\. \d+| §[A-Za-z0-9\. ]+| p\. ~?\d+)$/;
     const m = citation.match(SOURCE_NAME_RE);
     const source_name = m ? m[1] : null;  // null → treated as unresolved
     ```
   - Ordering rationale: `Risk Factors p. <N>` is a superset of `p. <N>`; if the simpler marker were tried first, `"Cerebras S-1 Filing Risk Factors p. 23"` would split at the first ` p. ` and yield `"Cerebras S-1 Filing Risk Factors"`, which is not in the manifest. The regex's non-greedy `(.+?)` plus the explicit alternation order ensures `Risk Factors p. N` is matched as a single locator.
   - If `source_name ∉ sourceManifest` OR `source_name === null`: record in `unresolved_sources`.
2. Items whose ALL sources resolve: kept.
3. Items with ANY unresolved source: marked with trailing `[UNSUPPORTED]` in the claim text AND excluded from the memo body; summary entry appended to the returned `unresolved_sources` for Evaluator visibility.
4. The returned memo passes to the Evaluator with the cleaned set.

**Schema invariant.** This node never creates new sources or rewrites claims — it only filters. The memo's JSON Schema contract is preserved; only the `key_strengths` / `key_risks` / `contradictions` arrays shrink.

### §3.2 — Schema validation machinery

**Primary path: `ajv` via npm external allowlist.**

`docker-compose.yml` for n8n includes:

```yaml
environment:
  - NODE_FUNCTION_ALLOW_EXTERNAL=ajv
```

n8n Code nodes can then `require('ajv')`. Schema source: `schemas/agent-output-schemas.json`, loaded via a Read File node once per workflow (cached in n8n workflow variables).

**Fallback path: hand-rolled validator** at `code/json-schema-validator.js` (~150 LOC target). Covers draft-07 subset actually used:
- `type` (single or array) — including `"null"` for union encoding
- `required`
- `enum`
- `pattern` (string only)
- `minLength`, `minItems`
- `properties` (recursive)
- `items` (array schemas)
- `anyOf` (for null-unions when `"type": ["X","null"]` not used)

Unsupported features: `oneOf`, `$ref` external, `format`, `additionalProperties`. Design constraint: `schemas/agent-output-schemas.json` must stay within this subset.

**Phase 2 verification (task 2.0b).** A small test script loads the schema, runs `ajv` validation against a fixture, and reports. If `ajv` require fails, decision is recorded as D-3 in `.claude/memory/decisions.md` and the fallback path becomes primary.

### §3.3 — Retry-and-failure contract

**Trigger.** Any agent output fails schema validation (via `ajv` or fallback).

**Policy.**
1. **Retry once.** The workflow re-invokes the same agent with a system-message addendum:
   > "Your previous response failed schema validation at path `<error_path>` with message `<message>`. Regenerate with exact adherence to the schema. Return ONLY the JSON; no commentary."
2. **On retry success:** proceed as normal.
3. **On second failure (retry also fails):** chain-effect policy below.

**Chain-effect specification.** When an agent's second attempt fails, the workflow does NOT abort. It follows this policy:

- **Bypass semantics.** The failing agent's output is replaced with a canonical **empty-but-schema-valid** output object. Every agent schema in `schemas/agent-output-schemas.json` MUST permit the empty case — this is a schema invariant enforced at spec time:
  - Extraction: `{ source_name: <from manifest>, source_type: <from manifest>, extracted_facts: { <all sections with null values and citations: []> } }`
  - Contradiction: `{ contradictions: [], verified_claims: [] }`
  - Gap Analysis: `{ missing_information: [] }`
  - Red Flag Detector: `{ red_flags: [] }` (RFD is deterministic JS; it does not schema-fail in practice)
  - Portfolio Fit: `{ portfolio_fit: { strategic_fit: { score: null, rationale: "upstream_failure" }, stage_fit: { score: null, rationale: "upstream_failure" }, synergy_potential: [], anti_patterns: [], overall_thesis_alignment: "LOW", recommended_action: "pass" } }`
  - (Memo Generation bypass case below.)

- **Threshold rule for Memo Generation bypass.** If **2 or more** upstream agents (counting each Extraction invocation as one) have bypassed, Memo Generation itself is bypassed — skipped entirely. In this case:
  - The Supabase record is INSERTed with `executive_summary: null`, `recommendation: null`, `status: 'flagged_for_review'`, `evaluator_score: null`.
  - The record preserves all partial upstream outputs for the human reviewer to inspect.

- **Threshold rule for Memo Generation proceeding on partial input.** If **1** upstream agent bypassed, Memo Generation runs with the empty-valid output of the bypassed agent folded into its input bundle. The memo's `confidence_scores.overall` is computed with a penalty: multiply by `0.5`.

- In all cases:
  - INSERT Supabase row with `status: 'flagged_for_review'`, `evaluator_feedback.schema_errors` populated with `{ agent, attempt_number, error_path, message }` per failure.
  - Fire Slack with header "⚠ Deal evaluation — partial failure" listing the failing agent(s) by name.
  - Emit Langfuse events `trace-update` marking the session with `status: 'partial_failure'`.

- The human reviewer sees an explicit failure record with clear indication of what bypassed, not a silently-bad memo.

**Schema-permits-empty invariant (design constraint on `schemas/agent-output-schemas.json`).** Every agent schema's arrays (`contradictions[]`, `verified_claims[]`, `missing_information[]`, `red_flags[]`, etc.) declare `minItems: 0` (explicit empty allowed). Object fields bearing bypass markers (scores, rationales) declare `"type": ["number","null"]` etc. This must be verified when writing the schema file in Phase 2 (task 2.Y).

**Retry count cap = 1. Maximum 2 attempts per agent per run.**

**Why this shape.** The original DESIGN.md §5.3 said "retry with schema addendum" but didn't specify what happens on second failure. Silent skip or run abort are both worse than a flagged-for-review record: skip produces a memo with fabricated-upstream content; abort loses the human's visibility of what went wrong. The flagged-partial record preserves auditability and surfaces the issue to the reviewer.

### §3.4 — Data-flow map (which agent sees what)

| Agent | Input bundle |
|---|---|
| Extraction | per-document retrieved chunks + prompt |
| Contradiction (A: tool-use) | all Extraction outputs + vector store as tool |
| Contradiction (B: stuffed) | all Extraction outputs (union JSON) |
| Gap Analysis | all Extraction outputs + Contradiction output + union retrieval chunks |
| Red Flag Detector | all Extraction outputs + per-document raw text |
| Portfolio Fit | all Extraction outputs + `sagard-portfolio.json` |
| Memo Generation | all Extraction outputs + Contradiction + Gap + Red Flags + Portfolio Fit |
| Citation Validity | Memo output + `source_manifest` from Coordinator |
| Evaluator | Post-validity memo + ALL upstream agent outputs |

The Evaluator explicitly receives upstream outputs for cross-checking (hallucination detection criterion) — not just the memo.

## §4 — Meta-evaluation (calibration of the Evaluator Agent)

**Why this section exists.** LLM-as-judge using the same model as the generator correlates with the generator on style. Without calibration, the `evaluator_score` is unreliable as a quality signal. Pari's Georgian background puts evaluation methodology squarely in her review lens; the prototype must show a credible calibration plan.

**Calibration fixtures (authored by Will during Phase 4 prep).**

| File | Purpose | Authorship |
|---|---|---|
| `test-cases/meta-eval/intentionally-bad-memo.json` | A MemoGenerationOutput with deliberately introduced defects: 1 hallucinated claim, 1 uncited claim, 1 contradiction not acknowledged, 1 red flag not propagated, **+ at least one off-criteria defect** (e.g., factually correct but strategically incoherent — right numbers, wrong narrative). Expected Evaluator score: well below 35. | **Will** — investment-professional judgment on what constitutes "bad." Estimated effort: ~25 min. |
| `test-cases/meta-eval/intentionally-good-memo.json` | A MemoGenerationOutput hand-tuned for CoreWeave with all citations correct, all contradictions addressed, all red flags propagated. Expected score: above 50. | **Will** — investment-professional judgment on "IC-grade." Estimated effort: ~20 min. |

**Authorship procedural separation — critical for calibration credibility.**

- Will authors both fixtures from the lens of "what would an investment professional consider unacceptable / IC-grade" **without reading DESIGN.md §3.10's Six-Criteria Quality Check before writing.** If Will writes a bad memo by systematically violating the six criteria known in advance, the Evaluator scores it low by tautology — no calibration signal.
- The bad fixture **must include at least one defect that is not directly one of the six criteria.** Example: all citations valid, all contradictions surfaced, no hallucinations, red flags propagated — but the `recommendation` is `advance_to_deep_diligence` while the `key_risks` include an HIGH-severity customer concentration and HIGH-severity material weakness. That's strategic incoherence: the facts are honest but the narrative doesn't follow from them. The Evaluator must reason past its checklist to catch it (criterion 5 "reasoning coherence" is the adjacent match, but the test is whether the Evaluator weights it enough without explicit prompting).
- Rationale: Pari's Georgian background includes specific work on LLM-as-judge calibration. A meta-eval where the bad fixture is constructed from the same rubric the Evaluator uses is calibration theater. This procedural separation is the rigor that makes the meta-eval a real signal.

**Discrimination criterion (primary):**

```
evaluator_score(intentionally-good-memo) - evaluator_score(intentionally-bad-memo) ≥ 20
```

This is the meta-eval pass/fail. Absolute scores are secondary.

**Secondary checks:**
- `evaluator_score(bad) < 35` (routes to flagged_for_review).
- `critical_issues` for the bad memo must include the planted hallucination.
- Evaluator for the good memo produces `routing_decision ∈ {complete, complete_high_confidence}`.

**Running the meta-eval.** Phase 4 task: script invokes the Evaluator Agent directly (via n8n workflow webhook or local call) on each fixture, captures scores, asserts the discrimination gap.

**What if Will can't author the fixtures in Phase 4 prep?**

- Fallback 1: Claude Chat authors both (different reasoning surface than Claude Code — still an out-of-loop signal). Acceptable.
- Fallback 2 (weakest): generate from a deliberately-weakened prompt ("write a memo with no citations and an invented customer concentration number"). Document the self-correlation limitation explicitly in the 250-word submission.

**Langfuse Scores.** All Evaluator scores are also submitted to Langfuse Scores API (`/api/public/scores`) with `name: "deal-diligence-quality"`, `value: evaluator_score`, `trace_id: run_id`. Enables longitudinal tracking and per-prompt-version calibration analysis.

**Out of scope for prototype (documented as Extension, §8).** DeepEval / G-Eval integration; rubric-based evaluation with multi-model ensembles; human-in-the-loop fine-tuning data collection.

## §5 — Cost model and scaling analysis

**Per-run token estimate (Qwen3.5-Plus via DashScope, intl pricing).**

| Stage | Approx tokens | Notes |
|---|---|---|
| Embedding (ingestion) | ~40K chars × 4 docs / 4 chars/token = ~40K input | text-embedding-v3; separate pricing |
| Extraction × 4 docs | 4 × (65K input + 4K output) = **276K tokens** | section-targeted retrieval per §2.4 |
| Contradiction | 80K input + 5K output | stuffed-context mode (Variant B worst case) |
| Gap Analysis | 50K input + 3K output | |
| Red Flag Detector | 0 | deterministic JS, no LLM |
| Portfolio Fit | 30K input + 3K output | |
| Memo Generation | 60K input + 6K output | full upstream bundle |
| Evaluator | 70K input + 3K output | memo + upstream for cross-check |

**Total per run:** ~566K input tokens + ~24K output tokens + ~40K embedding tokens.

**At Qwen3.5-Plus pricing (≈$0.0008/1K input, $0.002/1K output — illustrative; real rates at build time):** ~$0.50 input + ~$0.05 output + ~$0.005 embedding ≈ **$0.55–$1.10 per deal run** (accounting for range in retrieval sizing).

**At 10× deal volume:** ~$10/day if one deal/day scales to ten/day. LLM cost is NOT the scaling constraint.

**Actual scaling bottlenecks (load-bearing for 250-word submission):**

1. **Reviewer throughput.** 10 deals × 10–15 red flags/deal × 5 contradictions × 8 missing-info items ≈ **150–300 items/day demanding human triage**. A reviewer can't sustainably process 30 deals/day at manual-review depth. Requires: review queue UI, priority sorting, skim-first "flagged_for_review" isolation, team distribution model.
2. **False-positive fatigue on red flags.** Regex-based detectors will fire on boilerplate over a sufficiently large volume. Threshold drift and FP-rate monitoring become necessary.
3. **Prompt drift as Sagard's thesis evolves.** The Portfolio Fit agent's prompt hard-codes thesis pillars. Over a year, pillars evolve; prompt maintenance is an unstaffed cost.
4. **Langfuse trace storage.** Free tier = 50K observations/month. At 7–8 observations per run × 30 deals/day × 30 days = ~7K/month headroom remaining. Fine for prototype; paid tier required at 10× sustained volume.
5. **Audit-trail quality.** Each deal produces ~15 structured artifacts (memo, 6 agent outputs, sources, scores). Compliance query patterns ("show me all deals flagged on customer concentration last quarter") demand materialized views or a reporting layer not in the prototype.

These are the items the 250-word submission's "what would break first at 10x?" answer names — specifically, reviewer throughput is #1.

## §6 — Failure mode matrix

Every failure mode: detection, automated response, escalation path. Expands original DESIGN.md §5.

| Mode | Detection | Automated response | Escalation |
|---|---|---|---|
| PDF parse returns <500 chars from >10-page PDF | heuristic at ingestion | continue with extracted text; penalize confidence_scores.overall | log warning in Langfuse span; no user alert |
| LLM API 5xx or rate-limit | HTTP Request node retry | 3 attempts with exponential backoff | after 3 failures: route to error handler; INSERT status='error' record; Slack alert |
| LLM returns malformed JSON | schema validator flags | per §3.3: retry once with schema addendum | on second failure: partial-memo record, Slack "partial failure" |
| Citation format invalid (fails `pattern`) | schema validator | per §3.3 retry | same |
| Citation validity (unknown source_name) | §3.1 citation-validity node | claim stripped from memo; `unresolved_sources` populated | Evaluator criterion penalizes |
| Memo claim has no matching upstream evidence | Evaluator hallucination_check | `critical_issues` entry with severity HIGH; forces routing=flagged_for_review | standard Slack alert |
| Total workflow crash (unhandled) | n8n error trigger | INSERT status='error' with stack trace; Slack alert "Deal evaluation failed" | user retry or escalate |
| Langfuse trace submission fails | HTTP response check | log to Supabase's `source_documents.ingestion_warnings`; continue run | manual check if observed post-hoc |
| Supabase write fails | insert response check | retry once; if still failing, log to local file; Slack alert | user must manually persist |
| Slack webhook fails | POST response | log warning; do not retry (notification is best-effort) | review record still lands in Supabase |
| Qwen tool-use unreliable at runtime (if Variant A selected) | per-span error rate | runtime detector: ≥2 tool-use failures in one run → switch fallback to Variant B mid-run (re-invoke Contradiction with stuffed context) | D-2 revisited post-run |
| Embedding API fails for some chunks | per-chunk error | skip the chunk; log; continue | degraded retrieval quality, surfaces in evaluator score |

## §7 — Idempotency and concurrency

**Same-deal re-run.** Produces a new `run_id`. `deal_id` may repeat. Supabase record is a new row; no UPSERT. This preserves the audit history — "here's every time this deal was evaluated and what the memo said each time."

**Uniqueness.** `(run_id, deal_id)` is the composite key. `run_id` alone is unique (UUID v4 collision negligible). `deal_id` alone is not unique.

**Concurrent workflow runs.** Safe. Each run has its own `run_id`; the Simple Vector Store is in-process and scoped to the workflow execution. No shared state concerns.

**Local-dev idempotency.** If a human re-runs the same workflow manually during testing with the same documents: expected behavior is new `run_id`, new Supabase row. Testers who want a clean slate must delete rows manually or filter by `run_id` in their queries.

## §8 — Extension points (condensed from original DESIGN.md §7)

1. **Multi-user access control.** Supabase RLS on `deal_memos`; Langfuse user attribution; n8n credential scoping per user.
2. **Additional specialist agents.** Comparable Transactions, Market Sizing Validator, Management Background, Regulatory Exposure.
3. **Real-time portfolio data.** Replace static `sagard-portfolio.json` with API integration to Sagard's portfolio management system.
4. **Continuous monitoring mode.** Scheduled re-ingestion of portfolio-company updates with delta detection.
5. **Human feedback loop.** Reviewer markup → fine-tuning data collection → prompt iteration.
6. **Production evaluation stack.** DeepEval / G-Eval integration; rubric-based multi-model evaluation; calibration against reviewer annotations.
7. **OCR.** For image-based PDFs (out of scope for prototype; SEC filings are text-extractable).
8. **Multi-language.** English-only for prototype.

## §9 — Out of scope (condensed from original DESIGN.md §8, with additions)

- Final investment decision automation (permanently; violates I-1).
- CRM integration.
- Multi-language documents.
- OCR for scanned PDFs.
- Real-time collaborative review.
- Automated outreach.
- Financial model building (DCF, comps).
- Legal contract / term sheet analysis.
- Video / audio diligence materials.
- **Additions from this plan:**
  - DeepEval / G-Eval integration (prototype uses built-in Evaluator Agent with meta-eval fixtures).
  - Prompt auto-versioning (manual `v1` pin).
  - Complex-PDF layout handling (tables, multi-column footnotes) — extraction degrades gracefully but isn't specifically engineered for.

## §10 — Source-name normalization

See §2.2. Canonical format: `<CompanyName> <SourceTypeHuman>`. Downstream agents consume source names verbatim from the manifest. Any agent that fabricates a different source name fails citation-validity (§3.1).

## §11 — Citation format

See §2.4 (enforced) and §2.9 (validated). Canonical formats:
- `<source_name> p. <num>` — exact page.
- `<source_name> p. ~<num>` — estimated page.
- `<source_name> §<section>` — section reference.
- `<source_name> Risk Factors p. <num>` — regulatory-section specific.

Schema `pattern` enforces format; §3.1 enforces validity of the source_name prefix.

## §12 — Source_type classifier

See §2.2. Deterministic filename-regex table; no LLM fallback.

## §13 — Open design questions (resolved during Phase 2)

These become decisions (D-N entries) in `.claude/memory/decisions.md`:

| # | Question | Resolution phase | Decision ID |
|---|---|---|---|
| 1 | Does Qwen3.5-Plus tool-use reliably work via n8n AI Agent + DashScope? | Phase 2 spike 2.0a | D-2 |
| 2 | Does `ajv` load in n8n Code node with `NODE_FUNCTION_ALLOW_EXTERNAL=ajv`? | Phase 2 spike 2.0b | D-3 |
| 3 | Does the Langfuse community node reliably capture traces? | Phase 3 task 3.24 | D-4 |
| 4 | Optimal `RETRIEVAL_K_SECTION` value (currently 5)? | Phase 4 tuning | Tracked in state.md; not a locked decision |

## §14 — Diff from original DESIGN.md

| Original section | Plan section | Preserved | Refined | Added | Removed |
|---|---|---|---|---|---|
| §1 Design Philosophy | §1 Invariants | All seven principles | Restructured as ID-referenced invariants | I-ID cross-reference system | — |
| §2 System Topology | — | All four layers | — | — | — (still canonical in original) |
| §3.1 Form Trigger | §2.1 | Purpose, 2–4 docs | Form schema exactness, file size/MIME limits, failure HTTP behavior | — | — |
| §3.2 Coordinator | §2.2 | run_id, deal_id concept | Slug rules; `source_manifest` emission; UTC timestamps | `source_manifest`, normalized `source_name`, canonical source-type classifier table | — |
| §3.3 Document Ingestion | §2.3 | Chunk size, overlap, metadata | Per-chunk metadata fields; per-document collections; `page_estimate` spec | `Set` node for swap point; tiktoken spec | LLM source-type inference (removed) |
| §3.4 Extraction Agent | §2.4 | IC taxonomy, output shape | Section-targeted retrieval (11 + 1 union); full JSON Schema ref; citation format regex | Retrieval pattern spec; token budget number | "one invocation per document" retained; retrieval method specified |
| §3.5 Contradiction Agent | §2.5 | Framework, classifications | Two prompt variants (A tool-use, B stuffed); decision gate D-2 | Fallback path | "Vector Store tool access" asserted without fallback |
| §3.6 Gap Analysis | §2.6 | Framework, categories | Union retrieval strategy; importance calibration | — | — |
| §3.7 Red Flag Detector | §2.7 | All 10 flags | Constants block; negation-guarded regex; regex-scoping rule (Risk Factors); full flag table with detection logic | ~35 unit tests plan; `documentsRaw` parameter spec | 10 flags originally in prose; no unit test plan |
| §3.8 Portfolio Fit | §2.8 | Framework, 4 dimensions | `sagard-portfolio.json` schema + seed data | Thesis pillars + anti-patterns as first-class entities | — |
| §3.9 Memo Generation | §2.9 | IC memo format, citation rule | Two-layer citation enforcement (format + validity); stripping behavior | `unresolved_sources` output channel | "enforced at schema level" now precise (format only) |
| §3.10 Evaluator | §2.10 | Six criteria, thresholds | Critical-issue override rule; calibration reference to §4 | Meta-eval plan | — |
| §3.11 Supabase | §2.11 | DDL | Write semantics (INSERT-only); `(run_id, deal_id)` unique index; `evaluator_feedback` canonical sub-keys; `source_documents` shape | Status state machine; `schema_errors`, `unresolved_sources` fields | — |
| §3.12 Observability | §2.12 | Trace structure | Manual RFD span via HTTP Request; fallback to manual HTTP if community node fails; prompt version pinning | Langfuse Scores for evaluator | — |
| §3.13 Slack | §2.13 | Webhook-based | Block Kit JSON format; top-findings selection rule; deep-link templates | Button actions | Plain-text format |
| §4 Data Contracts | §3 + `schemas/agent-output-schemas.json` | All 6 agent schemas | Null-union syntax corrected; schema file becomes authoritative; machinery for validation | §3.1 Citation Validity Check; §3.2 validation machinery; §3.3 retry contract; §3.4 data-flow map | — |
| §5 Error Handling | §6 | All 6 modes | Per-mode detection/response/escalation table; new modes | Citation validity failure; Qwen tool-use runtime fallback; Langfuse / Supabase / Slack failures | — |
| §6 Observability | §2.12 | Trace structure, querying | Merged into component §2.12 | — | — |
| §7 Extension Points | §8 | All 5 | Meta-evaluation surface (DeepEval) added | — | — |
| §8 Out of Scope | §9 | All 9 | — | DeepEval, auto-versioning, complex-PDF layout | — |
| §9 Design Decision Index | — | All pointers | — | — | Superseded by `.claude/memory/decisions.md` |
| — | §4 Meta-evaluation | — | — | Entire section (calibration fixtures, discrimination criterion, Langfuse Scores) | — |
| — | §5 Cost model | — | — | Entire section (per-run estimate + scaling bottlenecks) | — |
| — | §7 Idempotency | — | — | Entire section | — |
| — | §10 Source-name normalization | — | — | Entire section | — |
| — | §11 Citation format | — | — | Entire section | — |
| — | §13 Open design questions | — | — | Entire section | — |

---

**End of design plan.**

*Authoritative as of 2026-04-24. Changes require: (a) update this file's `last-updated`, (b) propagate to `schemas/agent-output-schemas.json` if contract-affecting, (c) append to `.claude/memory/decisions.md`, (d) emit Receipt per `.collab/PROTOCOL.md`.*
