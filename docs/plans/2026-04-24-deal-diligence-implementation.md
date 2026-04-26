---
status: active
type: implementation-plan
owner: shared
last-updated: 2026-04-26T17:00:00-04:00
read-if: "you are planning, executing, or reviewing a phase — this is the authoritative phased build plan with task-level routing, verification commands, and Receipt gates"
skip-if: "your question is only about scope (CONTEXT.md) or component design (2026-04-24-deal-diligence-design.md)"
related: [CONTEXT.md, DESIGN.md, IMPLEMENTATION.md, 2026-04-24-deal-diligence-design.md, docs/STATUS.md, .collab/ROUTING.md, .collab/PROTOCOL.md]
---

# Deal Diligence Implementation Plan — 2026-04-24

## §0 — Purpose and relation to original

This document supersedes the root `IMPLEMENTATION.md` (v1, 2026-04-23) by adding:

- **Routing-matrix row mappings** per task (mechanical Receipt composition — removes judgment from end-of-task fan-out).
- **Verification commands** per acceptance criterion (not just checkboxes — proof-of-done).
- **Phase-closure Receipt template** (single parameterized form) gate between phases.
- **Time-box triggers** that activate the rollback plan automatically.
- **Iteration caps** in Phase 4 (upper bound on prompt-rework loops).
- **Meta-evaluation exit criterion** in Phase 4 (discrimination gap, not just absolute score).
- **Codex engagement protocol** at explicit trigger points (skip-logged if not invoked).
- **Spike tasks** for the two Phase-2 unresolved design questions (`ajv`, Qwen tool-use).
- Agent names conform to framework: `claude`, `codex`, `Will` (Claude Chat is a Will-wielded tool, not a framework agent).

The root `IMPLEMENTATION.md` is flipped to `status: reference-only` on this plan's commit. Authority: this plan wins where it refines; root preserves unrefined content.

Diff table in §15.

## §1 — Phases overview

| Phase | Name | Goal | Est. time | Phase-closure Receipt emitted to |
|---|---|---|---|---|
| 0 | Planning Lock | All planning artifacts committed | ✅ Complete | `docs/agents/claude.md` (2026-04-24) |
| 1 | Environment Setup | Accounts + local stack ready | 2–3h | `docs/agents/claude.md` end-of-phase entry |
| 2 | Scaffolding | Repo structure, configs, stubs | 2–3h (revised up from 1–2h due to spikes) | same |
| 3 | Core Build | End-to-end run on CoreWeave produces a memo | 5–7h | same |
| 4 | Dev Iteration | Evaluator score ≥ 40 on CoreWeave + meta-eval gap ≥ 20 | 2–3h | same |
| 5 | Generalization Test | Cerebras memo without code changes | 1–2h | same |
| 6 | Demo & Documentation | Video + written explanation + polished repo | 2–3h | same |
| 7 | Submission | Deliverables sent to Pari | 15 min | same |

**Revised total: 14–21 hours** (up from original 13–20 due to added spikes and meta-eval fixtures).

**Dependency:** Phases are strictly sequential. No advance past a phase without emitting its closure Receipt.

## §2 — Phase-closure Receipt template (parameterized)

Every phase ends with an entry in `docs/agents/claude.md` using this template. `<phase-n>` and `<phase-name>` substitute.

```markdown
## <ISO-8601 timestamp> — Phase <phase-n> closed: <phase-name>

**Outcome.** <one-line summary of what the phase produced>

**Acceptance criteria met:**
- [x] <criterion 1> — verified via: `<command>` → <observation>
- [x] <criterion 2> — …

**Decisions landed:** D-<n>, D-<m> (see `.claude/memory/decisions.md`)

**Invariants touched:** I-<n> (if any; else "none")

**Watch out:** <cross-agent risks or gotchas for next phase>

**Time spent.** <estimate> vs <actual>. <deviation note>.

### Task Receipt
Updates fanned out this phase:
- `docs/agents/claude.md` ............... this entry + in-phase entries
- `docs/STATUS.md` ....................... current-phase section updated
- `.claude/memory/state.md` .............. branch, active task, watermark
- `.claude/memory/context.md` ............ I-<n> (if invariants changed)
- `.claude/memory/decisions.md` .......... D-<n> (decisions landed)
- `.claude/memory/pitfalls.md` ........... <if any workarounds found>
- `.collab/INDEX.md` ..................... new files registered / timestamps refreshed
- <deliverable files> .................... <what was created/changed>

Missing / intentionally skipped: <reason or "none">
```

## §3 — Phase 1: Environment Setup

**Goal.** Credentials in hand, Docker Desktop running, test-case documents downloaded.

### 3.1 Tasks

| # | Task | Owner | Est. | Depends | Routing rows |
|---|---|---|---|---|---|
| 1.1 | Verify Docker Desktop is installed and running | Will | 5m | — | — (read-only) |
| 1.2 | Create Supabase project; note URL + anon + service-role keys | Will | 10m | — | — |
| 1.3 | Create Langfuse Cloud account + project `sagard-deal-diligence`; note keys + base URL | Will | 10m | — | — |
| 1.4 | Create Slack Free workspace (or use existing); create `#investment-team`; configure incoming webhook | Will | 15m | — | — |
| 1.5 | Confirm Alicloud DashScope API key is active with available credits | Will | 5m | — | — |
| 1.6 | Download CoreWeave documents (S-1, Fortune, Mostly Metrics, Level Headed Investing) into `test-cases/coreweave/` | Will | 15m | — | 9 (file created) |
| 1.7 | Download Cerebras documents (S-1, press release, Futurum, Motley Fool) into `test-cases/cerebras/` | Will | 15m | — | 9 |
| 1.8 | Populate local `.env` with all credentials (never commit) | Will | 10m | 1.2–1.5 | — |

### 3.2 Acceptance criteria (with verification commands)

| Criterion | Verification |
|---|---|
| All credentials in `.env` | `test -f .env && grep -c '=' .env` returns ≥ 10 (one per required env var) |
| `.env` not in git | `git status --porcelain .env` returns empty; `git check-ignore .env` returns `.env` |
| Both test-case folders contain ≥ 3 docs each | `ls test-cases/coreweave/*.pdf \| wc -l` ≥ 3; same for cerebras |
| Docker Desktop running | `docker info 2>&1 \| grep -q "Server Version"` |
| No credentials committed | `git log --all --full-history --diff-filter=A -- .env` is empty |

### 3.3 Parallelization

Tasks 1.1–1.7 are independent. Task 1.8 depends on 1.2–1.5.

### 3.4 Known risks

- Alicloud credit expiry — verify before build starts.
- Langfuse region: use `https://us.cloud.langfuse.com` for North America.
- Slack free tier supports incoming webhooks without OAuth.

### 3.5 Time-box trigger

