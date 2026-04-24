---
status: reference-only
type: implementation-plan
owner: shared
last-updated: 2026-04-24T03:30:00-04:00
read-if: "you need the v1 (2026-04-23) baseline phase structure — but the authoritative execution plan is at `docs/plans/2026-04-24-deal-diligence-implementation.md`"
skip-if: "your question is about current task structure — go to the docs/plans/ implementation plan instead"
related: [CONTEXT.md, DESIGN.md, docs/plans/2026-04-24-deal-diligence-implementation.md, docs/STATUS.md]
---

# Sagard AI Deal Diligence Workspace — Implementation Plan

> **Superseded on 2026-04-24.** The authoritative execution plan is now `docs/plans/2026-04-24-deal-diligence-implementation.md`. This document's 7-phase sequence, time estimates, and rollback options remain the baseline; the plan adds routing-matrix row mappings, verification commands, phase-closure Receipt gates, iteration caps, meta-evaluation exit criteria, spike tasks, and framework-agent-name ownership. See the diff table in §15 of the plan.

**Purpose:** This document is the execution playbook. It tells any AI agent or human exactly what to do, in what order, with what acceptance criteria, and who owns each task.

**Companion documents:**
- `CONTEXT.md` — project scope, constraints, locked decisions
- `DESIGN.md` — how the system works (component internals, data contracts)
- `CLAUDE.md` — Claude Code's working instructions for this repo

**Update frequency:** Constantly. Check off items as complete. Log blockers. Adjust estimates as reality diverges from plan.

**Last updated:** April 23, 2026

---

## 1. Phase Overview

The project is organized into seven phases. Each phase has a clear goal, a time estimate, and a completion gate. Do not advance to the next phase until the current phase's gate is met.

| Phase | Name | Goal | Estimated Time | Gate |
|---|---|---|---|---|
| 0 | Planning Lock | Finalize all planning artifacts | Complete | CONTEXT.md, DESIGN.md, IMPLEMENTATION.md, CLAUDE.md committed |
| 1 | Environment Setup | All infrastructure accounts and local stack ready | 2-3 hours | Docker n8n running, Supabase/Langfuse/Slack accounts created, test docs downloaded |
| 2 | Scaffolding | Repo structure, config files, stub prompts | 1-2 hours | All repo directories populated, .env.example complete, docker-compose working |
| 3 | Core Build | Workflow and all agents implemented | 5-7 hours | End-to-end run on CoreWeave produces a memo |
| 4 | Iteration on Dev Case | Prompt quality refinement using CoreWeave | 2-3 hours | Evaluator score ≥ 40 on CoreWeave, critical findings surfaced |
| 5 | Generalization Test | Same workflow runs on Cerebras | 1-2 hours | Cerebras produces quality memo without code changes |
| 6 | Demo & Documentation | Video, written explanation, README | 2-3 hours | Demo recorded, 250-word explanation ready, repo polished |
| 7 | Submission | Email Pari with deliverables | 15 minutes | Submission sent |

**Total estimated time: 13-20 hours of focused work.**

---

## 2. Phase 1 — Environment Setup

**Goal:** All external accounts are created, credentials are in hand, and the local Docker stack runs.

### 2.1 Tasks

| # | Task | Owner | Estimate | Depends On |
|---|---|---|---|---|
| 1.1 | Verify Docker Desktop installed and running | Will | 5 min | — |
| 1.2 | Create Supabase project, note URL + anon key + service role key | Will | 10 min | — |
| 1.3 | Create Langfuse Cloud account, project `sagard-deal-diligence`, note keys | Will | 10 min | — |
| 1.4 | Create Slack Free workspace (if needed), create `#investment-team` channel, create incoming webhook, note URL | Will | 15 min | — |
| 1.5 | Confirm Alicloud DashScope API key is active and credits are available | Will | 5 min | — |
| 1.6 | Download CoreWeave documents (S-1, Fortune article, Mostly Metrics, Level Headed) into `test-cases/coreweave/` | Will | 15 min | — |
| 1.7 | Download Cerebras documents (S-1, press release, Futurum, Motley Fool) into `test-cases/cerebras/` | Will | 15 min | — |
| 1.8 | Create `.env` locally (never commit) with all credentials from tasks 1.2-1.5 | Will | 10 min | 1.2-1.5 |

