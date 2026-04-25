---
status: active
type: status
owner: shared
last-updated: 2026-04-25T09:45:00-04:00
read-if: "you need project-wide state: current phase, what's done, what's next"
skip-if: "status != active or last-updated <= your watermark"
---

# Project Status — Sagard AI Deal Diligence Workspace

**Status:** Active development. No active deadline (the original take-home deadline of 2026-04-24 has passed; the project continues without time pressure).

<!-- section:current-phase:start -->
## Current phase

**Phase 3 (Core Build) is in progress. Extraction (`3.5`) and Contradiction (`3.6`) are now live-verified on the CoreWeave test pair, the active chat model is `qwen3-max-2026-01-23`, and the project is ready to move to `3.7` Gap Analysis.**

All environment setup, scaffolding, spikes, schemas, prompts, validators, test-case documents (8 PDFs across both deals), and meta-eval fixtures are in place. The live workflow now includes the Form Trigger, Coordinator, per-document split, PDF extraction, text chunking, embedding request, embedding extraction, aggregate retrieval store, retrieval-query preparation, query embedding, chunk ranking, extraction-context aggregation, Extraction request build, Extraction LLM call, and Extraction response parse stages.

The remaining Core Build work now continues from Gap Analysis through Red Flag Detector integration, Portfolio Fit, Citation Validity, Memo Generation, Evaluator, and downstream persistence / notification / observability nodes.
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
- Active Alicloud chat model switched to `qwen3-max-2026-01-23`; workflow nodes already read `ALICLOUD_MODEL` from env so the swap was applied by updating `.env` and restarting n8n
- Architecture formalization landed (D-6 in `.claude/memory/decisions.md`): the live workflow's hand-rolled aggregate chunk store + raw-HTTP + Code-node tool-call loop topology is now the canonical repo pattern; design plan §2.3 / §2.4 / §2.5 / §2.7 / §3.4 / §7 + implementation plan tasks 2.0a / 3.3 / 3.5 / 3.6 + acceptance criteria updated to match. Original Simple Vector Store + n8n AI Agent node wording preserved in §14 / §15 diff tables for audit.
- Project deadline framing removed across `docs/STATUS.md`, `README.md`, `AI_AGENTS.md`, `CONTEXT.md`, and `docs/plans/2026-04-24-deal-diligence-implementation.md`. Original 2026-04-24 take-home deadline has passed; project continues without an active deadline.
- 3.P3 Gap Analysis prompt drafted (`prompts/gap-analysis-agent.md` upgraded from Phase 2 stub to Phase 3 draft following the 7-part convention; Institutional LP Diligence Checklist + stage-aware importance calibration + three-way coverage rule + concrete schema-shaped example). Awaiting Codex post-commit review per project-conventions §10 trigger 1.
- 3.7 Gap Analysis specialist wired into `n8n/workflow.json` — 6 new nodes (Prepare Gap Analysis Inputs → Embed Gap Analysis Query → Rank Gap Analysis Chunks → Build Gap Analysis Request → Call Gap Analysis Agent → Parse Gap Analysis Response) appended after Parse Contradiction Response. Workflow now has 30 connected nodes from Form Trigger through Parse Gap Analysis Response. JSON valid. `versionId: phase3-session2-v7`. Pending live runtime verification.
<!-- section:done:end -->

<!-- section:in-progress:start -->
## In progress