**If Phase 1 > 4h:** assess whether any account creation blocker is structural (e.g., Alicloud credit issue requires new account). Consider rollback to n8n Cloud fallback if Docker Desktop can't install — cost ~1-2h, accept positioning hit.

### 3.6 Phase-closure Receipt

Emit per §2 template. Expected "Decisions landed": none. "Invariants touched": none.

## §4 — Phase 2: Scaffolding (with spikes)

**Goal.** Repo structure complete, local n8n runs, dependency questions (ajv, Qwen tool-use) resolved before Phase 3 wiring.

**Revised from original:** Added two spikes (2.0a, 2.0b), a meta-eval authoring task (2.Z), and a JSON Schema file creation task (2.Y). Original task 2.7 (`.progress-log.md`) remains removed per framework supersession.

### 4.1 Spike tasks (land before any other Phase 2 work)

**Dependency note.** Spike 2.0b tests `ajv` availability inside a running n8n Code node, which requires n8n running, which requires a `docker-compose.yml`. To avoid circular dependency, 2.0b.pre writes a minimal bootstrap compose file with just the `ajv` env var and basic n8n setup — enough to run the spike. Task 2.4 later expands this minimal file into the full-feature compose (volume mounts, community nodes, full env config).

| # | Task | Owner | Est. | Routing rows | Decision recorded as |
|---|---|---|---|---|---|
| 2.0a | Spike: Qwen tool-use reliability via DashScope. **Outcome (historical):** confirmed at the API level via direct curl with `tools[]`, recorded as D-2 (provisional Variant A). The actually-built topology is a hand-rolled raw-HTTP + Code-node tool-call loop, not the n8n AI Agent node — see D-6 for rationale. So D-2 is confirmed for the hand-rolled path; the AI Agent path was never wired. | claude | 45m | 1, 3, 4 | D-2 in `.claude/memory/decisions.md`; D-6 documents the actual topology |
| 2.0b.pre | Write minimal `docker-compose.yml` bootstrap: n8n image + port 5678 + `NODE_FUNCTION_ALLOW_EXTERNAL=ajv` + basic auth. This is a scaffolding stub that 2.4 will expand. | claude | 15m | 1, 9 | — |
| 2.0b | Spike: `ajv` availability in n8n Code node. Start n8n with the bootstrap compose; create a throwaway workflow with one Code node containing `const Ajv = require('ajv'); return { ok: true };`; execute and verify output. | claude | 20m | 3, 4 | D-3 |

**Spike outcomes bind Phase 3:**
- If 2.0a finds tool-use reliable: Phase 3 task 3.6 uses Contradiction Agent Variant A (tool-use prompt).
- If unreliable: Phase 3 task 3.6 uses Variant B (stuffed-context prompt).
- If 2.0b passes: Phase 3 uses `ajv` for schema validation.
- If 2.0b fails: Phase 2 adds task 2.XX "Write hand-rolled validator per design §3.2 fallback" (~2h); `ajv` path abandoned.

### 4.2 Main tasks

| # | Task | Owner | Est. | Depends | Routing rows |
|---|---|---|---|---|---|
| 2.1 | Create full repo directory structure per design plan §2.3 / CONTEXT.md §6 | claude | 10m | 2.0a, 2.0b | 9 (files), 7 (state) |
| 2.2 | Write `.gitignore`: `.env`, `n8n/n8n-data/`, `outputs/*.json`, `.collab/.update-cache`, `node_modules/`, `*.log` | claude | 5m | 2.1 | 1, 9 |
| 2.3 | Write `.env.example` with every var from CONTEXT.md §7.3 | claude | 10m | 2.1 | 1, 9 |
| 2.4 | Expand `docker-compose.yml` from 2.0b.pre bootstrap to full-feature compose per CONTEXT.md §7.4 + design plan §3.2 (volume mounts, community node install, all env vars). Preserves the `NODE_FUNCTION_ALLOW_EXTERNAL=ajv` or switches to hand-rolled validator path per D-3. | claude | 20m | 2.0b, 2.0b.pre | 1, 3 (path choice) |
| 2.5 | Write scripts: `scripts/{up,down,import-workflow,export-workflow}.sh` | claude | 20m | 2.4 | 1, 9 |
| 2.6 | Update `README.md` with quickstart pointing to framework docs | claude | 10m | 2.1 | 1 |
| 2.8 | Write stub prompt files in `prompts/` (6 files or 7 if Variant A+B both needed for Contradiction per D-2) | claude | 20m | 2.0a (for D-2) | 1, 9 |
| 2.9 | Write `schemas/supabase-schema.sql` from CONTEXT.md §5.8 + `(run_id, deal_id)` unique index from design plan §2.11 | claude | 15m | 2.1 | 1, 9 |
| 2.Y | Write `schemas/agent-output-schemas.json` (draft-07 JSON Schema, all 6 agent outputs + citation regex) | claude | 40m | 2.1, design plan §3 | 1, 9, 4 (schemas are architecture-shaping) |
| 2.10 | Write `code/red-flag-detector.js` skeleton: constants block + exported signature + empty implementation | claude | 20m | 2.1 | 1, 9 |
| 2.11 | Create `code/sagard-portfolio.json` with 3–5 portfolio companies per design §2.8 | claude | 30m | 2.1 | 1, 9 |
| 2.12 | Start n8n: `./scripts/up.sh`; verify `http://localhost:5678` accessible | Will | 10m | 2.4, 2.5 | 7 (session state: n8n up) |
| 2.13 | Apply Supabase schema: run `schemas/supabase-schema.sql` in Supabase SQL editor | Will | 10m | 2.9, Phase 1 | 8 (external resource state) |
| 2.Z | Will authors meta-eval fixtures: `test-cases/meta-eval/intentionally-bad-memo.json` and `intentionally-good-memo.json` (investment-professional criteria per design §4) | Will | 45m | 2.Y (schema must exist) | 9 |
| 2.14 | Initial commit of scaffolding; Receipt in `docs/agents/claude.md` | claude | 10m | 2.1–2.11, 2.Y, 2.Z | 1, 7, 8 |

### 4.3 Acceptance criteria