### 2.2 Acceptance Criteria

- [ ] All credentials in `.env` and tested (curl against each service returns success)
- [ ] Both test-case folders contain at least 3 documents each
- [ ] Docker Desktop running, `docker --version` works
- [ ] No credentials committed to git (verify with `git status` before any commit)

### 2.3 Parallelization

Tasks 1.1-1.7 are independent and can be done in any order. Task 1.8 depends on credentials from prior tasks.

### 2.4 Known Risks

- Alicloud credit expiry — verify before starting
- Langfuse region choice — use `https://us.cloud.langfuse.com` for North America users
- Slack webhook — free tier allows incoming webhooks without any special setup

---

## 3. Phase 2 — Scaffolding

**Goal:** Repository directory structure is complete, all config files exist, stub prompts are in place, local n8n runs and imports the empty workflow.

### 3.1 Tasks

| # | Task | Owner | Estimate | Depends On |
|---|---|---|---|---|
| 2.1 | Create full repo directory structure per CONTEXT.md Section 6 | Claude Code | 10 min | Phase 1 complete |
| 2.2 | Write `.gitignore` with `.env`, `n8n/n8n-data/`, `outputs/*.json`, standard entries | Claude Code | 5 min | 2.1 |
| 2.3 | Write `.env.example` with all variables from CONTEXT.md Section 7.3 | Claude Code | 10 min | 2.1 |
| 2.4 | Write `docker-compose.yml` per CONTEXT.md Section 7.4 | Claude Code | 15 min | 2.1 |
| 2.5 | Write `scripts/up.sh`, `scripts/down.sh`, `scripts/import-workflow.sh`, `scripts/export-workflow.sh` | Claude Code | 20 min | 2.4 |
| 2.6 | Write minimal README.md pointing to CONTEXT.md | Claude Code | 10 min | 2.1 |
| 2.8 | Write stub prompt files in `prompts/` (6 files, each with placeholder content and schema reference) | Claude Code | 20 min | 2.1 |
| 2.9 | Write `schemas/supabase-schema.sql` from CONTEXT.md Section 5.8 | Claude Code | 10 min | 2.1 |
| 2.10 | Write `schemas/agent-output-schemas.json` from DESIGN.md Section 4 | Claude Code | 20 min | 2.1 |
| 2.11 | Create `code/sagard-portfolio.json` with simulated portfolio companies | Claude Code | 30 min | 2.1 |
| 2.12 | Start n8n: `./scripts/up.sh`, verify `http://localhost:5678` accessible | Will | 10 min | 2.4-2.5 |
| 2.13 | Apply Supabase schema — run `schemas/supabase-schema.sql` in Supabase SQL editor | Will | 10 min | 2.9, Phase 1 |
| 2.14 | Initial commit of all scaffolding | Will | 5 min | 2.1-2.11 |

### 3.2 Acceptance Criteria

- [ ] Repo structure matches CONTEXT.md Section 6 exactly
- [ ] `docker-compose up` starts n8n without error
- [ ] n8n UI accessible at `http://localhost:5678` with basic auth
- [ ] Supabase `deal_memos` table exists and accepts a manual test insert
- [ ] Community nodes installed in n8n (`n8n-nodes-openai-langfuse`, `@langfuse/n8n-nodes-langfuse`)
- [ ] All 6 stub prompt files exist in `prompts/`
- [ ] First commit pushed to GitHub

**Note:** Original task 2.7 ("Create `.progress-log.md` stub") was superseded by the `multi-agent-collab` framework on 2026-04-24. Per-agent work logs now live at `docs/agents/claude.md` and `docs/agents/codex.md`; project-wide phase state lives in `docs/STATUS.md`. No `.progress-log.md` is created.

### 3.3 Parallelization

- Tasks 2.1-2.11 are parallelizable within Claude Code (all are repo file creation)
- Task 2.12 (Will starts n8n) can begin as soon as 2.4-2.5 are done
- Task 2.13 (Will applies Supabase schema) can begin as soon as 2.9 is done

### 3.4 Known Risks

- Community node installation via Docker env vars may fail silently; verify in n8n UI after startup
- `docker-compose.yml` syntax errors are common; validate with `docker-compose config` before `up`

---

## 4. Phase 3 — Core Build

**Goal:** The full workflow is implemented end-to-end. A run on a CoreWeave document completes, producing a memo in Supabase.

