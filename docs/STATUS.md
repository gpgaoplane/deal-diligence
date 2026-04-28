---
status: active
type: status
owner: shared
last-updated: 2026-04-27T21:00:00-04:00
read-if: "you need project-wide state: current phase, what's done, what's next"
skip-if: "status != active or last-updated <= your watermark"
---

# Project Status — Deal Diligence Workspace

> Originally built as a take-home for Sagard. The engine is now generalized — investor-specific configuration lives in `code/portfolio.json`. See `docs/submission-writeup.md` for the Sagard-tailored framing submitted to Pari.

**Status:** Active development. No active deadline (the original take-home deadline of 2026-04-24 has passed; the project continues without time pressure).

<!-- section:current-phase:start -->
## Current phase

**Phase 3 (Core Build) COMPLETE.** Workflow at `versionId: phase6-md-output-v28` runs end-to-end on CoreWeave. 54 total nodes (52 main + 2 Phase 6 Markdown auto-save). **Active chat model: `qwen3.5-plus-2026-02-15`** (swapped 2026-04-27 from `qwen3-max`; cross-family change Max → Plus).

**Phase 4 (Dev Iteration) ✅ ALL ENTRY STEPS COMPLETE.**

| Step | Description | Status | Commit |
|---|---|---|---|
| 1 | Debug `evaluator_score: 0` → Memo anti-empty-shell rules | ✅ | `60c4cc2` |
| 2 | Meta-eval discrimination ≥ 20 → achieved 25-point gap | ✅ | `c3bf7af` + `077b9b2` |
| 3a | RFD MATERIAL_WEAKNESS regex + wrapper P-6 fix | ✅ | `43f6d28` + `48cb64d` |
| 3b | Memo severity semantics for strengths | ✅ | `5e775a5` |
| 3c | Extraction S-1 retrieval-query refinements | ✅ | `5e775a5` |

Final live-verification run (`75ba2ad5...`, `qwen3-max-2025-09-23`): RFD coverage jumped from 4-of-10 → 8-of-10 functional detectors on CoreWeave. red_flags[] = 5 entries (was 2): customer_concentration_extreme HIGH + material_weakness HIGH (NEW) + related_party_above_threshold MEDIUM (BONUS) + revenue_growth_anomalous LOW + dual_class_structure LOW (BONUS). Memo + Evaluator chain ran end-to-end without errors, implicitly confirming the per-element scoping fixes from P-5 generalize across the qwen3-max family.