| Criterion | Verification |
|---|---|
| Repo structure matches design §2.3 / CONTEXT §6 | `git ls-tree -r HEAD --name-only \| diff - <(cat docs/plans/expected-tree.txt)` (expected-tree written during 2.1) OR manual tree review |
| `docker-compose up` starts n8n without error | `docker compose up -d && docker compose ps --format json \| jq '.[] \| select(.Name=="n8n") \| .State'` returns `"running"` |
| n8n UI accessible with basic auth | `curl -u admin:${N8N_BASIC_AUTH_PASSWORD} -s -o /dev/null -w '%{http_code}' http://localhost:5678/rest/login` returns `200` |
| Supabase `deal_memos` table exists | SQL `SELECT count(*) FROM deal_memos;` returns 0 (table exists, empty) |
| Community nodes installed (`n8n-nodes-openai-langfuse`, `@langfuse/n8n-nodes-langfuse`) | n8n UI Settings → Community Nodes shows both; OR `docker exec n8n ls /home/node/.n8n/nodes/node_modules \| grep langfuse` returns both |
| All 6 stub prompt files exist | `ls prompts/*.md \| wc -l` ≥ 6 |
| JSON Schema file validates against design §3 | `node -e "const s=require('./schemas/agent-output-schemas.json'); const Ajv=require('ajv'); new Ajv({strict:false}).compile(s);"` exits 0 |
| Meta-eval fixtures exist and validate against memo schema | `node scripts/validate-fixture.js test-cases/meta-eval/intentionally-bad-memo.json` exits 0 |
| INDEX aligned | `npx @gpgaoplane/multi-agent-collab check` returns `OK` |
| D-2 and D-3 recorded | `grep -E '^## D-[23]' .claude/memory/decisions.md \| wc -l` returns 2 |

### 4.4 Parallelization

Spikes 2.0a, 2.0b are parallelizable. Once spikes complete, tasks 2.1–2.11, 2.Y, 2.10, 2.11 are parallelizable within Claude Code. Task 2.Z (Will) runs in parallel with Claude Code work once 2.Y lands.

### 4.5 Known risks

- Community node installation via env vars can fail silently — verify in UI.
- `NODE_FUNCTION_ALLOW_EXTERNAL=ajv` may not be sufficient if the package isn't in the n8n image. Fallback path pre-specified per design §3.2.
- Qwen tool-use behavior varies — spike results determine topology.

### 4.6 Time-box trigger

**If Phase 2 > 4.5h:** assess whether both spikes hit their fallback paths (doubles the rework). If so, escalate to Will for scope decision — consider dropping Portfolio Fit agent or Evaluator Agent per rollback §9.

### 4.7 Phase-closure Receipt

Emit per §2. Expected decisions: D-2 (Contradiction topology), D-3 (schema validation path). Invariants touched: possibly I-6 refined if the swap-point `Set` node design changes.

## §5 — Phase 3: Core Build

**Goal.** Full workflow implemented end-to-end. One successful run on CoreWeave documents produces a memo in Supabase. No quality bar at this phase — just structural completeness.

### 5.1 Workflow track tasks

| # | Task | Owner | Est. | Depends | Routing rows |
|---|---|---|---|---|---|
| 3.1 | Implement Form Trigger node per design §2.1 | claude | 15m | Phase 2 | 1, 7 |
| 3.2 | Implement Coordinator (Set node) emitting run_id, deal_id, source_manifest, timestamps per design §2.2 | claude | 20m | 3.1 | 1, 4 (source_manifest is architecture-relevant) |
| 3.3 | Implement Document Ingestion pipeline (Extract → Splitter → Embeddings → aggregate chunk store) per design §2.3 (per D-6: hand-rolled Code-node aggregate store, not n8n Simple Vector Store) | claude | 45m | 3.2 | 1 |
| 3.4 | Configure parameterized LLM HTTP Request node (base URL + model from Set node) | claude | 30m | 3.2 | 1, 3 (parameterization choice) |
| 3.5 | Wire Extraction Agent path per D-6: Split Per-Document → 12 retrieval queries (11 section + 1 union) → embed each via HTTP Request → JS cosine rank against aggregate chunk store → assemble per-document context → raw HTTP Request to chat-completions → Code-node parse. Section-targeted retrieval per design §2.4 (semantics preserved; mechanism rewritten). | claude | 45m | 3.4, 3.P1r | 1, 4 (retrieval pattern is architecture) |
| 3.6 | Wire Contradiction Agent per D-2 (Variant A or B). Per D-6: Variant A is implemented as a hand-rolled raw-HTTP + Code-node tool-call loop with a `retrieve_document` function-tool, not via an n8n AI Agent node. | claude | 30m | 3.5, 3.P2r, D-2 | 1 |
| 3.7 | Wire Gap Analysis Agent node | claude | 30m | 3.6, 3.P3 | 1 |
| 3.8 | Implement Red Flag Detector sub-workflow: Execute Workflow → JS Code node wrapping `code/red-flag-detector.js` | claude | 30m | 3.7, 3.P7v | 1 |
| 3.9 | Wire Portfolio Fit Agent node (loads `sagard-portfolio.json`) | claude | 30m | 3.8, 3.P4 | 1 |
| 3.10 | Implement Citation Validity Check node per design §3.1 (dedicated Code node) | claude | 30m | 3.9 | 1, 4 (citation machinery is architecture) |
| 3.11 | Wire Memo Generation Agent node with schema-enforced output | claude | 45m | 3.10, 3.P5r | 1 |
| 3.12 | Implement schema-validation-with-retry machinery per design §3.3 (Code node after each agent; retry contract) | claude | 60m | 2.Y, 3.5 | 1, 4 (retry contract is architecture) |
| 3.13 | Wire Evaluator Agent node | claude | 30m | 3.11, 3.P6 | 1 |
| 3.14 | Implement routing IF node: `evaluator_score < 35 OR critical_issues_HIGH` → flagged | claude | 20m | 3.13 | 1 |
| 3.15 | Implement Supabase write node (INSERT; status state machine per design §2.11) | claude | 25m | 3.14 | 1 |
| 3.16w | Implement Slack notification node with Block Kit JSON per design §2.13 | claude | 30m | 3.15 | 1 |
| 3.17w | Implement error-handling branch for unhandled exceptions | claude | 20m | 3.15 | 1 |
| 3.18w | Write `scripts/run-meta-eval.js` — invokes Evaluator on both meta-eval fixtures, computes discrimination gap, prints pass/fail | claude | 45m | 3.13, 2.Z | 1, 9 |
| 3.19w | Write `scripts/validate-memo-citations.js` — reads a deal_memos row by run_id, re-runs Citation Validity check, prints any invalid sources | claude | 30m | 3.10, 3.15 | 1, 9 |
| 3.20w | Write `scripts/validate-fixture.js` — validates a fixture JSON against the memo schema in `schemas/agent-output-schemas.json` | claude | 20m | 2.Y | 1, 9 |

(Task numbers with 'w' suffix distinguish workflow-track from prompt-track where the original used the same numbers.)

### 5.2 Code/prompt track tasks

**Numbering note.** Prompt-track tasks use `P` prefix (`3.P1`–`3.P7`) to disambiguate from workflow-track tasks (`3.1`–`3.17w`). No ambiguity in later references.