This phase has two tracks running roughly in parallel: the workflow track (Claude Code building the n8n workflow) and the code/prompt track (Claude Code writing the deterministic code and specialist prompts). Both tracks merge into a testable system at the end of the phase.

### 4.1 Workflow Track Tasks

| # | Task | Owner | Estimate | Depends On |
|---|---|---|---|---|
| 3.1 | Implement Form Trigger node (company name + document uploads) | Claude Code | 15 min | Phase 2 |
| 3.2 | Implement Coordinator (Set node for run_id, deal_id, timestamp) | Claude Code | 10 min | 3.1 |
| 3.3 | Implement Document Ingestion pipeline (Extract from File → Text Splitter → Embeddings → Simple Vector Store) | Claude Code | 45 min | 3.2 |
| 3.4 | Configure HTTP Request node for Alicloud Qwen3.5-Plus calls (parameterized model, base URL from env) | Claude Code | 30 min | 3.2 |
| 3.5 | Wire Extraction Agent node (AI Agent with HTTP Request chat model, Vector Store tool, Extraction system prompt) | Claude Code | 30 min | 3.4, prompt track |
| 3.6 | Wire Contradiction Agent node | Claude Code | 30 min | 3.5 |
| 3.7 | Wire Gap Analysis Agent node | Claude Code | 30 min | 3.6 |
| 3.8 | Implement Red Flag Detector sub-workflow (Execute Workflow node → JS Code node) | Claude Code | 45 min | 3.7, code track |
| 3.9 | Wire Portfolio Fit Agent node (loads sagard-portfolio.json) | Claude Code | 30 min | 3.8 |
| 3.10 | Wire Memo Generation Agent node | Claude Code | 45 min | 3.9 |
| 3.11 | Wire Evaluator Agent node | Claude Code | 30 min | 3.10 |
| 3.12 | Implement routing IF node (score < 35 → flagged; else → complete) | Claude Code | 15 min | 3.11 |
| 3.13 | Implement Supabase write node (insert into `deal_memos`) | Claude Code | 20 min | 3.12 |
| 3.14 | Implement Slack notification node (webhook POST) | Claude Code | 20 min | 3.13 |
| 3.15 | Implement error handling branch (catches unhandled exceptions) | Claude Code | 20 min | 3.13 |

### 4.2 Code/Prompt Track Tasks

| # | Task | Owner | Estimate | Depends On |
|---|---|---|---|---|
| 3.16 | Write Extraction Agent system prompt (IC Memo Taxonomy framework) | Claude Code (draft) → Claude Chat (refine) | 45 min | Phase 2 |
| 3.17 | Write Contradiction Agent system prompt (Triangulation framework) | Claude Code (draft) → Claude Chat (refine) | 45 min | Phase 2 |
| 3.18 | Write Gap Analysis Agent system prompt (LP Diligence Checklist) | Claude Code | 45 min | Phase 2 |
| 3.19 | Write Portfolio Fit Agent system prompt (Sagard Thesis) | Claude Code | 30 min | Phase 2 |
| 3.20 | Write Memo Generation Agent system prompt (IC Memo Structure + Citation Enforcement) | Claude Code (draft) → Claude Chat (refine) | 60 min | Phase 2 |
| 3.21 | Write Evaluator Agent system prompt (Six-Criteria Quality Check) | Claude Code | 45 min | Phase 2 |
| 3.22 | Write `code/red-flag-detector.js` with all rules from DESIGN.md Section 3.7 | Claude Code | 60 min | Phase 2 |
| 3.23 | Populate Langfuse Prompt Management with all 6 prompts (versioned, tagged `production`, `v1`) | Will | 30 min | 3.16-3.21 refined |

### 4.3 Langfuse Integration Tasks

| # | Task | Owner | Estimate | Depends On |
|---|---|---|---|---|
| 3.24 | Configure community node credentials in n8n (Langfuse public key, secret key, base URL) | Will | 10 min | Phase 2 |
| 3.25 | Replace Qwen HTTP Request nodes with Langfuse-wrapped variants for every agent | Claude Code | 30 min | 3.24, 3.11 |
| 3.26 | Configure Langfuse Prompt Management node to fetch prompts at runtime | Claude Code | 30 min | 3.23 |
| 3.27 | Verify first traces appear in Langfuse dashboard | Will | 10 min | 3.25 |