**Phase 5 (Generalization Test — Cerebras) ✅ CLOSED.** Live re-run against the 4 Cerebras docs at `test-cases/cerebras/` succeeded end-to-end with no code changes. RFD: `regulatory_filing_count: 1`, `total_chunks: 289`, ≥3 flags including `related_party_above_threshold` MEDIUM (OpenAI Warrant) + `dual_class_structure` LOW. Extraction populated Cerebras S-1 financials (cash $1.336B, operating loss $145.86M FY2025) with full competitor list. Cross-source numerical agreement between S-1 and Cerebras Analyst Report (#2). Multi-source disambiguation `(#2)` working. Memo + Evaluator clean per Will. P-5 prompt fixes generalized to a deal not seen during Phase 4 calibration → confirmed model-class fixes, not deal-class fixes. P-6 RFD wrapper fix's value re-confirmed across two deal packets. No new Phase 5 backlog (one minor observation logged: audit truncated flag_type from Phase 5 RFD output).

**Phase 6 (Demo + 250-word written explanation) IN FLIGHT.** Submission writeup at `docs/submission-writeup.md` (237 words in the 250-word headline section), demo runbook at `docs/demo-runbook.md` (3-4 min Loom script), sample-runs index at `docs/sample-runs/README.md`. Branch pushed to `origin/main` at commit `d3320c9`. Loom recording + URL slot-in are on Will; revisions to writeup voice are on Will.

**Phase 7** — submission to Pari (writeup + Loom URL + repo URL).
<!-- section:current-phase:end -->

<!-- section:done:start -->
## Done

**Planning (Phase 0):** CONTEXT.md, DESIGN.md, IMPLEMENTATION.md (originals reference-only) + refined design and implementation plans at `docs/plans/2026-04-24-deal-diligence-{design,implementation}.md`.

**Framework:** multi-agent-collab v0.3.0 bootstrapped, invariants I-1…I-9 seeded, decisions D-0…D-3 recorded, pitfall P-1 recorded.

**Phase 1 — Environment Setup (complete):**
- 1.1 Docker Desktop verified
- 1.2 Supabase project + keys
- 1.3 Langfuse Cloud project `sagard-deal-diligence` + keys
- 1.4 Slack workspace + `#investment-team` webhook
- 1.5 Alicloud DashScope credits verified (qwen3.5-plus + text-embedding-v4)
- 1.6 CoreWeave documents (4 PDFs): S-1, Fortune press release, Mostly Metrics analyst report, Level Headed analyst report
- 1.7 Cerebras documents (4 PDFs): S-1, Cerebras press release, Futurum teardown, Motley Fool analysis
- 1.8 `.env` populated and gitignored; all 4 services credential-sanity-tested (6/7 green on first pass; SUPABASE_SERVICE_ROLE_KEY corrected on second pass; all 7 green after fix)

**Phase 2 — Scaffolding (complete):**
- 2.0a API-level Qwen tool-use spike → strong positive, D-2 provisional Variant A
- 2.0b.pre + 2.0b ajv spike → D-3 hand-rolled validator (sandbox blocks ajv.compile)
- 2.1 directory structure
- 2.2 `.gitignore` (full set: .env, .env.*, n8n/n8n-data/, outputs/*.json, node_modules, *.log, *.pem, *.key, .collab/.update-cache, .claude/settings.local.json)
- 2.3 `.env.example`
- 2.4 `docker-compose.yml` (full; community-node install via UI per docker-compose comments, not env var)
- 2.5 `scripts/{up,down,import-workflow,export-workflow}.sh`
- 2.6 `README.md` (expanded, UTF-8, with frontmatter)
- 2.8 all 7 prompt stubs (both Contradiction variants A + B)
- 2.9 `schemas/supabase-schema.sql` (with `(run_id, deal_id)` unique index + status state machine)
- 2.Y `schemas/agent-output-schemas.json` (25 $defs, all 7 agent outputs, draft-07)
- 2.10 `code/red-flag-detector.js` skeleton (constants + negation-guarded regex patterns)
- 2.11 `code/sagard-portfolio.json` (5 portfolio companies, 4 thesis pillars, 4 anti-patterns)
- `code/json-schema-validator.js` (hand-rolled, ~210 LOC, 25/25 tests passing including P-1 regression guard)
- 2.12 n8n running (Will confirmed via successful ajv spike execution)
- 2.13 Supabase schema applied (Will confirmed)
- 2.Z meta-eval fixtures authored (ChatGPT-authored, schema-validated, strong good/bad contrast)
- `code/sec-edgar-downloader.py` (auto-fetches S-1s from EDGAR as searchable PDFs)

**Phase 3 — Core Build (partial):**
- 3.1 Form Trigger node implemented in `n8n/workflow.json`
- 3.2 Coordinator node implemented with run metadata, source classification, and source manifest emission
- 3.3a Split Per-Document implemented (one item per uploaded PDF with binary remapping)
- 3.3b Text Chunker implemented (character-based chunking with metadata recovery from upstream node state)
- 3.3c Embedding request + Extract Embedding implemented
- 3.3d Aggregate Vector Store implemented as the current retrieval-store baseline in the workflow
- D-5 embeddings provider switch landed: workflow now reads `EMBEDDING_*` env vars and currently targets OpenRouter embeddings
- 3.5 first-pass Extraction path wired after `Aggregate Vector Store` using query embedding, chunk ranking, Extraction request assembly, chat-completions call, and response parsing
- 3.5 Extraction runtime verified in n8n on CoreWeave test inputs; workflow completed successfully and the parse step now enforces the fixed schema shape
- 3.P2 / 3.P2c / 3.P2r completed for Contradiction: Variant A (tool-use) is refined and ready for `3.6`; Variant B (stuffed) remains the fallback
- 3.6 first-pass Contradiction tool-use loop wired after Extraction using a hand-rolled `retrieve_document` tool-call roundtrip over the aggregate chunk store
- 3.6 Contradiction runtime verified in n8n on the CoreWeave press release + S-1 pair; turn 1 emitted tool calls, retrieval returned raw passages, and the final parse step produced valid `ContradictionOutput`
- Active Alicloud chat model switched to `qwen3-max-preview`; workflow nodes already read `ALICLOUD_MODEL` from env so the swap was applied by updating `.env` and restarting n8n
- Architecture formalization landed (D-6 in `.claude/memory/decisions.md`): the live workflow's hand-rolled aggregate chunk store + raw-HTTP + Code-node tool-call loop topology is now the canonical repo pattern; design plan §2.3 / §2.4 / §2.5 / §2.7 / §3.4 / §7 + implementation plan tasks 2.0a / 3.3 / 3.5 / 3.6 + acceptance criteria updated to match. Original Simple Vector Store + n8n AI Agent node wording preserved in §14 / §15 diff tables for audit.
- Project deadline framing removed across `docs/STATUS.md`, `README.md`, `AI_AGENTS.md`, `CONTEXT.md`, and `docs/plans/2026-04-24-deal-diligence-implementation.md`. Original 2026-04-24 take-home deadline has passed; project continues without an active deadline.
- 3.P3 Gap Analysis prompt drafted (`prompts/gap-analysis-agent.md` upgraded from Phase 2 stub to Phase 3 draft following the 7-part convention; Institutional LP Diligence Checklist + stage-aware importance calibration + three-way coverage rule + concrete schema-shaped example). Awaiting Codex post-commit review per project-conventions §10 trigger 1.
- 3.7 Gap Analysis specialist wired into `n8n/workflow.json` — 6 new nodes (Prepare Gap Analysis Inputs → Embed Gap Analysis Query → Rank Gap Analysis Chunks → Build Gap Analysis Request → Call Gap Analysis Agent → Parse Gap Analysis Response) appended after Parse Contradiction Response. Workflow now has 30 connected nodes from Form Trigger through Parse Gap Analysis Response. JSON valid. `versionId: phase3-session2-v7`. Pending live runtime verification.
- 3.8 Red Flag Detector wired as a single Code node after Parse Gap Analysis Response. Pastes `code/red-flag-detector.js` (minus CommonJS exports) inline; reconstructs per-document raw text from the aggregate chunk store; invokes `detectFlags()`; emits `red_flag_detector_output` with `deterministic: true` on every flag (per I-2). Workflow now has 31 connected nodes. `versionId: phase3-session2-v8`.
- 3.P4 Portfolio Fit prompt drafted (`prompts/portfolio-fit-agent.md` upgraded from Phase 2 stub to Phase 3 draft following the 7-part convention; Sagard Thesis Alignment framework with rule-based alignment-to-recommendation mapping; explicit I-1 directional-signal framing).
- 3.9 Portfolio Fit specialist wired as 3 nodes (Build Portfolio Fit Request → Call Portfolio Fit Agent → Parse Portfolio Fit Response) after Run Red Flag Detector. Embeds system prompt AND `code/sagard-portfolio.json` literal in Build node. Workflow now has 34 connected nodes. `versionId: phase3-session2-v9`.
- 3.10a Citation Validity Check JS module authored at `code/citation-validity.js`. Pure-function entrypoint `validateCitations(memo, sourceManifest)` returns `{ cleanedMemo, unresolved_sources, dropped_claims, stats }`. Source-name prefix extraction via regex mirroring `schemas/agent-output-schemas.json` citation pattern; distinguishes `malformed` (regex fail) from `unknown_source` (matched but absent from manifest). Smoke-tested. Wiring deferred to bundle with 3.11 Memo Generation since the node belongs between Memo Gen and Evaluator.
- 3.P5 Memo Generation prompt drafted as **pre-refinement** (`prompts/memo-generation-agent.md` upgraded from Phase 2 stub). HIGH-stakes per project-conventions §3; gated on Claude Chat refinement (task 3.P5r) BEFORE 3.11 wiring. Pre-refinement notes for Claude Chat embedded in the file. Codex pre-refinement review per §10 trigger 1 is the next quality gate.
- 3.P6 Evaluator prompt drafted (`prompts/evaluator-agent.md` upgraded from Phase 2 stub to Phase 3 draft). Medium-stakes; no Claude Chat refinement. Six-Criteria Quality Check rubric (each 0-10, total 0-60); HIGH-severity critical_issue override forces flagged_for_review regardless of score; "strategic incoherence" criterion (criterion 5) calls out the off-criteria defect type that the Phase 4 meta-eval discrimination gap will test.
- 3.18w-3.20w helper scripts authored: `scripts/validate-fixture.js` (validates JSON against any named $defs schema; smoke-tested on both meta-eval fixtures), `scripts/validate-memo-citations.js` (out-of-sandbox wrapper around `code/citation-validity.js`; smoke-tested with cleaned-memo emission), `scripts/run-meta-eval.js` (Phase 4 task 4.16 readiness — runs Evaluator on good/bad fixtures, asserts discrimination gap ≥ 20). All three reuse the hand-rolled validator at `code/json-schema-validator.js` per D-3 to keep the project dependency-free.
- Codex review fixes landed: (a) Build Portfolio Fit Request runtime bug (`$input.all()` in runOnceForEachItem) fixed in `e7320fa`; (b) Memo Generation prompt refined via Claude Chat with Codex pre-refinement findings folded in (`fd32499`); (c) `code/citation-validity.js` now accepts string-array source_manifest (live shape) and emits schema-shaped `{ claim, invalid_source_name }` unresolved_sources, plus `scripts/validate-memo-citations.js` no longer overwrites input on missing `.json` suffix (`a165b3a`); (d) Gap Analysis prompt partial-coverage rule clarified and workflow embed re-synced (`e52439b`); (e) `scripts/run-meta-eval.js` accepts upstream fixture paths via CLI flags and emits a loud stderr warning when upstream is fully zeroed.
- **First green end-to-end run on CoreWeave** (run_id `d5454cc4...`). Confirmed working: source_manifest as string array (with `(#2)` disambiguator), 4 docs classified, RFD picks up customer concentration HIGH (77% top-2) + revenue growth anomalous LOW (700%), Portfolio Fit emits institutional-grade output (LOW alignment, recommend pass, two anti-patterns matched, well-articulated rationale). ~11k tokens for Portfolio Fit prompt.
- 3.11 Memo Generation specialist wired (3 nodes: Build Memo Request → Call Memo Generation Agent → Parse Memo Response). Reaches back to five upstream specialists via cross-node refs for the seven-input contract.
- D-6 mitigation `scripts/inject-prompts.js` authored. Single source of truth: `prompts/*.md`. `--check` mode reports drift; default mode injects. Handles backtick template literals (Codex pattern) AND double-quoted JSON strings, always emits JSON form. 5 of 5 prompt nodes (Extraction, Gap Analysis, Portfolio Fit, Memo Generation, Evaluator) currently in-sync. (Contradiction prompt intentionally excluded — different markdown structure; manual sync stays for now.)
- 3.10b Validate Memo Citations wired as a single Code node after Parse Memo Response. Pastes `code/citation-validity.js` inline; emits cleaned memo + `citation_validity` summary block (unresolved_sources + dropped_claims_count + stats).
- 3.13 Evaluator specialist wired (3 nodes: Build Evaluator Request → Call Evaluator Agent → Parse Evaluator Response). Parser computes `evaluator_score` as `sum(criteria_scores)` authoritatively (overrides model self-reported total when they disagree). HIGH-severity critical_issue forces `routing_decision = flagged_for_review` regardless of score.
- 3.14/3.15/3.16w persistence + notification chain wired (4 nodes: Build Supabase Record → Insert Deal Memo → Build Slack Message → Send Slack Notification). Routing IF skipped — `routing_decision` is a column in `deal_memos` and surfaced in the Slack message; both `complete` and `flagged_for_review` paths share the same flow with status differing by enum and Slack emoji/wording.
- Workflow at 45 connected nodes. `versionId: phase3-session2-v15`. JSON valid.
- **First green end-to-end Memo run on CoreWeave** (`14297a4c-...`): 58/60 evaluator score, complete_high_confidence routing, 17/17 citations valid, Supabase row landed. Slack message had a P-4 data-flow bug (showed "unknown" / "n/a" defaults instead of actual content) — fixed in `c0ee968` via cross-node reference to Build Supabase Record.
- **Second green run** (`1bd32e70-...`) confirmed the Slack fix: correct emoji, recommendation, score, and top risks rendered.
- 3.17w Error handler wired as a 5-node sub-flow (Error Trigger → Build Error Record → Insert Error Memo → Build Error Slack → Send Error Slack). Captures node name, error message, stack trace, execution_id, and recovers run-level metadata from the Coordinator if it ran. Persists status='error' row in deal_memos and posts a `:rotating_light:` Slack alert.
- 3.24-3.29 Langfuse instrumentation landed via the design plan §3.12 fallback path (manual /api/public/ingestion). 2-node pair (Build Langfuse Batch → Send Langfuse Ingestion) at the end of the chain emits one trace per run with: trace-create, observation-create per LLM call (GENERATION) for each Extraction (×N) + Contradiction + Gap Analysis + Portfolio Fit + Memo Gen + Evaluator, observation-create for RFD as SPAN with deterministic:true metadata, score-create with the evaluator_score as `deal-diligence-quality`. Auth via Basic auth header computed in the Code node from `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` env. Uses `LANGFUSE_HOST` env (defaults to cloud.langfuse.com).
- **Phase 3 CLOSED.** Workflow at 52 nodes. `versionId: phase3-session2-v18`. Per-agent schema-validation-with-retry (3.12) DEFERRED — the parsers' shape projection is sufficient for the prototype scope; can retrofit if Phase 4 calibration surfaces bypass-pattern failures.
<!-- section:done:end -->

<!-- section:in-progress:start -->
## In progress

Nothing in active flight. Phase 3 is closed and observable. Awaiting explicit user direction to begin Phase 4.
<!-- section:in-progress:end -->

<!-- section:up-next:start -->
## Up next

**Phase 4 entry (await user direction):**

1. **First calibration item: investigate `evaluator_score: 0` anomaly** in run `0efb319c-...` on `qwen3-max-preview`. Likely Parse Evaluator Response parser fall-through to default 0 because qwen3-max-preview's JSON-mode output shape diverges slightly from qwen3-max-2026-01-23. Inspect raw model output vs parser logic; tighten parser or prompt as needed.
2. **Meta-eval discrimination ≥ 20** — run `scripts/run-meta-eval.js` with upstream fixture pairs supplied via CLI flags (`--extraction --contradictions --gaps --red-flags --portfolio-fit`). Without upstream fixtures, Evaluator criteria 2/3/4 cannot be calibrated (loud stderr WARN in place per Codex P2 fix).
3. **CoreWeave dev iteration** — close out remaining quality gaps surfaced during runs (RFD MATERIAL_WEAKNESS verb-form gap, Memo HIGH-on-strength miscalibration, Extraction recall regressions on S-1 headcount/key_personnel/exact-revenue).

**Phase 5–7:** Cerebras generalization → demo + 250-word written explanation → submission to Pari.

**Backlog (do not gate forward):**
- RFD `MATERIAL_WEAKNESS_POS` regex misses "exist" / "remain" / "are present" verb forms.
- Memo's severity HIGH on "74% gross margin" key_strength miscalibration (HIGH should describe weaknesses).
- Extraction S-1 `headcount`, `key_personnel`, exact revenue value recall regressions.
- Cosmetic: `supabase_id` missing from Slack footer (n8n unwraps single-row REST response).
- Codex post-commit reviews of medium-stakes prompts (Gap Analysis, Portfolio Fit, Evaluator).
- 3.12 schema-validation-with-retry machinery DEFERRED — parsers' shape projection sufficient for prototype.
<!-- section:up-next:end -->

<!-- section:test-results:start -->
## Test results

- `code/test/json-schema-validator.test.js` — **25/25 pass** (includes P-1 regression: no `new Function` / `eval` in validator).
- `npx @gpgaoplane/multi-agent-collab check` — **OK**, INDEX and filesystem aligned.
- Credential sanity-checks (live calls) — **7/7 pass**.
- Meta-eval fixtures schema validation — **both VALID** against MemoGenerationOutput.
- S-1 PDFs — **both valid PDF, 632 + 396 pages, text-extractable**.
- Workflow build verification — `n8n/workflow.json` parses to 52 connected nodes (45-node main + 5-node error sub-flow + 2-node Langfuse pair). `versionId: phase3-session2-v19`.
- Extraction runtime — **PASS** on CoreWeave (S-1 prompt size ~30.4k tokens after retrieval capping).
- Contradiction runtime — **PASS** on CoreWeave press release + S-1 (Microsoft 62% false corroboration resolved on `qwen3-max-preview`).
- Operational hardening — chat-completions HTTP nodes use 300s timeouts.
- **End-to-end run #1** (run_id `14297a4c-...`) — 58/60 evaluator score, complete_high_confidence routing, 17/17 citations valid, Supabase row landed; Slack P-4 data-flow bug surfaced + fixed in `c0ee968`.
- **End-to-end run #2** (run_id `1bd32e70-...`) — Slack message correctly formatted post-fix.
- **End-to-end run #3** (run_id `0efb319c-...`) — Langfuse trace landed (12/12 ingestion events 201) with all observations tagged `qwen3-max-preview`. Error sub-flow correctly did NOT fire on green run. Anomaly: `evaluator_score: 0` despite `recommendation: pass` — likely parser fall-through on qwen3-max-preview output shape; flagged as Phase 4 first calibration item.
<!-- section:test-results:end -->

<!-- section:branch:start -->
## Branch

`main` — all Phase 1/2/3 work landed directly. **51 commits ahead of `origin/main` (not pushed).** Latest: `09f0323` ([config] swap chat model to qwen3-max-preview; fix Langfuse host env-var mismatch).
<!-- section:branch:end -->