- `n8n/workflow.json` now has a live-verified Extraction specialist path, but Extraction quality still needs follow-up tuning before final memo-eval hardening.
- `n8n/workflow.json` now includes a live-verified Contradiction Variant A path; D-2 is effectively confirmed for the current hand-rolled HTTP tool-use loop.
- A live rerun hit provider latency at `Call Extraction Agent` (`ECONNABORTED` after 120s) before Contradiction verification could even begin. Workflow has since been hardened to use 300s timeouts on all long-running chat-completions nodes.
- A subsequent live rerun reached `Parse Contradiction Tool Calls` and exposed a workflow-shape bug: the node was emitting multiple items while still in `runOnceForEachItem` mode. This has been corrected to `runOnceForAllItems`, so that failure also does not count as a D-2 tool-use failure.
- The first successful Contradiction run confirmed tool-use works, but revealed a prompt-quality issue: the agent sometimes treated broad directional support (e.g. "more than half") as corroboration for exact numeric claims (e.g. `62%`). The prompt was tightened twice, and the follow-up rerun on `qwen3-max-2026-01-23` removed the main `Microsoft 62%` false corroboration. One narrower detail-merging caveat remains for some `CORROBORATED` wording (for example adding modifiers like `more than` or extra sub-details not fully shared by all citations), but the user explicitly accepted the current quality as sufficient to proceed.
- The adopted Extraction prompt exists both in `prompts/extraction-agent.md` and embedded in the workflow's `Build Extraction Request` node; these must stay aligned.
- The adopted Contradiction Variant A prompt exists in `prompts/contradiction-agent.tool-use.md` and is also embedded into the workflow's `Build Contradiction Request` node; these must stay aligned.
- Extraction follow-up backlog from the verified run:
- S-1 `headcount` came back `null` despite earlier evidence that the filing contains that fact.
- `management_assessment.key_personnel` came back empty on the S-1.
- `financial_performance.revenue_latest_period` regressed to a rounded `1.9B` figure instead of the earlier more exact value.
- Current retrieval cap (`24` regular, `6` union) is much healthier than the earlier 54-chunk stuffing pass, but may still need query / ranking refinement for best recall.
- Remaining Phase 3 implementation after Contradiction is open: Gap Analysis, Red Flag Detector integration, Portfolio Fit, Citation Validity / retry machinery, Memo Generation, Evaluator, Supabase writes, Slack, and Langfuse.
<!-- section:in-progress:end -->

<!-- section:up-next:start -->
## Up next

**Immediate next tasks from the current baseline:**

- **Move to task `3.7`** — Begin Gap Analysis prompt work and wiring from the now-accepted Extraction + Contradiction baseline.
- **Extraction quality tuning backlog** — improve retrieval / prompt grounding so high-value fields like headcount, key personnel, and exact revenue figures are recovered more consistently.
- **Contradiction quality backlog** — optional future tightening: keep `CORROBORATED` claims at the exact shared wording supported by all citations, even when the current output is directionally acceptable.
- **Tasks 3.7–3.15** — Gap Analysis, Red Flag Detector integration, Portfolio Fit, Citation Validity, Memo Generation, Evaluator, routing IF, and Supabase persistence.
- **Tasks 3.18w–3.20w** — Helper scripts: run-meta-eval.js, validate-memo-citations.js, validate-fixture.js.
- **Phase 3 exit criterion:** one successful end-to-end run on CoreWeave producing a memo in Supabase with all 7 agents green.

**Community nodes install (Will, before Phase 3 task 3.24 — can be done any time):**
- n8n UI → Settings → Community Nodes → Install
- Packages: `@langfuse/n8n-nodes-langfuse` and `n8n-nodes-openai-langfuse`
- Persists via bind-mounted `./n8n/n8n-data/` volume.
<!-- section:up-next:end -->

<!-- section:test-results:start -->
## Test results

- `code/test/json-schema-validator.test.js` — **25/25 pass** (includes P-1 regression: no `new Function` / `eval` in validator).
- `npx @gpgaoplane/multi-agent-collab check` — **OK**, INDEX and filesystem aligned.
- Credential sanity-checks (live calls) — **7/7 pass**.
- Meta-eval fixtures schema validation — **both VALID** against MemoGenerationOutput.
- S-1 PDFs — **both valid PDF, 632 + 396 pages, text-extractable** (verified via pypdf reader).
- Workflow build verification — `n8n/workflow.json` currently parses to 24 connected nodes from `Form Trigger` through `Parse Contradiction Response`.
- Extraction runtime verification — **PASS** on CoreWeave press release + S-1. Workflow completed successfully; schema-shape cleanup and retrieval caps held in the second verified run. S-1 prompt size dropped from ~58.9k to ~30.4k prompt tokens after retrieval capping.
- Contradiction runtime verification — **PASS** on CoreWeave press release + S-1. Turn 1 emitted `retrieve_document` calls, retrieval returned raw passages from the aggregate chunk store, and `Parse Contradiction Response` produced valid structured output. A later rerun on `qwen3-max-2026-01-23` removed the earlier `Microsoft 62%` false corroboration and is the accepted handoff baseline.
- Operational hardening — chat-completions HTTP nodes now use 300s timeouts after a live 120s timeout at `Call Extraction Agent`.
- Phase 3 full end-to-end memo-generation run: not yet run.
<!-- section:test-results:end -->

<!-- section:branch:start -->
## Branch

`main` — all Phase 1/2 work landed directly. Feature branches expected once Phase 3 task 3.8 (Red Flag Detector JS logic — TDD-worthy) begins.
<!-- section:branch:end -->