| # | Task | Owner | Est. | Depends | Routing rows |
|---|---|---|---|---|---|
| 3.P1 | Draft Extraction Agent prompt (7-part checklist; framework: IC Memo Taxonomy) | claude | 45m | Phase 2 | 1, 9 |
| 3.P1c | **Codex review** of Extraction draft (per §10 trigger 1) | codex or claude (skip-log) | 15m | 3.P1 | 10 |
| 3.P1r | Claude Chat refinement of Extraction prompt (Will invokes) | Will + Claude Chat | 30m | 3.P1c | 1 (via Will) |
| 3.P2 | Draft Contradiction Agent prompt — both Variant A (tool-use) and Variant B (stuffed) per D-2 | claude | 60m | Phase 2 | 1, 9 |
| 3.P2c | Codex review (per §10 trigger 1) | codex or claude | 15m | 3.P2 | 10 |
| 3.P2r | Claude Chat refinement (both variants) | Will + Claude Chat | 45m | 3.P2c | 1 |
| 3.P3 | Draft Gap Analysis prompt (framework: LP Diligence Checklist) | claude | 45m | Phase 2 | 1, 9 |
| 3.P3c | Codex post-commit review (findings → Phase 4 input per §10 trigger 1) | codex or claude | 15m | 3.P3 (committed) | 10 |
| 3.P4 | Draft Portfolio Fit prompt (framework: Sagard Thesis Alignment) | claude | 30m | Phase 2 | 1, 9 |
| 3.P4c | Codex post-commit review | codex or claude | 15m | 3.P4 (committed) | 10 |
| 3.P5 | Draft Memo Generation prompt (framework: IC Memo + Citation Enforcement; references source_manifest) | claude | 60m | Phase 2 | 1, 9 |
| 3.P5c | Codex review (per §10 trigger 1) | codex or claude | 15m | 3.P5 | 10 |
| 3.P5r | Claude Chat refinement | Will + Claude Chat | 45m | 3.P5c | 1 |
| 3.P6 | Draft Evaluator prompt (framework: Six-Criteria Quality Check; meta-eval-aware) | claude | 45m | Phase 2 | 1, 9 |
| 3.P6c | Codex post-commit review | codex or claude | 15m | 3.P6 (committed) | 10 |
| 3.P7 | Implement `code/red-flag-detector.js` full logic per design §2.7 with constants, regex-with-negation, regex scoping | claude | 60m | Phase 2 | 1, 9 |
| 3.P7t | Write `code/test/red-flag-detector.test.js` with ~35 tests (Node 22 `--test` runner) | claude | 75m | 3.P7 | 1, 9 |
| 3.P7v | Run test suite: `node --test code/test/red-flag-detector.test.js` — all pass | claude | 10m | 3.P7t | — (verification) |
| 3.P7c | **Codex review** of RFD code + tests (per §10 trigger 2) | codex or claude (skip-log) | 20m | 3.P7v | 10 |
| 3.P8 | Upload all 6 (or 7) prompts to Langfuse Prompt Management; tag `production`, `v1` | Will | 30m | 3.P1r, 3.P2r, 3.P5r, 3.P3, 3.P4, 3.P6 all committed | 8 (external resource state) |

### 5.3 Langfuse integration

| # | Task | Owner | Est. | Depends | Routing rows |
|---|---|---|---|---|---|
| 3.24 | Configure Langfuse community node credentials in n8n | Will | 10m | Phase 2 | 8 |
| 3.25 | Wrap all LLM HTTP Request nodes with Langfuse tracking (community node OR manual HTTP per fallback) | claude | 30m | 3.24, 3.11 | 1, 3 (path choice recorded D-4) |
| 3.26 | Configure Langfuse Prompt Management fetch at runtime | claude | 30m | 3.P8 | 1 |
| 3.27 | Implement manual Langfuse span for Red Flag Detector per design §2.12 | claude | 30m | 3.25, 3.8 | 1, 4 |
| 3.28 | Submit evaluator scores to Langfuse Scores API | claude | 15m | 3.13, 3.25 | 1 |
| 3.29 | Verify first traces appear in Langfuse dashboard | Will | 10m | 3.25 | — |

### 5.4 Acceptance criteria

| Criterion | Verification |
|---|---|
| Workflow triggers via Form Trigger | `curl -X POST http://localhost:5678/webhook/deal-diligence -F "company_name=CoreWeave" -F "documents=@test-cases/coreweave/s-1.pdf" -F "documents=@test-cases/coreweave/press-release.pdf"` returns 200; run_id visible in n8n executions |
| Document ingestion populates the aggregate chunk store (per D-6) | Post-run `Aggregate Vector Store` node output shows `chunks.length > 0` with each chunk carrying text + 2048-dim embedding + source metadata |
| All 7 specialist agents execute without error on CoreWeave run | n8n execution view: all agent nodes show green |
| Red Flag Detector emits non-empty `red_flags` for CoreWeave (must find customer concentration) | `SELECT red_flags FROM deal_memos WHERE deal_id='coreweave' ORDER BY created_at DESC LIMIT 1;` contains `customer_concentration_extreme` |
| Memo is written to Supabase with all required fields | `SELECT count(*) FROM deal_memos WHERE deal_id='coreweave' AND status != 'error';` ≥ 1 |
| Citations populated with format per design §2.4 regex | SQL: `SELECT jsonb_array_elements(key_risks)->>'sources' FROM deal_memos WHERE deal_id='coreweave';` — every row matches regex via client-side validation |
| Slack message received in `#investment-team` | Manual check of Slack channel — message appears with Block Kit formatting |
| LLM calls traced in Langfuse with correct metadata | Langfuse dashboard session view for `run_id`: 7 LLM generations + 1 manual RFD span |
| Meta-eval discrimination (first pass) | `node scripts/run-meta-eval.js` prints `gap = <n>`; acceptable to fail this in Phase 3 (final gate is Phase 4) |
| Schema validation retry contract works | Deliberately corrupt Extraction output via manual test; verify retry fires once; verify partial record on second fail |
| RFD unit tests pass | `node --test code/test/red-flag-detector.test.js` exits 0 |

### 5.5 Parallelization

- Prompt track (`3.P1`–`3.P7`) parallelizable with workflow track (`3.1`–`3.20w`) until task 3.5 needs the Extraction prompt.
- All 6 prompt drafts can be written in parallel.
- Claude Chat refinement (`3.P1r`, `3.P2r`, `3.P5r`) happens after Claude Code drafts and Codex review, runs in Will's hands.

### 5.6 Known risks

- **Variant A tool-use mid-run failure.** If D-2 chose Variant A but runtime tool-use flakes, switch to Variant B mid-run (per design §6). Document in pitfalls.
- **Langfuse community node unreliable.** D-4 decides between community-node path and manual HTTP path at task 3.25.
- **Schema compliance is the #1 LLM failure mode.** Expect Phase 3's end-to-end test to require 2-3 prompt iterations on Extraction alone.
- **Token budget overruns.** If Extraction exceeds ~70K input per document, reduce `RETRIEVAL_K_SECTION` from 5 to 4. Tuning lives in the `Set` node.

### 5.7 Time-box trigger