### 4.4 Acceptance Criteria

- [ ] Workflow can be triggered via Form Trigger
- [ ] Document ingestion produces non-empty Simple Vector Store
- [ ] All 6 specialist agents execute without error on a CoreWeave test run
- [ ] Red Flag Detector returns a non-empty `red_flags` array for CoreWeave (should find customer concentration)
- [ ] Memo is written to Supabase with all fields populated (including citations)
- [ ] Slack message is received in `#investment-team`
- [ ] All LLM calls appear as traces in Langfuse with correct metadata

### 4.5 Parallelization

- Prompt track (3.16-3.22) is fully parallelizable with workflow track (3.1-3.15) until 3.5 needs the Extraction prompt
- Within prompt track, all 6 prompts can be drafted in parallel
- Claude Chat refinement of high-stakes prompts (3.16, 3.17, 3.20) happens *after* Claude Code drafts

### 4.6 Known Risks

- Community Langfuse node may fail silently — have fallback of manual HTTP logging ready
- Structured output schema compliance is the #1 failure mode; expect iteration
- Vector Store retrieval may return too many or too few chunks; tune chunk size and k
- Qwen3.5-Plus may produce inconsistent JSON formatting; prompts must be explicit about schema

---

## 5. Phase 4 — Iteration on Dev Case (CoreWeave)

**Goal:** Prompt quality is refined until the system produces a high-quality memo on CoreWeave with evaluator score ≥ 40.

### 5.1 Tasks

| # | Task | Owner | Estimate | Depends On |
|---|---|---|---|---|
| 4.1 | First full end-to-end run on CoreWeave documents | Will | 15 min | Phase 3 |
| 4.2 | Review Extraction output — is every major fact captured with citations? | Will | 20 min | 4.1 |
| 4.3 | Iterate Extraction prompt if needed | Claude Code → Claude Chat | 30 min | 4.2 |
| 4.4 | Review Contradiction output — are known CoreWeave contradictions found? | Will | 20 min | 4.1 |
| 4.5 | Iterate Contradiction prompt if needed | Claude Code → Claude Chat | 30 min | 4.4 |
| 4.6 | Review Gap Analysis output — are important LP-diligence items flagged? | Will | 15 min | 4.1 |
| 4.7 | Iterate Gap Analysis prompt if needed | Claude Code | 20 min | 4.6 |
| 4.8 | Review Red Flag output — customer concentration, material weakness, debt structure flagged? | Will | 15 min | 4.1 |
| 4.9 | Iterate Red Flag Detector JS if needed | Claude Code → Codex review | 30 min | 4.8 |
| 4.10 | Review Portfolio Fit output — is the thesis alignment reasonable? | Will | 10 min | 4.1 |
| 4.11 | Iterate Portfolio Fit prompt or `sagard-portfolio.json` if needed | Claude Code | 30 min | 4.10 |
| 4.12 | Review Memo Generation output — is it IC-grade? Are citations complete? | Will | 30 min | 4.1 |
| 4.13 | Iterate Memo Generation prompt (this is the highest-stakes iteration) | Claude Code → Claude Chat | 45 min | 4.12 |
| 4.14 | Review Evaluator output — does score reflect actual quality? | Will | 15 min | 4.1 |
| 4.15 | Iterate Evaluator prompt if needed | Claude Code | 20 min | 4.14 |
| 4.16 | Second full end-to-end run on CoreWeave | Will | 15 min | 4.3-4.15 |
| 4.17 | Confirm evaluator score ≥ 40 and no critical issues | Will | 10 min | 4.16 |

### 5.2 Acceptance Criteria

- [ ] Evaluator score on CoreWeave ≥ 40
- [ ] Memo correctly identifies CoreWeave's customer concentration (77%)
- [ ] Memo correctly identifies material weakness disclosure
- [ ] Memo correctly identifies debt-heavy capital structure
- [ ] Every claim in the memo has a source citation
- [ ] Portfolio fit output correctly notes AI infrastructure is outside Sagard's typical scope
- [ ] No hallucinations flagged by evaluator

### 5.3 Parallelization

Iterations on different agents can proceed in parallel. Memo Generation iteration usually waits until upstream agents are stable.

### 5.4 Known Risks