**If Phase 3 > 9h:** scope-cut per rollback §9. Likely cut: drop Portfolio Fit agent (least-critical specialist) or switch to pre-generated mock LLM responses for demo.

### 5.8 Phase-closure Receipt

Emit per §2. Expected decisions: D-4 (Langfuse trace path), D-5 (retrieval k tuning if changed). Invariants touched: none expected unless design changes surface.

## §6 — Phase 4: Dev Iteration (CoreWeave)

**Goal.** Evaluator score ≥ 40 on CoreWeave AND meta-eval discrimination `score(good) - score(bad) ≥ 20`.

**Iteration cap.** Max 3 iterations per prompt. After 3: escalate to Will. Reason: unlimited iteration is how these projects slip; cap is an honest tripwire.

### 6.1 Tasks

| # | Task | Owner | Est. | Depends | Routing rows |
|---|---|---|---|---|---|
| 4.1 | First full end-to-end run on CoreWeave | Will | 15m | Phase 3 | 7 |
| 4.2 | Review Extraction output: every major fact captured with citations? | Will | 20m | 4.1 | — (review) |
| 4.3 | If needed: iterate Extraction prompt. Cap 3 rounds. | claude (draft) + Will/Claude Chat (refine) | 30m × ≤3 | 4.2 | 1, 3 (iteration choices) |
| 4.4 | Review Contradiction output: known CoreWeave contradictions found? (management "strong diversification" claim vs. 77% concentration) | Will | 20m | 4.1 | — |
| 4.5 | If needed: iterate Contradiction prompt. Cap 3 rounds. | claude + Will/Claude Chat | 30m × ≤3 | 4.4 | 1 |
| 4.6 | Review Gap Analysis: important LP items flagged? | Will | 15m | 4.1 | — |
| 4.7 | If needed: iterate Gap Analysis prompt. Cap 3 rounds. | claude | 20m × ≤3 | 4.6 | 1 |
| 4.8 | Review Red Flag output: customer concentration (77%), material weakness, debt structure? | Will | 15m | 4.1 | — |
| 4.9 | If needed: iterate RFD JS. Cap 3 rounds. Codex review on each round if available. | claude (+ codex) | 30m × ≤3 | 4.8 | 1, 6 (recurring bug pattern); 10 (if Codex) |
| 4.10 | Review Portfolio Fit: thesis alignment reasonable? | Will | 10m | 4.1 | — |
| 4.11 | If needed: iterate Portfolio Fit prompt OR `sagard-portfolio.json`. Cap 3 rounds. | claude | 30m × ≤3 | 4.10 | 1 |
| 4.12 | Review Memo: IC-grade? Citations complete? | Will | 30m | 4.1 | — |
| 4.13 | If needed: iterate Memo Generation prompt. Highest-stakes; cap 3 rounds. | claude + Will/Claude Chat | 45m × ≤3 | 4.12 | 1 |
| 4.14 | Review Evaluator output: does score reflect actual quality? | Will | 15m | 4.1 | — |
| 4.15 | If needed: iterate Evaluator prompt. Cap 3 rounds. | claude | 20m × ≤3 | 4.14 | 1 |
| 4.16 | **Run meta-eval.** Invoke Evaluator on `intentionally-bad-memo.json` and `intentionally-good-memo.json`. Compute discrimination gap. | Will | 10m | any Evaluator iteration | — (verification) |
| 4.17 | If meta-eval gap < 20: iterate Evaluator prompt specifically on the failing criteria. Cap 3 rounds (shared with 4.15 cap). | claude | 20m × ≤3 | 4.16 | 1, 3 |
| 4.18 | Second full end-to-end run on CoreWeave | Will | 15m | 4.3–4.15 done | 7 |
| 4.19 | Confirm evaluator score ≥ 40 AND meta-eval gap ≥ 20 AND all §6.2 acceptance criteria | Will | 10m | 4.18 | — |

### 6.2 Acceptance criteria

| Criterion | Verification |
|---|---|
| Evaluator score on CoreWeave ≥ 40 | `SELECT evaluator_score FROM deal_memos WHERE deal_id='coreweave' ORDER BY created_at DESC LIMIT 1;` ≥ 40 |
| **Meta-eval gap ≥ 20** | `node scripts/run-meta-eval.js` reports `gap >= 20` |
| Bad-fixture `routing_decision = flagged_for_review` | script output shows `routing_decision` for bad fixture |
| Bad-fixture critical_issues includes planted hallucination | script checks `critical_issues[].description` contains known planted defect keyword |
| Memo identifies CoreWeave customer concentration (77%) | `SELECT key_risks FROM deal_memos WHERE deal_id='coreweave' ORDER BY created_at DESC LIMIT 1;` contains keyword `customer concentration` AND `77` |
| Memo identifies material weakness | same query — `material weakness` present |
| Memo identifies debt-heavy capital structure | `debt` present in `key_risks` with severity HIGH |
| Every claim has a source citation | `node scripts/validate-memo-citations.js <run_id>` returns 0 |
| Portfolio fit notes AI infra outside Sagard scope | `portfolio_fit.overall_alignment = 'LOW'` AND rationale contains `AI infrastructure` |
| No hallucinations flagged | `critical_issues` does not contain type `potential_hallucination` for CoreWeave run |
| No iteration exceeded cap of 3 | `docs/agents/claude.md` work-log shows ≤ 3 iteration entries per prompt; if exceeded, Phase 4 auto-escalates |

### 6.3 Parallelization

Iterations on different agents can proceed in parallel. Memo Generation iteration usually waits until upstream agents are stable.

### 6.4 Known risks

- This is where most real work happens; underestimating is a common failure.
- Iteration cap of 3 is a **real** constraint, not aspirational. Honor it.
- If Evaluator is too lenient (meta-eval gap < 20 after 3 iterations), **fix Evaluator first** before trusting its CoreWeave scores — otherwise you're navigating by a broken compass.

### 6.5 Time-box trigger

**If Phase 4 > 4.5h:** hit the cap. Stop iterating. Either (a) accept current quality and proceed to Phase 5, (b) scope-cut per rollback §9.

### 6.6 Phase-closure Receipt

Emit per §2. Expected decisions: D-6 (any prompt-structure choices that stuck). Pitfalls: any recurring issue (cite-format mismatches, tool-use flakes, etc.) go to `.claude/memory/pitfalls.md`.

## §7 — Phase 5: Generalization Test (Cerebras)

**Goal.** Same workflow, no code changes, produces a quality memo on Cerebras. Evaluator score ≥ 35 (slightly lower bar for first-time case). Meta-eval gap still ≥ 20.

### 7.1 Tasks

| # | Task | Owner | Est. | Depends | Routing rows |
|---|---|---|---|---|---|
| 5.1 | Full end-to-end run on Cerebras documents | Will | 15m | Phase 4 | 7 |
| 5.2 | Verify evaluator score ≥ 35 | Will | 10m | 5.1 | — |
| 5.3 | Review memo for Cerebras findings: 86% concentration, material weakness, OpenAI backlog characterization | Will | 20m | 5.1 | — |
| 5.4 | Re-run meta-eval to confirm discrimination gap unchanged (no Cerebras-specific regression) | Will | 10m | 5.1 | — |
| 5.5 | If quality materially lower than CoreWeave: diagnose. Common causes: document size (Cerebras S-1 300+ pages), withdrawn prior filing, complex capital structure. | Will | 30m | 5.3 | 6 (pitfall if pattern) |
| 5.6 | Prefer NOT to touch prompts (system should generalize). If required: minimal prompt adjustments only, with justification. | claude | 30m | 5.5 | 1, 3 (if changes made) |
| 5.7 | Second run on Cerebras after any adjustments | Will | 15m | 5.6 | 7 |
| 5.8 | Lock final Cerebras output for demo; save to `outputs/cerebras-memo.json` | Will | 10m | 5.7 | 9 |

### 7.2 Acceptance criteria

| Criterion | Verification |
|---|---|
| Cerebras evaluator score ≥ 35 | SQL: `SELECT evaluator_score FROM deal_memos WHERE deal_id='cerebras' ORDER BY created_at DESC LIMIT 1;` ≥ 35 |
| Memo identifies customer concentration risk | `key_risks` contains `concentration` |
| Memo identifies material weaknesses | `key_risks` contains `material weakness` |
| Memo correctly characterizes OpenAI deal as backlog vs revenue | manual review — memo text specifically notes "backlog" OR "not recognized" |
| Meta-eval gap ≥ 20 still holds | `node scripts/run-meta-eval.js` |
| No prompt changes OR prompt changes documented in work log | `docs/agents/claude.md` shows either "no prompt changes" or itemized changes with rationale |
| `outputs/cerebras-memo.json` exists | `test -f outputs/cerebras-memo.json` |

### 7.3 Known risks

- Overfitting to CoreWeave during Phase 4 surfaces here. Mitigation: Phase 4 prompt iterations should be principled, not spot-fixed.
- Cerebras S-1 is larger. If chunking strategy fails: tune `CHUNK_SIZE` or `RETRIEVAL_K_SECTION` in the `Set` node — single-variable change.
- If generalization fails badly: switch demo case back to CoreWeave and explain choice honestly (per rollback §9).

### 7.4 Time-box trigger

**If Phase 5 > 3h:** accept current quality OR switch demo to CoreWeave.

### 7.5 Phase-closure Receipt

Emit per §2.

## §8 — Phase 6: Demo and Documentation

**Goal.** 2–3 minute demo video recorded and uploaded. 250-word written explanation drafted and reviewed. Repo polished.

### 8.1 Tasks

| # | Task | Owner | Est. | Depends | Routing rows |
|---|---|---|---|---|---|
| 6.1 | Draft demo script with timing (2–3 min) | claude + Will/Claude Chat | 45m | Phase 5 | 1, 9 |
| 6.2 | Dry-run demo end-to-end. **Fallback protocol:** if live fails during recording, cut to pre-recorded "known-good run" screen capture. | Will | 30m | 6.1 | 7 |
| 6.3 | Pre-recording checkpoint: `docker compose up -d`; test ping via `curl` to webhook; Langfuse dashboard open in browser; Supabase editor open; Slack channel visible | Will | 10m | 6.2 | — (setup) |
| 6.4 | Record demo (expect 2–5 takes) | Will | 90m | 6.3 | — (artifact) |
| 6.5 | Light editing (trim start/end; no fancy cuts) | Will | 30m | 6.4 | — |
| 6.6 | Upload to YouTube (unlisted) or Google Drive; note URL | Will | 15m | 6.5 | — |
| 6.7 | Draft 250-word written explanation (uses design §5 scaling bottlenecks language) | Will + Claude Chat | 30m | Phase 5 | 1, 9 |
| 6.8 | Will review + edit written explanation | Will | 15m | 6.7 | — |
| 6.9 | Polish README.md for external viewing | claude + Will/Claude Chat | 30m | Phase 5 | 1 |
| 6.10 | Repo cleanup: verify no committed secrets; remove test artifacts; verify `.gitignore` coverage | claude | 20m | 6.9 | 1, 7 |
| 6.10c | **Codex review** of cleanup (if Codex available; else claude logs skip) | codex or claude | 20m | 6.10 | 10 |
| 6.11 | Final commit; push to GitHub | Will | 10m | 6.10c | 1, 7 |

### 8.2 Acceptance criteria

| Criterion | Verification |
|---|---|
| Demo video 2–3 minutes | video duration check; 120s ≤ duration ≤ 180s |
| Demo shows all required scenes | scene list: docker-compose up, n8n UI, form submission, workflow execution, Supabase output, Langfuse traces. Manual review. |
| Written explanation ≤ 250 words | `wc -w < docs/submission/written-explanation.md` ≤ 250 |
| README presentable | Manual review — hiring-manager lens |
| No committed secrets | `git log --all --full-history -p \| grep -E '(ALICLOUD_API_KEY\|SUPABASE_SERVICE_ROLE_KEY\|LANGFUSE_SECRET_KEY\|SLACK_WEBHOOK)' \| head` returns empty (absence proof) |
| All critical files in repo | `ls n8n/workflow.json prompts/*.md code/red-flag-detector.js schemas/*.sql schemas/*.json` — all exist |
| Final commit pushed | `git log origin/main..HEAD` empty (branch ahead of remote = not pushed; this should be empty = all pushed) |

### 8.3 Parallelization

Demo script (6.1) and written explanation (6.7) parallel. README polish (6.9) parallel with demo recording.

### 8.4 Known risks

- Demo recording often 3–5 takes.
- Live demo will break in unexpected ways. Fallback protocol is non-optional.
- YouTube upload processing: 10–30 min; factor in.

### 8.5 Time-box trigger

**If Phase 6 > 4h:** keep iterating; the original deadline has already passed and there is no active time pressure. Quality of the demo matters more than speed.

### 8.6 Phase-closure Receipt

Emit per §2.

## §9 — Phase 7: Submission

**Goal.** Email reaches Pari with a complete, demo-quality submission. The original 2026-04-24 deadline has passed; submission timing is now driven by quality, not the calendar.

### 9.1 Tasks

| # | Task | Owner | Est. | Depends | Routing rows |
|---|---|---|---|---|---|
| 7.1 | Draft submission email (brief; mentions local-first, Claude Code / Codex / Claude Chat / multi-agent-collab usage, observability, meta-eval) | Will + Claude Chat | 15m | Phase 6 | 1, 9 (email stored in `docs/submission/email-draft.md`) |
| 7.2 | Will personalizes email | Will | 10m | 7.1 | 1 |
| 7.3 | Send email: video link + written explanation (inline) + repo link | Will | 5m | 7.2 | — (terminal action) |
| 7.4 | Flip `docs/submission/email-draft.md` to `status: reference-only` after send | claude | 5m | 7.3 | 9 (status change) |