- This phase is where most real work happens; do not underestimate
- Quality bar is subjective; use the evaluator score plus manual review
- If evaluator is too lenient, fix evaluator first before trusting scores

---

## 6. Phase 5 — Generalization Test (Cerebras)

**Goal:** The same workflow, with no code changes, produces a quality memo on Cerebras documents.

### 6.1 Tasks

| # | Task | Owner | Estimate | Depends On |
|---|---|---|---|---|
| 5.1 | Full end-to-end run on Cerebras documents | Will | 15 min | Phase 4 |
| 5.2 | Verify evaluator score ≥ 35 (slightly lower bar for first-time case) | Will | 10 min | 5.1 |
| 5.3 | Review memo for known Cerebras findings (86% concentration, material weakness, OpenAI backlog) | Will | 20 min | 5.1 |
| 5.4 | If quality is materially lower than CoreWeave, diagnose cause | Will | 30 min | 5.3 |
| 5.5 | Make minimal prompt adjustments if needed (prefer not to touch prompts — system should generalize) | Claude Code | 30 min | 5.4 |
| 5.6 | Second run on Cerebras after any adjustments | Will | 15 min | 5.5 |
| 5.7 | Lock final Cerebras output for demo | Will | 10 min | 5.6 |

### 6.2 Acceptance Criteria

- [ ] Cerebras memo evaluator score ≥ 35
- [ ] Memo identifies customer concentration risk
- [ ] Memo identifies material weaknesses
- [ ] Memo correctly characterizes the OpenAI deal as backlog vs. recognized revenue
- [ ] No prompt changes were needed (or changes were minimal and justifiable)

### 6.3 Known Risks

- If prompts were overfit to CoreWeave during Phase 4, Cerebras may score significantly lower
- Cerebras S-1 is larger (300+ pages) — chunking strategy may need adjustment
- Cerebras is more complex (withdrawn prior filing, complex capital structure) — some facts may be missed

---

## 7. Phase 6 — Demo & Documentation

**Goal:** Demo video recorded, written explanation finalized, repository polished for submission.

### 7.1 Tasks

| # | Task | Owner | Estimate | Depends On |
|---|---|---|---|---|
| 6.1 | Write demo script with precise timing (2-3 minutes) | Claude Code (draft) → Claude Chat (refine) | 45 min | Phase 5 |
| 6.2 | Rehearse demo (at least one dry run) | Will | 30 min | 6.1 |
| 6.3 | Record demo (expect 2-5 takes) | Will | 90 min | 6.2 |
| 6.4 | Edit demo video (light editing only; trim start/end, no fancy cuts) | Will | 30 min | 6.3 |
| 6.5 | Upload demo to YouTube (unlisted) or Google Drive | Will | 15 min | 6.4 |
| 6.6 | Draft 250-word written explanation | Claude Chat | 30 min | Phase 5 |
| 6.7 | Will review and edit written explanation | Will | 15 min | 6.6 |
| 6.8 | Update README.md to be polished for external viewing | Claude Code → Claude Chat | 30 min | Phase 5 |
| 6.9 | Clean up repo (remove test artifacts, verify .env not committed, check .gitignore) | Claude Code → Codex review | 20 min | 6.8 |
| 6.10 | Final commit and push | Will | 10 min | 6.9 |

### 7.2 Acceptance Criteria

- [ ] Demo video is 2-3 minutes (not shorter, not longer)
- [ ] Demo shows `docker-compose up`, n8n UI, form submission, workflow execution, Supabase output, Langfuse traces
- [ ] Written explanation is ≤ 250 words and addresses all four required questions
- [ ] README.md is presentable to a hiring manager
- [ ] Repo has no committed secrets
- [ ] All critical files (workflow.json, prompts, code, schemas) are in the repo

### 7.3 Parallelization

- Demo script (6.1) and written explanation (6.6) can be drafted in parallel
- README polish (6.8) can be done while demo is being recorded

### 7.4 Known Risks

- Demo recording often takes 3-5 takes; budget accordingly
- Live demo will break in unexpected ways; have a cached "good run" ready to show if live fails
- YouTube upload processing can take 10-30 minutes; factor into timeline

---

## 8. Phase 7 — Submission

**Goal:** Deliverables reach Pari before the April 24 deadline.

### 8.1 Tasks