### 9.2 Acceptance criteria

| Criterion | Verification |
|---|---|
| Email sent (no active deadline; submission timing is quality-driven, post the original 2026-04-24 deadline) | timestamp in Sent folder |
| Email includes video link / file, written explanation, repo link | visual inspection |
| Email is concise and professional | Will's judgment |

### 9.3 Phase-closure Receipt

Emit per §2 — final Receipt of the project.

## §10 — Codex engagement protocol

Codex is a Will-invoked reviewer. This plan specifies trigger points; whether Codex actually runs is Will's call. If Codex is unavailable for a trigger point, `claude` logs the skip in `docs/agents/claude.md` with one-line rationale.

**Trigger points (numbered, decision-friendly):**

1. **Prompt first-draft review.** Codex reviews for 7-part checklist compliance and output-schema match. Timing differs by prompt type:
   - **With Claude Chat refinement** (three high-stakes prompts: Extraction `3.P1`, Contradiction `3.P2`, Memo Gen `3.P5`): Codex runs **after claude's draft, before Claude Chat refinement.** Sequence: `3.Pn` claude-draft → `3.Pnc` codex-review → `3.Pnr` Claude-Chat-refine → commit.
   - **Without Claude Chat refinement** (Gap `3.P3`, Portfolio `3.P4`, Evaluator `3.P6`): Codex runs **post-commit** (`3.P3c`, `3.P4c`, `3.P6c`). Findings become Phase 4 iteration input (not blocking for Phase 3 wiring).
2. **After Red Flag Detector JS + tests pass.** Codex reviews logic, constants, regex negation handling. Trigger: task `3.P7c`.
3. **After workflow.json export during Phase 3 major milestones.** Codex reviews node wiring, credential references, connection topology. Suggested trigger: after task 3.15w (first end-to-end wire) and end of Phase 3.
4. **During Phase 4 RFD iteration (task 4.9).** Codex reviews each rework.
5. **Before Phase 6 demo — repo cleanup review.** Trigger: task 6.10c.

**Feedback flow.** Codex writes findings to `docs/agents/codex.md`. Claude Code reads on session start (via delta-read), responds in `docs/agents/claude.md`. Disagreements: both positions surfaced in work logs; Will arbitrates.

**Skip-logging format** (`docs/agents/claude.md` entry):

```markdown
### Codex skip
Trigger: <task #>
Reason: <"Codex not invoked by Will" OR "Codex unavailable" OR "skipped per Will's direction">
Risk accepted: <one-line of what review would have caught>
```

## §11 — Ownership in framework agent names

| Responsibility | Owner (framework agent name) |
|---|---|
| External account creation | Will |
| Credentials, `.env` | Will |
| Manual testing + quality review | Will |
| Claude Chat invocation (prompt refinement, written explanation, demo script, submission email) | Will (with Claude Chat assist) |
| Meta-eval fixture authorship | Will |
| Demo recording | Will |
| Final email send | Will |
| Repo file creation + code (workflow.json, scripts, schemas, code/*, prompts/* drafts, configs) | claude |
| First drafts of all prompts | claude |
| Phase 4 prompt iterations | claude |
| Documentation drafts | claude |
| Repository cleanup | claude |
| Phase closure Receipts | claude |
| Review of claude's work (optional, Will-invoked) | codex |
| Alternative implementations when Will asks for a second opinion | codex |
| Repo cleanup review | codex |

**Note.** "Claude Chat" is not a framework agent. Where the original plan listed "Claude Chat" as an owner, this plan attributes to "Will (with Claude Chat assist)" — acknowledging Claude Chat is a Will-wielded tool, not a framework peer.

## §12 — Dependency graph

```
Phase 0 (Planning) ─── ✅ ──┐
                            │
Phase 1 (Env Setup) ────────┼──▶ Phase 2 (Scaffolding + Spikes)
                            │         │
                            │         ▼
                            │    Phase 3 (Core Build)
                            │         │
                            │         ▼
                            │    Phase 4 (Dev Iteration)
                            │         │
                            │         ▼
                            │    Phase 5 (Generalization)
                            │         │
                            │         ▼
                            │    Phase 6 (Demo & Docs)
                            │         │
                            │         ▼
                            └──▶ Phase 7 (Submission)
```

Gates: each arrow crosses a Receipt emission.

## §13 — Verification commands library

Consolidated list of every verification command this plan references. Copy-pasteable.

```bash
# Framework health
npx @gpgaoplane/multi-agent-collab check

# Environment
test -f .env && grep -c '=' .env
git check-ignore .env
docker info 2>&1 | grep -q "Server Version"

# Scaffolding
docker compose up -d
docker compose ps --format json | jq '.[] | select(.Name=="n8n") | .State'
curl -u admin:${N8N_BASIC_AUTH_PASSWORD} -s -o /dev/null -w '%{http_code}' http://localhost:5678/rest/login
node -e "const s=require('./schemas/agent-output-schemas.json'); const Ajv=require('ajv'); new Ajv({strict:false}).compile(s);"

# Red Flag Detector tests
node --test code/test/red-flag-detector.test.js

# Workflow
curl -X POST http://localhost:5678/webhook/deal-diligence -F "company_name=CoreWeave" -F "documents=@test-cases/coreweave/s-1.pdf"

# Meta-evaluation
node scripts/run-meta-eval.js

# Citations
node scripts/validate-memo-citations.js <run_id>

# Supabase (via supabase CLI or psql)
psql "$SUPABASE_URL" -c "SELECT evaluator_score FROM deal_memos WHERE deal_id='coreweave' ORDER BY created_at DESC LIMIT 1;"

# Secrets audit
git log --all --full-history -p | grep -E '(API_KEY|SERVICE_ROLE_KEY|SECRET_KEY|WEBHOOK)' | head
```

## §14 — Current status

**Phase 0:** ✅ Complete (2026-04-24) — CONTEXT.md v2, DESIGN.md (v1 @ reference-only), this plan v1, IMPLEMENTATION.md (v1 @ reference-only), `multi-agent-collab` framework bootstrapped.

**Phase 1:** ✅ Complete (2026-04-24) — Docker Desktop, Supabase project + keys, Langfuse Cloud project + keys, Slack webhook, Alicloud DashScope credits, 4 CoreWeave PDFs, 4 Cerebras PDFs, all credentials sanity-tested live.

**Phase 2:** ✅ Complete (2026-04-24) — Spike 2.0a (Qwen tool-use → D-2), spike 2.0b (ajv compile blocked → D-3 hand-rolled validator + P-1), full directory structure, docker-compose.yml, .env.example, scripts (up/down/import/export), all 7 prompt stubs, supabase-schema.sql, agent-output-schemas.json (25 $defs), red-flag-detector.js skeleton, sagard-portfolio.json, json-schema-validator.js (25/25 tests pass), meta-eval fixtures.

**Phase 3:** ✅ Complete (2026-04-25) — 52-node workflow (45-node main + 5-node error sub-flow + 2-node Langfuse pair). All 7 specialists wired and runtime-verified on CoreWeave across 3 E2E runs. D-5 (OpenRouter embeddings), D-6 (formalized hand-rolled aggregate chunk store + raw-HTTP tool-use loops as canonical pattern). Pitfalls P-2/P-3/P-4 captured. Per-agent schema-validation-with-retry (3.12) deferred — parsers' shape projection sufficient for prototype.

**Phase 4:** ✅ Complete (2026-04-26) — Memo anti-empty-shell rules (rule 7 narrowing + rule 8 anti-empty-shell + 6 silent self-revise checks); Evaluator empty-upstream handling + reactive all-zero rule; meta-eval discrimination = 25 points on real CoreWeave upstream (target ≥ 20); RFD MATERIAL_WEAKNESS regex extended for phrase-first verb forms; RFD wrapper P-6 fix (source_type lookup) raised functional detector coverage from 4-of-10 to 8-of-10 on CoreWeave; Memo severity semantics for key_strengths (HIGH = institutional materiality, NOT magnitude); Extraction S-1 retrieval-query refinements (S-1 phrasing variants for company_overview + management_assessment). Active model swapped from `qwen3-max-preview` to `qwen3-max-2025-09-23` (commit `48cb64d`). Pitfalls P-5 (qwen3-max-preview eager-bypass with 5-step workaround pattern) and P-6 (contract-shape changes must propagate to all consumers) captured. Live verification on workflow `versionId: phase4-step3a-v25` produced 5 red_flags including `material_weakness HIGH` (NEW) + `related_party_above_threshold MEDIUM` (BONUS) + `dual_class_structure LOW` (BONUS). Memo + Evaluator clean.

**Phase 5:** ✅ Complete (2026-04-26) — Cerebras generalization confirmed end-to-end. Pipeline ran on `test-cases/cerebras/` (4 PDFs) with no code changes. RFD: `regulatory_filing_count: 1`, `total_chunks: 289`, ≥3 flags including `related_party_above_threshold` MEDIUM (OpenAI Warrant — true positive) + `dual_class_structure` LOW (Class A common stock). Extraction populated Cerebras S-1 financials (cash $1.336B, operating loss $145.86M FY2025) with full competitor list. Cross-source numerical agreement S-1 ↔ Cerebras Analyst Report (#2). Multi-source disambiguation `(#2)` suffix working. Memo + Evaluator clean per Will. P-5 prompt fixes confirmed model-class (not deal-class). P-6 RFD wrapper fix's value re-confirmed across two deal packets.

**Phase 6:** IN FLIGHT (2026-04-26) — Submission writeup at `docs/submission-writeup.md` (237 words in the headline section + reading order + 6-item production-changes list + invariants pointer + acknowledgments). Demo runbook at `docs/demo-runbook.md` (3-4 min Loom script with timestamps and voice-over text). Sample-runs scaffold at `docs/sample-runs/README.md`. Branch pushed to `origin/main` at commit `da02148`. Remaining Phase 6 work is on Will: (a) Loom recording per the runbook, (b) Loom URL slot-in (search for `<Loom URL placeholder>` in the writeup), (c) voice/style revision pass on the writeup.

**Phase 7:** Not started. Entry point: submission to Pari (writeup + Loom URL + repo URL).

**Current blockers:** None.

**Current focus:** Will-side Phase 6 deliverables (Loom + URL slot-in + voice revision); after those land, Phase 6 closes and Phase 7 opens.

## §15 — Diff from original IMPLEMENTATION.md

| Original | Plan | Preserved | Refined | Added |
|---|---|---|---|---|
| §1 Phase Overview | §1 + §2 | 7 phases, sequence, goals | Phase-closure Receipt gate added | Parameterized Receipt template |
| §2 Phase 1 | §3 | All tasks | Verification commands per AC; time-box trigger; routing rows | — |
| §3 Phase 2 | §4 | Tasks 2.1–2.14 | Spikes 2.0a/2.0b; JSON Schema file 2.Y; meta-eval fixtures 2.Z; time-box trigger; routing rows | Entire spike/meta-eval prep machinery |
| §4 Phase 3 | §5 | All tasks | Citation Validity Check node (3.10); schema retry machinery (3.12); manual Langfuse span (3.27); Langfuse Scores (3.28); routing rows | — |
| §5 Phase 4 | §6 | Per-agent iteration structure | **Iteration cap of 3** per prompt; meta-eval exit criterion (gap ≥ 20); time-box trigger | Meta-eval run task 4.16/4.17 |
| §6 Phase 5 | §7 | Cerebras test tasks | Re-run meta-eval (5.4); outputs locked | — |
| §7 Phase 6 | §8 | Demo + docs tasks | Fallback protocol (6.2); pre-recording checkpoint (6.3); design §5 scaling language for written explanation | — |
| §8 Phase 7 | §9 | Email send | Post-send status flip for email draft; verification of terminal actions | — |
| §9 Dependency Graph | §12 | Same shape | Receipt gates between phases | — |
| §10 Ownership | §11 | Same roles | Framework agent names (no "Claude Chat" as agent) | — |
| §11 Rollback | — | All 6 fallbacks | — | Triggers moved inline (time-box sections per phase) |
| §12 Current Status | §14 | Phase 0 complete; others not started | — | Phase 0 linked to 2026-04-24 framework adoption |
| — | §2 | — | — | Phase-closure Receipt template |
| — | §10 | — | — | Codex engagement protocol with numbered triggers |
| — | §13 | — | — | Verification commands library (consolidated) |
| §3 task 2.0a (v1 wording: "n8n AI Agent + Simple Vector Store + dummy tool call") | §4 task 2.0a (annotated 2026-04-25 per D-6) | API-level Qwen tool-use confirmation; D-2 outcome | Annotation that the actually-built topology is hand-rolled raw HTTP + Code-node tool-call loop, not the AI Agent node | Cross-reference to D-6 |
| §4 task 3.3 / §5.4 AC (v1 wording: "Simple Vector Store") | §5 task 3.3 / §5.4 AC (formalized 2026-04-25 per D-6) | Chunk-count > 0 verification semantic | Mechanism rewritten to "aggregate chunk store" with explicit 2048-dim embedding shape | Cross-reference to D-6 |

---

**End of implementation plan.**

*This plan is the authoritative execution order for Phases 1–7. Changes require: update `last-updated`, emit Receipt, propagate to `docs/STATUS.md`.*