| # | Task | Owner | Estimate | Depends On |
|---|---|---|---|---|
| 7.1 | Draft submission email to Pari (brief, mentions local-first, Claude Code/Codex/Claude Chat usage, observability) | Claude Chat | 15 min | Phase 6 |
| 7.2 | Will review and personalize email | Will | 10 min | 7.1 |
| 7.3 | Send email with video link, written explanation, repo link | Will | 5 min | 7.2 |

### 8.2 Acceptance Criteria

- [ ] Email sent before end of April 24
- [ ] Email includes: video link (or file), written explanation (inline), repo link
- [ ] Email is concise and professional

---

## 9. Dependency Graph Summary

```
Phase 0 (Planning) ─────────────────────────────────────┐
                                                         │
Phase 1 (Environment Setup) ─────────────────────────────┼──▶ Phase 2 (Scaffolding)
                                                         │
                                                         ▼
                                              Phase 3 (Core Build)
                                                         │
                                                         ▼
                                              Phase 4 (Dev Iteration)
                                                         │
                                                         ▼
                                              Phase 5 (Generalization)
                                                         │
                                                         ▼
                                              Phase 6 (Demo & Docs)
                                                         │
                                                         ▼
                                              Phase 7 (Submission)
```

Phases must be sequential. Tasks within a phase are often parallelizable (see each phase's Parallelization subsection).

---

## 10. Ownership Summary

**Will owns:**
- All external account creation (Phase 1)
- Credentials and `.env` file
- Manual testing and quality review (Phase 4, 5)
- Demo recording (Phase 6)
- Final email (Phase 7)

**Claude Code owns:**
- All repo file creation and code (Phases 2, 3)
- First drafts of all prompts (Phase 3)
- Prompt iteration (Phase 4)
- Documentation drafts (Phase 6)
- Repository cleanup (Phase 6)

**Codex owns:**
- Review of Claude Code's workflow JSON for correctness
- Review of Red Flag Detector JavaScript for correctness
- Alternative implementations when Will asks for second opinion
- Repository cleanup review

**Claude Chat owns:**
- CONTEXT.md, DESIGN.md, IMPLEMENTATION.md, CLAUDE.md maintenance
- Refinement of high-stakes prompts (Extraction, Contradiction, Memo Generation)
- 250-word written explanation
- Demo script refinement
- Submission email draft
- Arbitration when Claude Code and Codex disagree

---

## 11. Rollback Plan

If something catastrophic happens mid-build, here are the fallback paths:

**If Langfuse community node fails:**
- Fall back to manual HTTP logging to Langfuse via HTTP Request nodes
- Cost: 30 min of rework
- Impact: tracing quality slightly worse but still functional

**If Supabase fails or is rate-limited:**
- Fall back to Google Sheets node (simpler, lower quality signal)
- Cost: 45 min of rework
- Impact: demo looks less production-ready

**If local n8n has Docker issues that can't be resolved:**
- Fall back to n8n Cloud (despite the positioning cost)
- Cost: 1-2 hours of rework
- Impact: weaker narrative; accept it

**If a specialist agent consistently produces bad output:**
- Reduce scope — drop Portfolio Fit agent entirely (least-critical specialist)
- Cost: 30 min of rework
- Impact: system still works, minus one specialist

**If Cerebras generalization fails badly:**
- Switch demo case to CoreWeave (the dev case) and explain the choice honestly
- Cost: 15 min of rework
- Impact: less topical but still strong

**If total timeline slips and submission is at risk:**
- Cut Evaluator agent (adds complexity, demo still works without it)
- Submit minimum viable version rather than polished version
- Better to ship imperfect than miss deadline

---

## 12. Current Status

**Phase 0:** Complete — CONTEXT.md v2, DESIGN.md, IMPLEMENTATION.md, CLAUDE.md produced

**Phase 1:** Not started

**Phase 2:** Not started

**Phase 3:** Not started

**Phase 4:** Not started

**Phase 5:** Not started

**Phase 6:** Not started

**Phase 7:** Not started

**Current blockers:** None.

**Current focus:** Will to complete Phase 1 tasks while Claude Code awaits instruction to begin Phase 2.

---

**End of IMPLEMENTATION.md**

*Update this document as work progresses. Check off acceptance criteria as they are met. Log blockers immediately. Adjust estimates when reality diverges.*
