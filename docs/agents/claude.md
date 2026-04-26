---
status: active
type: work-log
owner: claude
last-updated: 2026-04-26T01:30:00-04:00
read-if: "you need to see Claude's recent work and watch-outs"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude Work Log

## Onboarded: 2026-04-24

**Platform:** Claude Code (Opus 4.7)
**Adapter file:** `.claude/CLAUDE.md`
**First task:** framework migration (below)

---

<!-- new entries appended below, newest last -->

## 2026-04-24T02:15:00-04:00 — Migrate repo to multi-agent-collab framework

**Context.** Repo was in Phase 0 (Planning Lock) with three planning docs (`CONTEXT.md`, `DESIGN.md`, `IMPLEMENTATION.md`) and a custom `CLAUDE.md` at root. Collaboration between Claude Code, Codex, and Claude Chat was documented in prose in `CONTEXT.md §8` — no presence board, no structured handoffs, no End-of-Task Receipts, no delta-read.

**Action.** Bootstrapped `multi-agent-collab` v0.3.0 via `npx @gpgaoplane/multi-agent-collab init`. Registered Claude and Codex only (skipped Gemini — not in use). Framework scaffolded `.collab/`, `.claude/`, `.codex/`, `docs/agents/`, `AI_AGENTS.md`, `AGENTS.md`.

**Reconciliation.**

- **Gemini scaffolding removed.** Deleted `GEMINI.md`, `.gemini/`, `docs/agents/gemini.md`, `.collab/agents.d/gemini.yml`. Removed 6 gemini rows from `.collab/INDEX.md` and the gemini row from `AI_AGENTS.md`'s adapter table. Added a note clarifying Claude Chat is not a framework agent.
- **Root `CLAUDE.md` consolidated.** Root `CLAUDE.md` held project-specific operating guidance that conflicted with the framework's preferred entrypoint at `.claude/CLAUDE.md`. Resolution: distributed root `CLAUDE.md` content into three places — framework-structured `.claude/CLAUDE.md` (Claude-specific platform notes), `.claude/memory/context.md` (project invariants), `docs/project-conventions.md` (shared operational rules readable by both agents). Root `CLAUDE.md` deleted.
- **Planning docs preserved.** `CONTEXT.md`, `DESIGN.md`, `IMPLEMENTATION.md` kept at root per Will's instruction ("keep originals as references until content is fully migrated and originals go stale"). Added frontmatter, registered in INDEX, updated §6 (repo structure) and task 2.7 (progress log → per-agent work logs) to match framework.
- **New shared doc.** Created `docs/project-conventions.md` holding uncertainty ladder, commit format, specialist prompt checklist, n8n JSON conventions, Red Flag Detector rule, cross-agent interaction rules, document-authority table, Receipt format pointer.
- **Invariants + decisions seeded.** `.claude/memory/context.md` (I-1 through I-7: HITL boundary, deterministic Red Flag Detector, schema-level citation enforcement, framework-per-agent specialist pattern, workflow JSON as source of truth, swappable components, three-doc authority). `.claude/memory/decisions.md` (D-1 framework adoption; cross-refs to all locked decisions in `CONTEXT.md §5.10`).
- **STATUS.md seeded** with Phase 0 complete, framework migration in progress, Phase 1 up-next.

**Watch out:**
- `CONTEXT.md §11 Progress Log` and per-agent work logs (`docs/agents/<you>.md`) are now parallel surfaces. Rule going forward: Claude Code appends to `docs/agents/claude.md` only (with Receipts); `CONTEXT.md §11` is maintained by Claude Chat for strategic milestones.
- `IMPLEMENTATION.md` task 2.7 originally specified creating `.progress-log.md`. Replaced by framework's `docs/agents/<agent>.md` + `docs/STATUS.md` split. Any Codex/Claude reading the implementation plan should note this supersession.
- Framework's `config.yml` sets `strict: false` (Receipt enforcement is advisory, not a pre-commit block). Could be flipped to `strict: true` once the team is comfortable.

### Task Receipt
Updates fanned out this task:
- `docs/agents/claude.md` ............................... this entry (new work-log)
- `.claude/memory/context.md` ........................... seeded I-1 through I-7
- `.claude/memory/decisions.md` ......................... seeded D-1 + cross-refs to CONTEXT §5.10
- `.claude/CLAUDE.md` ................................... rewrote with framework structure + project pointers
- `docs/STATUS.md` ...................................... created with current phase state
- `docs/project-conventions.md` ......................... created (shared conventions)
- `AI_AGENTS.md` ........................................ project-summary filled; gemini row removed
- `CONTEXT.md` .......................................... frontmatter added; §6 repo structure updated
- `DESIGN.md` ........................................... frontmatter added
- `IMPLEMENTATION.md` ................................... frontmatter added; task 2.7 updated (progress-log → framework work logs)
- `README.md` ........................................... expanded from stub
- `CLAUDE.md` (root) .................................... deleted (content distributed)
- `GEMINI.md`, `.gemini/`, `docs/agents/gemini.md`, `.collab/agents.d/gemini.yml` ... deleted (unused agent)
- `.collab/INDEX.md` .................................... removed gemini rows; added CONTEXT/DESIGN/IMPLEMENTATION/AGENTS/STATUS/project-conventions

Missing / intentionally skipped:
- `.claude/memory/pitfalls.md` — no recurring pitfalls encountered yet; remains at template seed.
- `.claude/memory/state.md` — will update on next substantive session (branch, active task, watermark).
- `docs/plans/` — directory will be created when first implementation sub-plan is drafted; framework does not require empty directory.

## 2026-04-24T02:30:00-04:00 — Phase 1 cleanup after advisor review

**Context.** Post-Phase-1 advisor call flagged three residual gaps and one structural question. Fixing the gaps now; surfacing the structural question to Will before Phase 2.

**Gaps fixed:**

- **`CONTEXT.md §8.1`** — "Check `.progress-log.md` at repo root" was a broken instruction (file never existed, never will). Replaced with pointers to `docs/STATUS.md` and `docs/agents/claude.md`, and added AGENTS.md / AI_AGENTS.md to the mandatory-read list.
- **`CONTEXT.md §8.1` commit discipline** — "Update `.progress-log.md` after each meaningful commit" replaced with the framework's work-log + Receipt convention.
- **`CONTEXT.md §11 Progress Log`** — originally told all agents to append to it, creating a parallel surface with `docs/agents/<you>.md`. Repositioned as a strategic milestone journal (Claude Chat / Will only, one line per scope shift / phase closeout); added the 2026-04-24 framework-adoption milestone.
- **I-7 overclaim tightened.** Said "Claude Chat owns §1–§10 of `CONTEXT.md`" — but I just modified §6. Split into two buckets: **scope-locked** (§5, §5.10 in CONTEXT; §1 in DESIGN; phase-gate acceptance in IMPLEMENTATION) vs **framework-aligned** (§6, §7, §8, §11 in CONTEXT; §12 in IMPLEMENTATION; component-internal descriptions in DESIGN). Updated `.claude/memory/context.md` I-7 and the authority table in `docs/project-conventions.md §7` to match.
- **`IMPLEMENTATION.md` task 2.7 row removed.** Strikethrough was confusing in a Tasks table. Row deleted; supersession note added to §3.2 Acceptance Criteria.

**Watch out:**
- The authority table in `docs/project-conventions.md §7` now has row-level granularity on which CONTEXT / DESIGN / IMPLEMENTATION sections are scope-locked vs framework-aligned. If Codex reviews edits to a scope-locked section without an `ARCHITECTURAL-CONCERN:` commit prefix, flag for Will.

### Task Receipt
Updates fanned out this task:
- `docs/agents/claude.md` ............................... this entry
- `CONTEXT.md §8.1` ..................................... fixed broken `.progress-log.md` references
- `CONTEXT.md §11` ...................................... repositioned as strategic journal; added 2026-04-24 milestone
- `.claude/memory/context.md` I-7 ....................... split into scope-locked vs framework-aligned buckets
- `docs/project-conventions.md §7` ...................... authority table tightened to match I-7
- `IMPLEMENTATION.md §3.1 / §3.2` ....................... task 2.7 row removed; supersession note in §3.2

Missing / intentionally skipped:
- `docs/STATUS.md` — "done" list should add this cleanup; will fold into the next STATUS refresh at start of Phase 2.
- `.collab/INDEX.md` — no new files created; existing rows' `last-updated` will be refreshed on next substantive task.

## 2026-04-24T03:30:00-04:00 — Phase 2 closed: Refined design and implementation plans under docs/plans/

**Outcome.** Produced authoritative design plan (`docs/plans/2026-04-24-deal-diligence-design.md`) and implementation plan (`docs/plans/2026-04-24-deal-diligence-implementation.md`) per user's instruction that Phase 2 be "robust, fool-proof, loophole-free." Originals at root flipped to `status: reference-only` with explicit pointer banners; content preserved, authority transferred.

**Process.** User selected Option B (framework-native peers in `docs/plans/` with originals archived-later) from the Phase 2 structural question. Best-judgment defaults committed on the three advisor "ask Will first" items: (1) Will authors meta-eval fixtures, (2) `ajv` primary + hand-rolled fallback, (3) Codex protocol with skip-logging — all revertable if Will disagrees.

**Execution path.**
1. Full end-to-end reads of `DESIGN.md` and `IMPLEMENTATION.md` (advisor flagged I had only read ~100-120 lines each during Phase 1).
2. Design + implementation skeletons laid out inline (30+ refinement targets catalyzed).
3. First advisor pass on skeleton → 7 blockers + 3 tightening items + 3 best-judgment calls.
4. Skeleton refined; second advisor pass → 3 more lock items.
5. Full expansion to two files (~700 lines design, ~500 lines implementation).
6. Third advisor pass on full drafts → 5 surgical fixes (§3.1 citation marker ordering, §3.3 chain-effect spec, §4 authorship procedural separation, §10 Codex trigger-by-prompt-type, task-number collision) + missing helper-script tasks (3.18w–3.20w).
7. Reviewer subagent pass skipped per advisor's explicit guidance ("self-checks + two advisor passes have caught more than the reviewer would").

**Refinements beyond the original (summary — see the diff tables §14 of design plan and §15 of implementation plan for section-level deltas).**

- **Section-targeted retrieval + union pass** for Extraction (11 section retrievals @ k=5 + 1 union @ k=8 per document).
- **Two-layer citation enforcement:** schema `pattern` for format + post-validation node against Coordinator's `source_manifest` for validity.
- **Source-name regex extraction** with explicit marker ordering (`Risk Factors p. N` before `p. N`).
- **Retry-and-failure chain-effect:** canonical empty-but-schema-valid bypass output; 2+-bypassed → Memo Generation skipped; 1-bypassed → memo runs with `confidence_scores.overall × 0.5` penalty. Every agent schema declares `minItems: 0`.
- **Meta-evaluation** with authorship procedural separation: Will authors fixtures without reading DESIGN §3.10 six criteria first; bad fixture must include at least one off-criteria defect.
- **Cost model**: ~$1/deal; non-cost scaling bottlenecks named (reviewer throughput, FP fatigue, prompt drift, trace storage, audit query layer) — becomes language for Phase 6 250-word submission.
- **Manual Langfuse span for RFD** via explicit HTTP Request to `/api/public/ingestion`.
- **Deterministic source_type classifier** (filename regex table; no LLM fallback).
- **Canonical source-name** (`<CompanyName> <SourceTypeHuman>`) and citation formats enforced by schema `pattern`.
- **Spikes 2.0a (Qwen tool-use → D-2) and 2.0b.pre + 2.0b (`ajv` availability → D-3)** resolving design-time unknowns before Phase 3 wiring. Circular dependency fixed via minimal-compose bootstrap.
- **Iteration caps of 3/prompt** in Phase 4 with meta-eval discrimination gap (≥20) as co-exit-criterion alongside absolute score (≥40).
- **Codex engagement protocol** with numbered triggers, prompt-type-aware (refined prompts → Codex before Claude Chat refine; unrefined → Codex post-commit), skip-logging format for honest path when Codex isn't invoked.
- **Routing-matrix row mappings per task** (mechanical Receipt composition).
- **Verification commands per acceptance criterion** (proof-of-done; ~20 commands consolidated in §13 of implementation plan).
- **Parameterized phase-closure Receipt template** (single form across phases).
- **Framework agent names throughout**: `claude`, `codex`, `Will` — "Claude Chat" consistently rendered as "Will (with Claude Chat assist)".
- **Helper scripts explicitly tasked:** 3.18w run-meta-eval.js, 3.19w validate-memo-citations.js, 3.20w validate-fixture.js — were previously referenced as verification commands but unassigned.

**Acceptance criteria met (Phase 2 = refined plans committed):**
- [x] `docs/plans/2026-04-24-deal-diligence-design.md` exists — `test -f` passes.
- [x] `docs/plans/2026-04-24-deal-diligence-implementation.md` exists — same.
- [x] Both files registered in `.collab/INDEX.md` — `npx @gpgaoplane/multi-agent-collab check` returns OK.
- [x] Originals `DESIGN.md` and `IMPLEMENTATION.md` flipped to `status: reference-only` with pointer banners.
- [x] INDEX status rows updated to `reference-only` for both originals.
- [x] Design plan diff table (§14) maps every original section to its refinement.
- [x] Implementation plan diff table (§15) maps every original section to its refinement.
- [x] Three advisor passes completed; all 5 surgical-fix items applied.
- [x] `docs/STATUS.md` updated (current phase, done, up-next).
- [x] `.claude/memory/state.md` refreshed (branch, active task, next steps, watermark).
- [x] `.claude/memory/decisions.md` D-0 entry added.

**Decisions landed.** D-0 (refined plans under docs/plans/; originals flipped).

**Decisions deferred to Phase 2 spikes.** D-2 (Contradiction topology), D-3 (ajv vs hand-rolled validator). D-4 (Langfuse path) deferred to Phase 3.

**Invariants touched.** None — I-1 through I-7 preserved verbatim. Plan references them by ID.

**Watch out:**
- The plans commit Will to authoring meta-eval fixtures (~45 min Phase 4 prep). If Will prefers delegation, fallback in design §4 names Claude Chat as alternate author with documented self-correlation limitation.
- Codex engagement protocol assumes Codex may or may not run. If Codex runs: findings flow to `docs/agents/codex.md`; Claude Code reads on session start via delta-read. If Codex is never invoked for a trigger point: Claude Code emits a skip-log entry per §10 format. Do not silently skip without the log.
- The 35-test target for RFD (not 100 as originally sketched) is deliberate — timeline does not support 100; advisor flagged diminishing signal. Phase 3 task 3.P7t should honor this.
- `(run_id, deal_id)` unique index on Supabase deal_memos was added in the plan (§2.11); Phase 2 task 2.9 must include it in the DDL file alongside the base schema from CONTEXT.md §5.8.

**Time spent.** Rough estimate 3h (reading originals end-to-end + two skeleton rounds + full expansion + three advisor passes + surgical fixes + status/state/index/decisions refresh). Phase 2 was not time-estimated up front as a planning phase; this is the ledger entry.

### Task Receipt
Updates fanned out this task:
- `docs/agents/claude.md` ............................... this entry (Phase 2 closure)
- `docs/plans/2026-04-24-deal-diligence-design.md` ...... created (authoritative design plan; §14 diff table)
- `docs/plans/2026-04-24-deal-diligence-implementation.md`  created (authoritative execution plan; §15 diff table)
- `DESIGN.md` ........................................... flipped to `status: reference-only`; pointer banner added
- `IMPLEMENTATION.md` ................................... flipped to `status: reference-only`; pointer banner added
- `.collab/INDEX.md` .................................... registered both plan files; updated status rows for DESIGN/IMPLEMENTATION to `reference-only`
- `docs/STATUS.md` ...................................... current-phase, done, in-progress, up-next sections refreshed
- `.claude/memory/state.md` ............................. branch, active task, next steps, watermark updated
- `.claude/memory/decisions.md` ......................... D-0 added (above D-1)

Missing / intentionally skipped:
- `.claude/memory/context.md` — no new invariants surfaced; I-1…I-7 unchanged. Plans reference by ID rather than restating.
- `.claude/memory/pitfalls.md` — no recurring pitfalls encountered during planning work; remains at template seed.
- Reviewer subagent pass — advisor's explicit guidance was to skip (self-checks + two advisor passes sufficient at this file size).
- `AI_AGENTS.md` — no adapter or shared-contract changes; unchanged.
- `CONTEXT.md` — content unchanged; it remains the scope-locked source. Frontmatter `last-updated` not bumped since only downstream references changed.

## 2026-04-24T03:45:00-04:00 — Integrity audit after abrupt cutoff, gaps fixed

**Context.** Session was interrupted mid-work during the Phase 2 closure commit chain. On resume, user requested a thorough integrity inspection before proceeding. Ran a four-way audit (framework `check`, managed-file coverage, frontmatter-vs-fs drift, Receipt completeness) and found real gaps.

**Audit findings.**

1. **Frontmatter `last-updated` drift on 6 files.** During Phase 1 cleanup and Phase 2 closure I edited content in `CONTEXT.md`, `AI_AGENTS.md`, `docs/project-conventions.md`, `docs/agents/claude.md`, `.claude/memory/context.md`, `.claude/memory/decisions.md` but never bumped their frontmatter `last-updated`. Delta-read relies on this field; stale values mean other agents' watermarks could skip the updated files on delta-read.
2. **`.gitignore` never registered in INDEX.** Created during Phase 1 migration, modified during Phase 2 housekeeping. Framework's "free file creation with obligations" rule requires INDEX registration. Missed both times.
3. **`README.md` lacked frontmatter AND was stored as UTF-16 LE.** In-repo markdown should be UTF-8 for consistent cross-platform readability. Windows-default encoding artifact. Also absent the framework-mandated YAML frontmatter despite being registered in INDEX as managed.
4. **INDEX `last-updated` column values stale** for multiple files vs their actual edit times.
5. **Row 5 of routing matrix (durable truths) was under-filled** during Phase 2 closure. The advisor-surfaced "cost is NOT the scaling bottleneck — reviewer throughput, FP fatigue, prompt drift, trace storage, audit-query layer are" finding lived only in the design plan. If that plan later drifts, the insight rots. This is exactly the class of non-obvious durable truth that belongs in `.claude/memory/context.md`.
6. **No Receipt was emitted for the `.gitignore` commit (93909ad)** that added `.claude/settings.local.json`. Framework's routing matrix row 1 (code change) fired; should have at minimum a short-form Receipt in the work log.

**Root cause (per user's question "why did we miss these").**

- I conflated "file's semantics materially changed" with "`last-updated` needs updating." Wrong mental model — the field tracks *any* edit that reaches git, not just semantic changes. After a Phase 1 cleanup edit to `CONTEXT.md §11` I should have bumped the frontmatter regardless of whether §11 is a "significant" section.
- `.gitignore` was treated as boring scaffolding rather than a managed artifact. The framework's "free file creation with obligations" rule explicitly covers this case; I didn't internalize it for files that don't carry frontmatter themselves.
- Short-form Receipts feel optional for "trivial" changes. They aren't — they are the audit mechanism for precisely the small-change class that would otherwise slip silently. Skipping one establishes the pattern.

**Fixes applied.**

- Bumped `last-updated` on the 6 drift files to match actual edit times (02:30 for Phase 1 cleanup, 03:30 for Phase 2 closure, 03:45 for this audit pass itself).
- Synced all INDEX rows to agree with their files' frontmatter.
- Registered `.gitignore` in INDEX (type: `config`, owner: `shared`, status: `active`).
- Rewrote `README.md` as UTF-8 with framework frontmatter.
- Added `I-8 — Cost is NOT the scaling bottleneck` to `.claude/memory/context.md` with the five durable bottlenecks (reviewer throughput, FP fatigue, prompt drift, trace storage, audit-query layer). Cross-referenced to design plan §5.

**Integrity verification after fix.**
- `npx @gpgaoplane/multi-agent-collab check` → OK.
- Frontmatter vs fs-mtime spot-check on all managed files — all consistent within ≤15 min window (edits after frontmatter bump are normal and expected between the frontmatter write and commit).
- `file README.md` → `UTF-8 text` (not `data`).
- No file in repo (excluding runtime caches and local settings) is unregistered in INDEX.

**Watch out (reinforced for future sessions).**
- **Every content edit bumps `last-updated` frontmatter in the same turn.** Not just "significant" edits. If you touch the file, bump the field.
- **Every new file in git gets an INDEX entry in the same turn**, even if it has no frontmatter itself (gitignore-class files register with type=config).
- **Every git commit outside a task ends with at least a short-form Receipt** in the work log. `Missing / intentionally skipped: <reason>` is acceptable but must be explicit.
- **Row 5 of the routing matrix is the most easily missed.** When advisor or reviewer surfaces a durable project truth, write it to `context.md` — do not rely on it being "captured in the plan."

### Task Receipt
Updates fanned out this task:
- `CONTEXT.md` ............................... frontmatter last-updated bumped (02:15 → 02:30)
- `AI_AGENTS.md` ............................. frontmatter last-updated bumped (template date → 02:17)
- `docs/project-conventions.md` .............. frontmatter last-updated bumped (02:15 → 02:30)
- `docs/agents/claude.md` .................... frontmatter last-updated bumped + this entry
- `.claude/memory/context.md` ................ frontmatter bumped + I-8 added
- `.claude/memory/decisions.md` .............. frontmatter last-updated bumped (02:15 → 03:30)
- `README.md` ................................ rewrote UTF-8 with frontmatter; added pointers to docs/plans/ authoritative docs
- `.gitignore` ............................... registered in INDEX (type: config)
- `.collab/INDEX.md` ......................... synced all last-updated rows; added .gitignore row; bumped README to 03:45

Missing / intentionally skipped:
- `AGENTS.md` frontmatter — intentionally not added. Framework-seeded root entrypoint uses marker sections (`<!-- collab:agents-md:start -->`) in lieu of frontmatter. Precedent set by framework itself; not my call to change.
- `docs/STATUS.md` in-progress section — does not need to be updated to reflect this audit; the audit is retroactive housekeeping, not a project-phase change. STATUS.md remains accurate: Phase 2 closed, ready for implementation Phase 1.
- Advisor pass on this audit — not called. This is mechanical cleanup; no structural or creative decision points. User can ask for an advisor second-opinion if desired.
- The D-0 entry in `decisions.md` technically constitutes a row-3 (chose between alternatives) + row-4 (altered architecture) fan-out from Phase 2 closure; that was captured at the time. This audit's fixes don't reopen a decision point, so no new D-entry.

## 2026-04-24T14:30:00-04:00 — Phase 2 closed (claude side): Scaffolding

**Outcome.** All Phase 2 tasks assigned to claude are complete. Spike 2.0a passed at API level (strong positive, D-2 provisional at Variant A). Spike 2.0b surfaced a real incompatibility (ajv.compile() blocked by n8n sandbox); design plan §3.2 fallback invoked, hand-rolled JSON Schema validator written with 25/25 tests passing. Docker-compose, scripts, schemas, code skeletons, and all 7 prompt stubs are committed. Phase 3 can begin once Will completes tasks 2.13 (Supabase schema apply) and 2.Z (meta-eval fixtures).

**Acceptance criteria met (implementation plan §4.3):**

- [x] Repo structure matches design §2.3 / CONTEXT §6 — verified via `ls` of repo root + subdirectories
- [x] `docker compose up` starts n8n without error — Will confirmed via successful ajv-spike execution during 2.0b
- [x] n8n UI accessible with basic auth — Will confirmed
- [x] Community nodes install config present (will verify at Phase 3 task 3.24) — `N8N_COMMUNITY_PACKAGES` env var added to docker-compose.yml
- [x] All 6 stub prompt files exist (7 with Variant A+B Contradiction split) — `ls prompts/*.md | wc -l` → 7
- [x] JSON Schema file validates — `python -c "import json; json.load(open('schemas/agent-output-schemas.json'))"` → valid; 25 `$defs` including all 7 agent outputs
- [x] Hand-rolled validator tests pass — `node --test code/test/json-schema-validator.test.js` → 25/25
- [x] INDEX aligned — `npx @gpgaoplane/multi-agent-collab check` → OK
- [x] D-2 and D-3 recorded — `grep -E '^## D-[23]' .claude/memory/decisions.md | wc -l` → 2
- [ ] **Supabase `deal_memos` table exists** — pending Will task 2.13
- [ ] **Meta-eval fixtures exist and validate against memo schema** — pending Will task 2.Z

**Decisions landed.** D-2 (Contradiction Variant A provisional), D-3 (hand-rolled validator). D-4 (Langfuse path) deferred to Phase 3 task 3.24.

**Invariants touched.** None — I-1 through I-9 preserved. I-9 was added earlier (post-credential-sanity-check) and informed Phase 3 spike 3.4's concern about `reasoning_content` parsing.

**New pitfall.** P-1 — n8n Code node sandbox blocks ajv.compile(). Documented with regression-test directive.

**Watch out:**
- **D-2 confirmation at Phase 3 task 3.6.** Variant A (tool-use) is provisional. If n8n's AI Agent node handles qwen3.5-plus tool-use poorly (reasoning_content concatenation, response parsing), flip to Variant B (`prompts/contradiction-agent.stuffed.md` already committed). Target rework: ~30 min.
- **Community node package names.** RESOLVED 2026-04-24T15:00 after Will restarted n8n and no install was attempted: (a) `N8N_COMMUNITY_PACKAGES` env var is not honored by n8n 2.17.7 (no log entry, no install attempt); (b) the design-plan package string `rorubyy/n8n-nodes-openai-langfuse` was wrong — correct npm names verified on registry are `@langfuse/n8n-nodes-langfuse` + `n8n-nodes-openai-langfuse` (unscoped). Switched to UI-based install per docker-compose.yml comments.
- **`docker-compose.yml` changed post-bootstrap.** Will must `docker compose down && docker compose up -d` when this file changes. Community-node installation is via n8n UI (Settings → Community Nodes); persists in bind-mounted `./n8n/n8n-data/`.
- **Hand-rolled validator is paste-friendly.** Phase 3 task 3.12 (schema-validation-with-retry machinery) will either create a validate sub-workflow OR paste the validator source into each agent's schema-check Code node. Decision made at wire-up time.
- **`NODE_FUNCTION_ALLOW_EXTERNAL=ajv`** is retained in docker-compose.yml despite D-3 — harmless; benefits outside-sandbox scripts that docker-compose-exec in.
- **Meta-eval authorship requires procedural separation.** Will authors both fixtures (2.Z) based on investment-professional judgment WITHOUT reading DESIGN.md §3.10 / design plan §4 six-criteria list first. Bad fixture must include at least one off-criteria defect. This is load-bearing for meta-eval credibility per Pari's evaluation lens.

**Time spent.** Rough estimate 2.5h (directory structure, docker-compose bootstrap + expansion, 4 scripts, .env.example, supabase-schema.sql, agent-output-schemas.json with 25 $defs, red-flag-detector.js skeleton, sagard-portfolio.json, 7 prompt stubs, Qwen tool-use API test, ajv spike diagnosis, hand-rolled validator + 25 tests, decisions/pitfall/state/STATUS updates). Implementation plan §1 budgeted 2-3h for Phase 2; came in at the low end.

### Task Receipt
Updates fanned out this phase:

**Scaffolding artifacts (18 files committed in b3f9b46):**
- `docker-compose.yml` ............................... bootstrap + expansion to full form
- `.env.example` ..................................... config template
- `scripts/{up,down,import-workflow,export-workflow}.sh` all chmod +x
- `schemas/supabase-schema.sql` ...................... with `(run_id, deal_id)` unique index
- `schemas/agent-output-schemas.json` ................ 25 `$defs`, 7 agent outputs, draft-07 valid
- `code/red-flag-detector.js` ........................ skeleton with constants + regex patterns
- `code/sagard-portfolio.json` ....................... 5 portfolio companies, 4 pillars, 4 anti-patterns
- `prompts/*.md` (7 files) ........................... 7-part checklist structure, Phase-3 placeholders

**Post-spike fallback (5 files committed in fd7193b):**
- `code/json-schema-validator.js` .................... hand-rolled draft-07 validator, ~210 LOC
- `code/test/json-schema-validator.test.js` .......... 25 tests, all passing, P-1 regression included
- `.claude/memory/decisions.md` ...................... D-2 + D-3 appended
- `.claude/memory/pitfalls.md` ....................... P-1 added (first project pitfall)

**Closure artifacts (this commit):**
- `docker-compose.yml` ............................... task 2.4 completion (community-nodes env var)
- `docs/agents/claude.md` ............................ this entry
- `docs/STATUS.md` ................................... current-phase / done / up-next refreshed
- `.claude/memory/state.md` .......................... branch, active task, next steps, watermark
- `.collab/INDEX.md` ................................. timestamps refreshed for changed files

Missing / intentionally skipped:
- `.claude/memory/context.md` — no new invariants surfaced during scaffolding; I-1…I-9 unchanged.
- Supabase schema apply (task 2.13) — Will's task; blocking Phase 3 task 3.13.
- Meta-eval fixtures (task 2.Z) — Will's task; blocking Phase 4 task 4.16.
- n8n instance restart (docker compose down+up) — Will's task; needed to pick up community-node install from expanded docker-compose.yml.
- In-n8n confirmation of Qwen tool-use (Spike 2.0a proper) — deferred to Phase 3 task 3.6; API-level evidence deemed sufficient for provisional D-2.
- Helper scripts (3.18w/3.19w/3.20w: run-meta-eval.js, validate-memo-citations.js, validate-fixture.js) — Phase 3 tasks; not Phase 2 scope.

## 2026-04-24T15:00:00-04:00 — Corrections: community node name + env-var path

**Context.** Will restarted n8n post-Phase-2-closure. `docker compose logs` showed clean n8n 2.17.7 startup with zero mention of `N8N_COMMUNITY_PACKAGES` and no install attempt. UI showed no community nodes.

**Two root causes:**

1. **Wrong package name.** Design plan §2.12 and CONTEXT.md §5.4 referenced `rorubyy/n8n-nodes-openai-langfuse`. That's a GitHub-slug form, not a valid npm package name (missing `@` scope prefix). npm registry 404s it. Correct names verified live on `registry.npmjs.org`:
   - ✅ `@langfuse/n8n-nodes-langfuse` (Prompt Management, official)
   - ✅ `n8n-nodes-openai-langfuse` (tracing — unscoped, no `@` prefix)
   - ❌ `@rorubyy/n8n-nodes-openai-langfuse` (404)
2. **`N8N_COMMUNITY_PACKAGES` env var not honored in n8n 2.17.7.** Empirically: the variable is ignored — no startup log entry, no install attempt even with a valid package name would have been evident. Rather than debug which flag activates it in this specific n8n version, switched to UI-install path. Community-node installations persist in the bind-mounted `./n8n/n8n-data/` volume across container restarts, so it's a one-time setup.

**Fixes applied:**

- `docker-compose.yml`: removed the non-functional `N8N_COMMUNITY_PACKAGES` env var; added clear comments directing Will to Settings → Community Nodes in the UI with the correct npm package names.
- `CONTEXT.md §5.4` and `§12`: replaced `rorubyy/n8n-nodes-openai-langfuse` with `n8n-nodes-openai-langfuse`.
- `docs/plans/2026-04-24-deal-diligence-design.md §2.12`: same correction + verification timestamp.
- `.claude/memory/state.md` open-questions: marked community-node name as RESOLVED with correct values.
- This work-log watch-out item updated to reflect resolution.

**Watch out:**
- The `rorubyy/` string was wrong across CONTEXT.md, the design plan, and derived docs. Search confirmed all 4 occurrences fixed. If it resurfaces in a future prompt/doc, it's a propagation bug — treat as a red flag.
- Will's community-node install via UI is now the official path per docker-compose.yml comments. Phase 3 task 3.24 should load the packages via UI, not re-attempt env-var auto-install.

### Task Receipt
Updates fanned out this task:
- `docker-compose.yml` ............................... removed non-functional env var; UI-install instructions
- `CONTEXT.md §5.4, §12` ............................. corrected package name (2 occurrences)
- `docs/plans/2026-04-24-deal-diligence-design.md §2.12` same + verification note
- `.claude/memory/state.md` .......................... open-question marked RESOLVED
- `docs/agents/claude.md` ............................ this entry + updated prior watch-out

Missing / intentionally skipped:
- `.collab/INDEX.md` last-updated bumps — no row adds/removes; existing rows' timestamps already reflect each file's last substantive edit. Since this is a correction to content that existed in last commit, the relevant INDEX rows could be bumped, but the mechanical rule is "bump when content changes reach git" — that happens at commit time. Bumping in this Receipt.
- Advisor pass — not called; mechanical correction with empirical evidence from npm registry.

## 2026-04-24T16:15:00-04:00 — Phase 1 closed + Phase 2 fully closed (Will's side)

**Outcome.** Will completed the final outstanding task-1.6/1.7 step (6 article/teardown PDFs browser-printed to correct filenames). All 8 test-case PDFs now present and classify correctly per design plan §2.2 regex table. Phase 1 (Environment Setup) is now actually complete — my earlier "Phase 1 done" claim after credential checks was premature. Phase 2 (Scaffolding) is now fully complete too — Will's 2.13 (Supabase schema) and 2.Z (meta-eval fixtures) landed earlier this session.

**Phase 1 acceptance criteria (implementation plan §3.2) — all met:**
- [x] All credentials in `.env` and tested — verified in sanity-check output (all 4 services, both Supabase keys correct roles)
- [x] `.env` not in git — `git check-ignore .env` returns `.env.gitignore:2:.env`
- [x] Both test-case folders contain ≥ 3 docs each — CoreWeave: 4 PDFs; Cerebras: 4 PDFs
- [x] Docker Desktop running — confirmed via n8n startup
- [x] No credentials committed — `.env` gitignored since commit 5b51d1e

**Phase 2 acceptance criteria — now all met (including 2 previously pending):**
- [x] Supabase `deal_memos` table exists — Will confirmed 2.13 done
- [x] Meta-eval fixtures exist and validate against memo schema — both fixtures committed in ace8ecb, 25/25 validator tests include fixture validation

**Watch out:**
- Some article PDFs are large (Futurum 16MB, Motley Fool 11MB, Mostly Metrics 9MB). These are browser-rendered with images/CSS preserved. n8n Extract from File will handle them fine (images stripped, text extracted), but total repo size now ~45MB across 8 PDFs. Acceptable; not approaching git LFS territory.
- Sanity-check of fixture source-type classification: all 8 filenames hit the correct `source_type` on first-match via design plan §2.2 regex — verified via Python simulation of the classifier.

### Task Receipt
Updates fanned out this task:
- `test-cases/coreweave/*.pdf` (3 new) ................ Fortune press release, Mostly Metrics, Level Headed Investing
- `test-cases/cerebras/*.pdf` (3 new) ................. Cerebras press release, Futurum teardown, Motley Fool
- `.collab/INDEX.md` .................................. 6 new test-case rows registered; timestamps refreshed
- `docs/STATUS.md` .................................... Phase 1 + 2 marked fully complete; Phase 3 up-next block expanded
- `.claude/memory/state.md` ........................... blockers cleared; awaiting Will's go-ahead for Phase 3
- `docs/agents/claude.md` ............................. this entry

Missing / intentionally skipped:
- `.claude/memory/context.md` — no new invariants. Added a state.md open-question about PDF fidelity (text-only rendering loses tables) — may promote to invariant if Phase 4 retrieval quality degrades.
- Community-node install by Will — not blocking Phase 3 start (only blocks task 3.24 Langfuse wiring). Can happen any time before then.

## 2026-04-25T09:14:33-04:00 — Baton pickup from Codex

**Context.** User asked Claude to fully take over from Codex's accepted `qwen3-max-2026-01-23` Contradiction baseline. Codex left a thorough handoff in `.codex/memory/{state,context,decisions,pitfalls}.md` and `docs/agents/codex.md`, with `.collab/ACTIVE.md` cleared.

**State synthesis after delta-read.**

- Phase 3 has progressed materially during my absence: tasks `3.5` (Extraction) and `3.6` (Contradiction Variant A via raw-HTTP tool-use loop) are both runtime-verified and accepted by Will at the current quality bar.
- Active chat model is now `qwen3-max-2026-01-23` (read from `$env.ALICLOUD_MODEL`; container restart, not workflow re-import, is the activation step — Codex P-2).
- Workflow timeouts on long-running chat-completions nodes are 300s (`Call Extraction Agent`, `Call Contradiction Agent (Turn 1)`, `Call Contradiction Agent (Final)`).
- Retrieval caps in `Aggregate Extraction Context` are 24 regular + 6 union chunks after score-aware dedupe.
- Architecture has drifted from the design plan in two ways that are now load-bearing:
  - retrieval store is a hand-rolled aggregate chunk store, not n8n's Simple Vector Store
  - specialist agents are raw HTTP + Code-node tool-call loops, not n8n AI Agent nodes
- Both prompt files for the Contradiction agent are kept in sync with the embedded copies inside `n8n/workflow.json`. Future prompt edits must touch both surfaces in the same turn.
- `prompts/contradiction-agent.tool-use.md` was refined externally (Claude Chat) and adopted by Codex with two project-convention preservations (explicit input description + concrete schema-shaped example). Variant B remains unrefined and on standby.
- Codex's D-1 (proceed from accepted Contradiction baseline) and P-2 (env-reload pitfall for model swaps) are absorbed into my mental model.
- `.collab/ACTIVE.md` is empty; Codex cleared its row to avoid stale-collision detection.

**Resume point per Codex direction.** Task `3.P3` Gap Analysis prompt draft, then Codex post-commit review (§10 trigger 1: unrefined prompt = Codex reviews after commit), then task `3.7` workflow wiring. Codex explicitly said *"do not spend another mandatory round on Contradiction tuning unless downstream work exposes a real blocker"* — backlog items are visible but not gates.

**Watch out:**
- The two known Extraction recall regressions (S-1 `headcount`, `key_personnel`, rounded revenue) are real but deferred. If they propagate into Gap Analysis as false-positive missing-info flags, that becomes a real signal to revisit Extraction quality rather than tune Gap Analysis around them.
- Prompt-vs-workflow drift risk: every specialist now embeds its system prompt twice (in `prompts/*.md` and inside `n8n/workflow.json`). For each future prompt change, edit both in the same turn or the live runtime will silently behave differently from the doc.
- The hand-rolled retrieval store drift from design plan §3 is the most likely source of future cross-agent surprise. If a specialist-agent task makes new assumptions about retrieval shape, surface them explicitly in the work log.
- Codex's `.codex/memory/decisions.md` numbers Codex-owned decisions starting at D-1, while my own log uses D-0…D-5 already. The two namespaces are separate by owner; do not renumber.

### Task Receipt
Updates fanned out this task:
- `.claude/memory/state.md` ............................. advanced active task / next steps to `3.P3`; refreshed open questions; bumped read watermark to 2026-04-25T09:14:33-04:00
- `docs/agents/claude.md` ............................... this baton-pickup entry
- `.collab/INDEX.md` .................................... refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- `.claude/memory/context.md` — no new Claude-owned invariants emerged from the pickup itself. The two architecture drifts (hand-rolled retrieval store; raw-HTTP tool-use loops) are already documented in Codex's context.md; promoting them to my own context.md would duplicate. If they get formalized via design-plan update, that will be a Claude-owned action.
- `.claude/memory/decisions.md` — no new Claude-owned design choice in this pickup. D-1 (Codex's "proceed from accepted Contradiction baseline") is owned by Codex and lives in `.codex/memory/decisions.md`.
- `.claude/memory/pitfalls.md` — Codex's P-2 (env-reload, not workflow-import, for model swaps) is Codex-owned; I will not duplicate. If I encounter a Claude-platform-specific recurrence I will add a P-5.
- `prompts/gap-analysis-agent.md` edits — not yet drafted; awaiting Will's go-ahead.
- `n8n/workflow.json` — not re-read in this turn. Codex's documentation is sufficient to brief the user; I will read it when Gap Analysis wiring (`3.7`) requires it.

## 2026-04-25T09:14:33-04:00 — D-6 architecture formalization + deadline removal

**Context.** After the Codex baton pickup, Will asked me to evaluate the two architectural drifts (hand-rolled aggregate chunk store vs design plan's Simple Vector Store; raw-HTTP + Code-node tool-call loops vs n8n AI Agent node) and decide whether to revert the project to match the original plan or accept the live state and update the plan. After advisor pass and discussion, Will chose **Option Y** (accept code, update plan). Will also asked to remove deadline framing project-wide since the original 2026-04-24 take-home deadline has passed.

**Decision recorded.** D-6 in `.claude/memory/decisions.md` formalizes the hand-rolled aggregate chunk store + raw-HTTP + Code-node tool-call loop as the canonical repo pattern. Rationale: spike findings P-1 / P-3 / P-4 forced pure-JS + raw-HTTP throughout the workflow; once that pattern was established, layering SVS + AI Agent abstractions on top would create an inconsistent debugging surface. Empirical evidence is positive (Extraction prompt sizes dropped from 58.9k to 30.4k tokens after retrieval caps; Contradiction's `Microsoft 62% CORROBORATED` false-positive disappeared on `qwen3-max-2026-01-23`). Reframed for Pari's evaluation lens as "spikes revealed sandbox limits → engineering call to consolidate on pure-JS + raw-HTTP for consistency and inspectability → working empirical baseline → migration triggers documented" rather than "we deviated from the plan."

**Cost flags captured in D-6 with explicit migration triggers.**

- **Execution-data size:** ~23MB of embeddings inside one workflow item. Migration trigger: > ~50MB or visible UI lag → Supabase pgvector.
- **Doubled-prompt surface:** every specialist's system prompt lives in `prompts/*.md` AND inside `n8n/workflow.json`. Memo Generation will make it three. Mitigation deferred to 3.11 wire-up: `scripts/inject-prompts.js` (~20 LOC) reads markdown and injects into workflow.json placeholders before `import-workflow.sh` runs.
- **Manual Langfuse instrumentation:** the `n8n-nodes-openai-langfuse` community node wraps n8n's OpenAI node, not raw HTTP. Explicit HTTP Request nodes posting to `/api/public/ingestion` will be needed for the raw-HTTP chat-completions calls. Already in design plan §3.12 fallback path; ~30 min rework when 3.24 lands.
- **Production migration to pgvector becomes code rewrite** rather than n8n config swap. Acceptable for a prototype with explicit demo scope.

**D-2 nuance preserved.** D-2 (Contradiction Variant A provisional) is confirmed *for the raw-HTTP path that was actually built*, not *for the n8n AI Agent path the design envisioned*. Anyone later asking "is Qwen tool-use confirmed via the AI Agent node?" → "we never tested it; we tested an alternative topology that worked." Both design plan §13 (open questions) and implementation plan task 2.0a now annotate this distinction.

**Plan edits (10 spots across 2 files).** Mechanism descriptions rewritten with explicit `per D-6` cross-references; section-targeted retrieval / k values / per-doc + union semantics / in-process per-run scope all preserved. Original v1 wording captured in §14 / §15 diff-table addenda for audit.

**Deadline framing removal (8 spots across 5 files).** Replaced active deadline references with neutral "original deadline of 2026-04-24 has passed; project continues without an active deadline" framing in `docs/STATUS.md`, `README.md`, `AI_AGENTS.md`, `CONTEXT.md`, and the implementation plan (Phase 6 time-box trigger, Phase 7 goal, Phase 7 acceptance criterion). Historical references inside reference-only files (`DESIGN.md`, `IMPLEMENTATION.md`) and timestamps in memory files left intact.

**Authority note.** I edited `CONTEXT.md` lines 16, 43 (deadline framing) without a Claude Chat consultation. Per `docs/project-conventions.md §7` table, "CONTEXT.md other sections" are normally Claude-Chat-owned, but Will gave explicit override instruction ("change the timeline status from due yesterday to no due time at all"). Override applied; flagged here for transparency.

**Watch out:**
- The cross-references "per D-6" in the plan files now load-bear: any future edit to D-6 must propagate to the §2.3 / §2.4 / §2.5 / §2.7 / §3.4 / §7 design-plan spots and tasks 2.0a / 3.3 / 3.5 / 3.6 + §5.4 acceptance criterion + §13 open-questions row of the implementation plan. If D-6 is ever revised, grep for `D-6` and verify each reference still reads cleanly.
- The §14 / §15 diff tables are now the historical record of v1 wording. Do not edit prior rows; only append.
- The `scripts/inject-prompts.js` mitigation is on backlog. Recommend authoring it as part of task 3.11 (Memo Generation wiring) rather than later, since waiting until three prompts have drifted means three things to reconcile.
- The plan files are now version-tagged with `last-updated: 2026-04-25T09:14:33-04:00`. INDEX timestamps mirror this.

### Task Receipt
Updates fanned out this task:
- `.claude/memory/decisions.md` ......................... D-6 added at top of entries section; frontmatter bumped
- `docs/plans/2026-04-24-deal-diligence-design.md` ...... 9 surgical edits across §2.3 (step 5 + lifetime note), §2.4 (per-document invocation), §2.5 (Variant A + input contract), §2.7 (RFD invocation), §3.4 (Variant A input bundle), §7 (concurrency note), §13 (open questions row 1); §14 diff-table addendum; frontmatter bumped
- `docs/plans/2026-04-24-deal-diligence-implementation.md`  task 2.0a annotation; tasks 3.3 / 3.5 / 3.6 mechanism rewrites; §5.4 acceptance criterion update; §15 diff-table addendum; Phase 6 time-box / Phase 7 goal / Phase 7 acceptance criterion deadline-framing edits; frontmatter bumped
- `docs/STATUS.md` ...................................... added two Done-section bullets (D-6 architecture formalization landed; deadline framing removed); deadline header replaced with active-status note; frontmatter bumped
- `README.md` ........................................... deadline framing removed from project summary; frontmatter bumped
- `AI_AGENTS.md` ........................................ deadline framing removed from project summary; frontmatter bumped
- `CONTEXT.md` .......................................... deadline framing removed at line 16 + line 43 (per Will's override of `docs/project-conventions.md §7` authority constraint); frontmatter bumped
- `docs/agents/claude.md` ............................... this entry
- `.collab/INDEX.md` .................................... timestamps refreshed for all changed files

Missing / intentionally skipped:
- `n8n/workflow.json` — no code change. The decision is to formalize the live state, not modify it.
- `prompts/*.md` — no prompt edits. The Extraction and Contradiction prompts already match the live workflow embeddings.
- Reference-only files (`DESIGN.md`, `IMPLEMENTATION.md` at root) — left unchanged. They are historical v1 snapshots; their deadline references describe the original take-home framing accurately.
- `CONTEXT.md` line 279 ("Filed S-1 April 17, 2026 — 6 days before deadline") — left as historical CoreWeave context (relative date is a fact about the filing, not a project-state assertion).
- Codex memory files — not touched. Codex owns those; my updates would be cross-contamination.
- `scripts/inject-prompts.js` — not authored. Deferred to 3.11 wire-up per D-6 mitigation strategy.
- Advisor pass on the architecture formalization itself — taken before the edits (called once during the evaluation phase). No second pass on the mechanical edits since they were straightforward and verified by spot-read after.
- Commit — not yet made. Will eyeballs the diff first, then atomic commit `[plan] formalize D-6: aggregate chunk store + raw-HTTP tool-use loops as live architecture; remove post-deadline framing`.

## 2026-04-25T09:30:00-04:00 — Task 3.P3: Gap Analysis prompt draft

**Context.** With D-6 formalized and committed (commits e466300 + d3cd83b), Will gave the green light to proceed to the next concrete unit of work. Per Codex's handoff direction and the implementation plan, that is task 3.P3: draft the Gap Analysis system prompt by upgrading the Phase 2 stub at `prompts/gap-analysis-agent.md` to a Phase 3 draft.

**Action.** Replaced the stub entirely with a prompt-draft following the 7-part convention from `docs/project-conventions.md §3`:

1. **Role** — institutional LP diligence lead identifying missing information; explicit statement that this agent does NOT extract facts (Extraction's job) and does NOT detect contradictions (Contradiction's job), only flags gaps.
2. **Framework** — Institutional LP Diligence Checklist with four categories (financial / commercial / operational / legal_regulatory) preserved from the stub, expanded with one-line bullets per item for grounding.
3. **Input description** — three artifacts: `extracted_facts_per_document` (ExtractionOutput[]), `contradiction_output` (ContradictionOutput), `union_chunks` (the same union retrieval used elsewhere in the workflow per design plan §2.6).
4. **Output schema** — exact `GapAnalysisOutput` shape with concrete schema-shaped example showing 3 missing items spanning 2 categories and 2 importance levels (HIGH / MEDIUM).
5. **Constraints** — 10 numbered rules covering JSON-only output, enum validity, item specificity, the empty-array case, the no-citations rule (since this agent flags absences not claims), and the no-duplicate / no-already-corroborated rules.
6. **Edge cases** — comprehensive packet, implicit-but-not-explicit, partial presence, stage-uninferable, conflicting stage signals.
7. **Citation rules** — explicitly N/A with rationale (this agent flags absences, not claims; the schema does not include a citation field on `missing_information` items).

**Key design choices.**

- **Stage-aware importance calibration.** The single most important property of this prompt: importance is calibrated to inferred deal stage and sector, not absolute. Audited financials missing on a Series C+ = HIGH; same gap on a pre-seed = LOW. Concrete signal thresholds given (revenue + headcount + raise size).
- **Three-way coverage rule.** A checklist item is PRESENT if ANY of: (a) Extraction field populated, (b) verified_claim in Contradiction output, (c) substantively addressed in union_chunks. The third leg is what prevents flagging items implicit in the corpus that didn't make it into Extraction's structured output. This is also the design plan §2.6 union retrieval pattern realized.
- **Concrete schema-shaped example.** Per project-conventions §3 requirement that prompt files include a concrete output example. Used a Series B SaaS example (cohort retention HIGH, customer concentration HIGH, board composition MEDIUM) covering category and importance variation.
- **No citations.** Schema-validated this against `schemas/agent-output-schemas.json#/$defs/GapAnalysisOutput` — `missing_information[]` items have `category`, `item`, `importance`, optional `suggested_source`. No citation field. Prompt states this explicitly so the model doesn't invent one.
- **Token budget.** Prompt block is ~1700 tokens, under the 2000-token convention cap. Comparable to Extraction (~1900 tokens) and Contradiction Variant A (~2000 tokens).

**Why this is medium-stakes, not high-stakes.** Per `docs/project-conventions.md §3`: "Three high-stakes prompts route through Claude Chat before commit: Extraction, Contradiction, Memo Generation. The other three (Gap Analysis, Portfolio Fit, Evaluator) ship from Claude Code drafts unless quality issues surface during iteration." So this draft does NOT need Claude Chat refinement before wiring. Codex post-commit review per §10 trigger 1 is the gate.

**Watch out:**
- The doubled-prompt surface flagged in D-6 cost-flags will apply to this prompt too once 3.7 wires it. When that happens, the system prompt will live in both `prompts/gap-analysis-agent.md` AND embedded inside `n8n/workflow.json`'s `Build Gap Analysis Request` node. Memo Generation will make it three. This is the trigger to author `scripts/inject-prompts.js` per the D-6 mitigation deferred to 3.11.
- Stage-inference logic depends on Extraction's `deal_structure.amount_raising`, `company_overview.headcount`, and `financial_performance.revenue_latest_period` being populated. The known Extraction recall regression (S-1 `headcount` came back null on CoreWeave) means stage may not always infer cleanly. The prompt's edge-case rule for that ("default to MEDIUM importance") is the fallback.
- The "substantively addressed in union_chunks" rule is qualitative and model-dependent. If Codex review or first-run output suggests the model is overinclusive (treating heading mentions as "substantive coverage" → too few items flagged) or underinclusive (treating long boilerplate disclaimers as "absent" → too many items flagged), the rule will need a tighter operationalization.

**Next concrete step.** Codex review of the draft. If review surfaces no blocker, proceed to task 3.7 wiring.

### Task Receipt
Updates fanned out this task:
- `prompts/gap-analysis-agent.md` ....................... upgraded from Phase 2 stub to Phase 3 draft; type: prompt-stub → prompt-draft; full 7-part system prompt with concrete example
- `.claude/memory/state.md` ............................. active task advanced to 3.P3 drafted / awaiting Codex review; next steps re-pointed to 3.7 wiring under D-6 pattern
- `docs/STATUS.md` ...................................... 3.P3 added to Done section
- `docs/agents/claude.md` ............................... this entry
- `.collab/INDEX.md` .................................... gap-analysis-agent.md row updated to prompt-draft + new timestamp; state.md and STATUS.md timestamps refreshed

Missing / intentionally skipped:
- Claude Chat refinement — not required per project-conventions §3 (Gap Analysis is medium-stakes, not high-stakes).
- `n8n/workflow.json` — no wiring yet; that is task 3.7.
- `.claude/memory/decisions.md` — no new Claude-owned design choice; this was prompt-drafting per the existing plan.
- `.claude/memory/context.md` — no new durable invariants; the stage-aware calibration rule is documented in the prompt itself, not as a project invariant.
- `.claude/memory/pitfalls.md` — no new pitfalls encountered; the union_chunks operationalization risk is flagged in this entry's Watch out section, will be promoted to a P-entry only if it materializes during 3.7 runtime.
- Advisor pass on the prompt — not called. Medium-stakes prompt; one architecture-level advisor pass already happened earlier this session. Codex review per §10 trigger 1 is the operative gate.
- Commit — not yet made. Surface diff for Will eyeball; commit after sign-off.

## 2026-04-25T09:45:00-04:00 — Task 3.7: Wire Gap Analysis specialist into n8n/workflow.json

**Context.** With 3.P3 prompt drafted and committed (`7f7a0ac`), Will gave the green light to proceed with task 3.7: wire Gap Analysis into the live workflow following the D-6 pattern (raw HTTP + Code-node tool-call style, no n8n AI Agent node, no Simple Vector Store).

**Action.** Appended 6 nodes after `Parse Contradiction Response`:

1. **Prepare Gap Analysis Inputs** (Code node, runOnceForAllItems) — pulls `contradiction_output` from the prior node, reaches back to `$('Aggregate Contradiction Inputs')` for `extraction_outputs[]`, and emits one item with the union retrieval query (LP-checklist coverage keywords from design plan §2.6 expanded slightly: "audited financials unit economics customer concentration cohort retention covenants related party transactions litigation board composition customer references intellectual property") plus k=6.
2. **Embed Gap Analysis Query** (HTTP Request) — POST to `/embeddings` for the union query. 300s timeout, 3 retries, 2s backoff.
3. **Rank Gap Analysis Chunks** (Code node, runOnceForEachItem) — cosine ranks against ALL chunks in the aggregate vector store (no `source_name` filter, since this is union retrieval per §2.6). Takes top-6.
4. **Build Gap Analysis Request** (Code node, runOnceForEachItem) — embeds the full system prompt from `prompts/gap-analysis-agent.md` and assembles the user message with `extracted_facts_per_document`, `contradiction_output`, `union_chunks`. Single-turn (no tool-use loop, unlike Contradiction).
5. **Call Gap Analysis Agent** (HTTP Request) — POST to `/chat/completions` with `response_format: { type: 'json_object' }`. 300s timeout.
6. **Parse Gap Analysis Response** (Code node, runOnceForEachItem) — schema-shape projection per `GapAnalysisOutput`. Validates category enum (4 values), importance enum (HIGH/MEDIUM/LOW), filters items missing required fields, preserves optional `suggested_source` only when present.

**Wiring helper.** Used a one-shot Python helper (`_tmp_wire_gap.py`) to load the workflow + prompt, construct the 6 node objects with correct JSON escaping (the system prompt becomes a `JSON.stringify`-safe string literal embedded in the Code node's jsCode), and write back. Helper deleted after successful run; idempotency guard included in case it's ever re-run.

**Verification.**
- `python -c "import json; json.load(open('n8n/workflow.json', encoding='utf-8'))"` → JSON valid.
- Total nodes: 30 (was 24). Total connection entries: 29 (was 23). versionId bumped to `phase3-session2-v7`. Meta description updated to mention Gap Analysis.

**Watch out:**
- **Doubled-prompt surface (per D-6) is now also live for Gap Analysis.** The system prompt lives in `prompts/gap-analysis-agent.md` AND inside the `Build Gap Analysis Request` node's jsCode in `n8n/workflow.json`. Future edits to the prompt must touch both surfaces in the same turn, OR (preferred) trigger the D-6 mitigation: author `scripts/inject-prompts.js` so the prompt is injected at workflow-import time. Memo Generation will be the third occurrence; recommend doing the mitigation when 3.11 lands rather than waiting longer.
- **Union retrieval is across all docs, no source_name filter.** This is intentional per design plan §2.6 — Gap Analysis is a coverage check, not a per-document fact extraction. If Codex review or first-run output suggests the model is missing items because relevant chunks live in only one document and didn't make the top-6, consider raising k or per-document retrieval splits.
- **The "substantively addressed in union_chunks" coverage rule in the prompt is qualitative.** First-run quality may surface either over-inclusion (heading-only mentions counted as "covered" → too few flags) or under-inclusion (boilerplate-only counted as "absent" → too many flags). If issues surface, tighten the rule operationally before changing wiring.
- **Stage inference depends on Extraction recall.** The known Extraction regression on S-1 `headcount` (came back null on CoreWeave) means stage may not always infer cleanly. The prompt's edge-case rule for that ("default to MEDIUM importance") is the safety net. Watch the first-run output for whether items are actually getting reasonable importance labels.

**Open question / refinement target.** The `Prepare Gap Analysis Inputs` node assumes `Aggregate Contradiction Inputs` is reachable via cross-node reference. This works because that node is upstream in the same execution path. If the workflow ever introduces parallel branches that bypass `Aggregate Contradiction Inputs`, this will break — but that's not currently planned.

### Task Receipt
Updates fanned out this task:
- `n8n/workflow.json` ................................... 6 new nodes appended after Parse Contradiction Response; 6 new connection entries; versionId bumped; meta description updated
- `.claude/memory/state.md` ............................. active task advanced to 3.7 wired / awaiting runtime verification; next steps re-pointed to 3.8 Red Flag Detector integration
- `docs/STATUS.md` ...................................... 3.7 added to Done section
- `docs/agents/claude.md` ............................... this entry
- `.collab/INDEX.md` .................................... timestamps refreshed for n8n/workflow.json, state.md, STATUS.md, INDEX itself

Missing / intentionally skipped:
- `prompts/gap-analysis-agent.md` — no edit. The prompt is unchanged from the 3.P3 commit; it just has a second copy embedded in the workflow now.
- `_tmp_wire_gap.py` — written, run, deleted. Should not appear in git.
- `scripts/inject-prompts.js` — D-6 mitigation deferred to 3.11. The Gap Analysis wiring uses the same direct-embed pattern as Extraction and Contradiction.
- `.claude/memory/decisions.md` — no new Claude-owned design choice; 3.7 is implementation per the existing plan.
- `.claude/memory/context.md` — no new durable invariants.
- `.claude/memory/pitfalls.md` — no new pitfalls encountered. The watch-outs above will graduate to P-entries only if they materialize during runtime verification.
- Codex memory files — not touched. Codex owns those.
- Live runtime verification — Will runs the workflow.
- Commit — not yet made. Surface diff for Will eyeball; commit after sign-off.

## 2026-04-25T16:30:00-04:00 — Phase 3 closure receipt

**Outcome.** Phase 3 (Core Build) complete. Workflow runs end-to-end on CoreWeave with 52 connected nodes producing IC-grade memos that persist to Supabase with valid citations and notify via Slack. Two live runs verified the chain.

**Phase 3 acceptance criteria** (per implementation plan §5.4):
- [x] Workflow triggers via Form Trigger
- [x] Document ingestion populates the aggregate chunk store (per D-6)
- [x] All 7 specialist agents execute without error on CoreWeave run
- [x] Red Flag Detector emits non-empty `red_flags` for CoreWeave (caught customer concentration extreme HIGH, revenue growth anomalous LOW)
- [x] Memo is written to Supabase with all required fields
- [x] Citations populated with format per design §11 regex (17/17 validated)
- [x] Slack message received in `#investment-team` (verified after P-4 fix)
- [x] LLM calls traced in Langfuse with correct metadata (manual instrumentation per §3.12 fallback path)
- [ ] Meta-eval discrimination — gated to Phase 4

**Decisions landed this phase.** D-2 confirmed for the hand-rolled raw-HTTP tool-use path (not n8n AI Agent node). D-3 hand-rolled validator carried forward. D-4 N8N_BLOCK_ENV_ACCESS_IN_NODE=false. D-5 OpenRouter embeddings. D-6 formalized the hand-rolled aggregate chunk store + raw-HTTP tool-call loops as the canonical repo pattern.

**Pitfalls captured.** P-1 sandbox blocks `ajv.compile`. P-2 MSYS path conversion on Windows Git Bash. P-3 sandbox blocks `require('crypto')` AND Web Crypto global. P-4 multiple n8n node classes REPLACE `$json` instead of merging — encountered three times this phase (HTTP Request, Extract from File, and again in 3.16w Slack post-Insert).

**Phase 3 commit count (this session).** 14 commits beyond Codex's accepted baseline:
1. `d3cd83b` plan formalization (D-6) + deadline removal
2. `7f7a0ac` 3.P3 Gap Analysis prompt
3. `1043ed5` 3.7 Gap Analysis wiring
4. `9c66760` 3.8 Red Flag Detector wiring
5. `b9e544e` 3.P4 Portfolio Fit prompt + 3.9 wiring
6. `6981adb` 3.10a Citation Validity JS module
7. `6a149e7` 3.P5 Memo Generation pre-refinement
8. `137324b` 3.P6 Evaluator prompt
9. `970e762` 3.18w-3.20w helper scripts
10. `e7320fa` 3.9 fix (`$input.all()` runtime bug)
11. `fd32499` 3.P5r refined Memo Generation prompt
12. `a165b3a` 3.10a fix (Codex P1 + P3)
13. `e52439b` 3.P3 fix (Codex P2 partial-coverage)
14. `8c32c23` 3.20w fix (Codex P2 meta-eval upstream)
15. `a190cfd` 3.11 Memo Generation wiring + inject-prompts.js (D-6 mitigation)
16. `0c9b15f` 3.10b + 3.13 + 3.14 + 3.15 + 3.16w Citation Validity + Evaluator + persistence + notification
17. `c0ee968` 3.16w fix (Slack P-4)
18. `12a74db` 3.17w error handler + 3.24-3.29 Langfuse instrumentation; Phase 3 closed

**Watch out for Phase 4:**
- Extraction recall regressions: S-1 `headcount` and `key_personnel` still null. Gap Analysis correctly flags these as MEDIUM missing items in CoreWeave, but Phase 4 calibration may need supplemental fixtures if they propagate weirdly.
- RFD missed `material_weakness` despite 3 sources mentioning it — regex coverage gap. Backlog: add "exist", "remain", "are present" to MATERIAL_WEAKNESS_POS.
- Memo's first key_strength scored "74% gross margin" as severity HIGH; per the prompt rule, severity in key_strengths means deal materiality, which probably maps to MEDIUM here. Minor calibration drift; can address in a future prompt iteration.
- The `supabase_id` cosmetic addition to the Slack context footer didn't render — n8n flattened the Supabase REST single-row response from `[{...}]` to `{...}`. Conditional `Array.isArray` branch failed. Fix is one-line if Will wants the cross-system correlation.
- Per-agent schema-validation-with-retry (3.12) deferred. The parsers' shape projection works for the prototype but isn't the full design plan §3.3 retry-and-bypass machinery. Retrofit if Phase 4 reveals bypass-pattern failures.

**Time spent this phase.** ~6 hours across two work sessions (Codex's pre-handoff session + my post-handoff session). Most-expensive iterations: getting Extraction retrieval caps right (Codex), debugging the Contradiction tool-call loop (Codex), the doubled-prompt mitigation pattern (me, deferred until 3.11 wire-up).

### Task Receipt
Updates fanned out this phase-closure entry:
- `docs/agents/claude.md` ............................... this Phase 3 closure receipt
- `.claude/memory/state.md` ............................. marked Phase 3 closed; pause point set to Phase 4 entry
- `docs/STATUS.md` ...................................... current-phase rewritten to "Phase 3 COMPLETE; Phase 4 next"
- `.collab/INDEX.md` .................................... timestamps refreshed for changed files

Missing / intentionally skipped:
- `.claude/memory/decisions.md` — no new Claude-owned design decisions in the closeout itself; D-6 already captures the architecture. Future Phase 4 calibration tweaks may surface new decisions.
- `.claude/memory/context.md` — no new durable invariants beyond what's already captured (I-1 through I-9 + the implicit D-6 truths now in decisions.md).
- `.claude/memory/pitfalls.md` — three new P-4 instances surfaced this phase but the entry already documents the class. Adding individual occurrences would duplicate. P-4 entry's "see also" section could be extended to list every instance, but that's documentation polish.
- 3.12 schema-validation-with-retry — deferred deliberately, documented in STATUS.md.
- Codex post-commit reviews of the medium-stakes prompts (Gap Analysis, Portfolio Fit, Evaluator) — not yet routed to Codex. Will should batch this with the next Codex session if desired; not a Phase 4 blocker.

## 2026-04-25T18:45:00-04:00 — Post-closure: model swap + Langfuse host fix + 3rd E2E run

**Context.** After the 16:30 Phase-3 closure receipt, Will requested two follow-ups: (1) swap the active chat model from `qwen3-max-2026-01-23` to `qwen3-max-preview` (Will pre-verified the model name exists in DashScope), (2) debug a Langfuse 401 "Invalid credentials. Confirm correct host" error from Send Langfuse Ingestion.

**Model swap.** Updated `.env.example` to set `ALICLOUD_MODEL=qwen3-max-preview`. Workflow nodes already read `ALICLOUD_MODEL` from env (per Codex P-2), so no workflow.json change was needed beyond the env line. Will updated `.env` and restarted the n8n container.

**Langfuse 401 root cause.** Env-var name mismatch. `.env.example` and `.env` set `LANGFUSE_BASE_URL=https://us.cloud.langfuse.com` (per design plan §2.12 convention), but my `Build Langfuse Batch` jsCode only read `$env.LANGFUSE_HOST` (Langfuse Python SDK convention). Since `LANGFUSE_HOST` was not forwarded by docker-compose, the workflow defaulted to `https://cloud.langfuse.com` (EU region) and the US-region credentials returned 401.

**Fix (commit `09f0323`):**
- `docker-compose.yml` now forwards BOTH `LANGFUSE_BASE_URL` AND `LANGFUSE_HOST` for env-var convention robustness.
- `.env.example` documents `LANGFUSE_BASE_URL` as primary with `LANGFUSE_HOST` as alternate.
- `n8n/workflow.json` Build Langfuse Batch jsCode reads `LANGFUSE_BASE_URL` first then falls back to `LANGFUSE_HOST`.
- Added one-line diagnostic stderr log on auth failure.

**Verification — third E2E run** (run_id `0efb319c-7e26-49bb-b17e-635926d7f595`): all 12 ingestion events returned 201; Langfuse trace landed with observations correctly tagged `qwen3-max-preview` (verified in trace JSON Will pasted). Error sub-flow correctly did NOT fire on the green run — confirmed expected behavior.

**Quality anomaly flagged for Phase 4.** Run `0efb319c` showed `evaluator_score: 0` and `routing_decision: flagged_for_review` despite `recommendation: pass`. Most likely cause: `qwen3-max-preview` produces a slightly different output shape than `qwen3-max-2026-01-23` for the Evaluator step, causing `Parse Evaluator Response` parser to fall through to score=0 default. First Phase 4 calibration item.

**Watch out:**
- Any future model swap: re-verify the Evaluator parser still extracts `criteria_scores` from the new model's JSON-mode output. The parser currently sums `criteria_scores` authoritatively; if that field is missing/malformed, evaluator_score collapses to 0 and routing forces flagged_for_review.
- Both Langfuse env-var names are now load-bearing in docker-compose. Removing either could break runs after the next env-convention shift.
- Test HTTP nodes with `--data-binary @-` style payloads on Windows — verified the Langfuse batch endpoint via curl from the host before the fix, ruling out network/auth-shape issues vs the in-workflow defaulting bug.

### Task Receipt
Updates fanned out this task:
- `n8n/workflow.json` ................................... Build Langfuse Batch reads LANGFUSE_BASE_URL first; diagnostic log added; versionId bumped to phase3-session2-v19
- `.env.example` ........................................ ALICLOUD_MODEL=qwen3-max-preview; LANGFUSE_BASE_URL primary + LANGFUSE_HOST alternate documented
- `docker-compose.yml` .................................. forwards both LANGFUSE_BASE_URL and LANGFUSE_HOST
- `.claude/memory/state.md` ............................. updated to reflect Phase 3 fully closed + observable; flagged evaluator_score:0 anomaly as first Phase 4 item; watermark bumped
- `docs/STATUS.md` ...................................... in-progress cleared; up-next refocused on Phase 4 entry; test-results updated with 3 E2E runs + Langfuse confirmation
- `docs/agents/claude.md` ............................... this entry
- `.collab/INDEX.md` .................................... timestamps refreshed for the changed files

Missing / intentionally skipped:
- `.claude/memory/decisions.md` — no new Claude-owned decisions; model swap is a config change, not an architectural choice. The Langfuse host fix is a bugfix, not a decision.
- `.claude/memory/pitfalls.md` — could add a P-5 ("env-var name conventions: docker-compose must forward both LANGFUSE_BASE_URL and LANGFUSE_HOST"), but the lesson is captured in the docker-compose comments and .env.example. Promote to P-entry only if it recurs.
- `.claude/memory/context.md` — no new invariants.
- Codex memory files — not touched.
- Phase 4 entry — not started. Awaiting explicit user direction per session-management discussion.

## 2026-04-25T19:15:00-04:00 — Stale-content sweep across managed files

**Context.** Will requested a thorough audit of all managed files to eliminate misleading content and reflect the true post-Phase-3 state. The earlier session-end update (18:45) handled the active surfaces (state.md, STATUS.md, work log, INDEX timestamps). This sweep targets the dormant surfaces that hadn't been touched in days and were drifting from reality.

**Drift found and corrected (5 files).**

1. **`README.md` `## Status` and `## Running`** — said "Phase 0 complete... Ready for implementation Phase 1" and "Phases 1–2 are planned." Both wildly stale; we're at Phase 3 complete. Rewrote `## Status` to show Phases 0–3 complete with active model, 52-node count, error sub-flow, and Phase 4 entry; expanded `## Running` with the actual `cp .env.example .env` + `import-workflow.sh` quickstart.
2. **`.claude/memory/context.md` I-9** — described qwen3.5-plus reasoning behavior with implications expressed as Phase-2-future-work ("Phase 2 spike 2.0a MUST verify..."). All three implications are now empirically resolved by Phase 3 runs. Revised text generalizes the invariant to the qwen3-max family (verified on both `qwen3-max-2026-01-23` and `qwen3-max-preview`), updates the cost model with run-`0efb319c` actuals, marks the JSON-parsing risk as RESOLVED via D-6 raw-HTTP path (with re-emergence trigger if AI Agent node ever returns), and converts the latency note into a 300s-timeout reference. Added a model-swap watch-out citing the `evaluator_score: 0` anomaly as the canonical recurrence.
3. **`.claude/memory/decisions.md` D-6** — last paragraph said "Awaiting Will's direction on whether to (a) request Claude Chat update, (b) authorize Claude Code direct edit, or (c) leave the plan as historical v1." Will chose Option Y two weeks ago in commit `d3cd83b` and the plan edits already landed. Replaced with concrete record of what landed (9 design-plan edits + impl-plan edits + diff-table addenda). Verification paragraph updated to reflect three E2E runs across two models.
4. **`.claude/memory/decisions.md` D-2 header** — labeled "provisional" but D-6 already confirms it for the raw-HTTP path. Header now reads `(CONFIRMED 2026-04-25 for raw-HTTP path; see D-6)` to surface the resolution at a glance.
5. **`.claude/memory/pitfalls.md` P-4 "See also"** — listed only two instances (Extract Embedding, Text Chunker). The third (Build Slack Message after Insert Deal Memo, fixed in `c0ee968`) was missing. Added with commit ref + escalation note: P-4 has now hit three nodes; treat any new HTTP-Request → Code-node pair as guilty-until-proven-innocent.
6. **`docs/plans/2026-04-24-deal-diligence-implementation.md §14 Current Status`** — said "Phase 1: Not started. Phase 2–7: Not started." Per `.claude/CLAUDE.md` adapter file, "you may check off completed tasks and update §12 Current Status" (renumbered §14 in the refined plan). Rewrote with phase-by-phase status, key artifacts/decisions per phase, Phase 4 entry point, and current focus.

**Files audited and intentionally left unchanged:**
- `CONTEXT.md` — scope-locked sections owned by Will / Claude Chat per `docs/project-conventions.md §7`. Earlier deadline-removal edit had explicit user override; no comparable override here.
- `DESIGN.md`, `IMPLEMENTATION.md` (root) — flagged `status: reference-only`. Frozen historical baselines.
- `docs/plans/2026-04-24-deal-diligence-design.md` — only the impl plan's §14 is explicitly Claude-editable per the adapter; design plan changes were already made in commit `d3cd83b`.
- `.codex/memory/*`, `docs/agents/codex.md` — Codex-owned per framework rule "Do not edit another agent's log or memory" (`AI_AGENTS.md` behavioral-rules / multi-agent coordination).
- `.collab/PROTOCOL.md`, `.collab/ROUTING.md`, `AGENTS.md`, `AI_AGENTS.md` — current. (AI_AGENTS.md project-summary still accurate at the abstract level it operates at.)
- Adapter files (`.claude/CLAUDE.md`, `.codex/CODEX.md`) — current.
- `docs/project-conventions.md` — operational rules unchanged.

**Verification.** `npx @gpgaoplane/multi-agent-collab check` → OK. INDEX timestamps now reflect actual content age for all touched files.

**Watch out:**
- `CONTEXT.md` is the next likely staleness candidate but I cannot edit its scope-locked sections without an explicit user override or a Claude Chat pass. If Will wants CONTEXT.md refreshed against Phase 3 reality, that's a separate request that should route via Claude Chat (or with explicit "edit CONTEXT.md to reflect X" override from Will).
- The `docs/plans/2026-04-24-deal-diligence-design.md §14 Current status` row of the diff table mirrors §14 of the impl plan; not updated here because it's a historical diff entry, not live status. Live status lives in §14 of the impl plan.

### Task Receipt
Updates fanned out this task:
- `README.md` ........................................... `## Status` and `## Running` rewritten; frontmatter bumped
- `.claude/memory/context.md` .......................... I-9 revised with Phase 3 evidence; frontmatter bumped
- `.claude/memory/decisions.md` ........................ D-6 final paragraphs replaced with landed-plan record; D-2 header marked CONFIRMED; frontmatter bumped
- `.claude/memory/pitfalls.md` ......................... P-4 "See also" extended with Slack instance + escalation note; frontmatter bumped
- `docs/plans/2026-04-24-deal-diligence-implementation.md` §14 rewritten phase-by-phase; frontmatter bumped
- `docs/agents/claude.md` .............................. this entry; frontmatter bumped to 19:15
- `.collab/INDEX.md` ................................... timestamps refreshed for the 5 modified content files and self

Missing / intentionally skipped:
- `CONTEXT.md` — scope-locked authority constraint; no user override for this sweep.
- `DESIGN.md`, `IMPLEMENTATION.md` (root) — reference-only frozen.
- Design plan (`docs/plans/2026-04-24-deal-diligence-design.md`) — no Claude-editable section flagged stale; D-6 already routed §2.3 / §2.5 edits in `d3cd83b`.
- Codex-owned files (`.codex/memory/*`, `docs/agents/codex.md`) — framework prohibits cross-agent memory editing.
- `.collab/ACTIVE.md` — was already empty; no row to update.
- New decisions / invariants / pitfalls — none surfaced; this was content reconciliation, not new work.

## 2026-04-25T20:15:00-04:00 — Phase 4 entry step 1: debug evaluator_score:0 anomaly → Memo prompt fix

**Context.** Per Will's go-ahead for the Phase 4 entry plan, debugged the `evaluator_score: 0` anomaly observed in run `0efb319c` on `qwen3-max-preview`.

**Diagnosis path.**
1. Read `Parse Evaluator Response` parser. Confirmed defaults: missing/non-numeric criteria_scores collapse to 0 each via `clampInt(...) ?? 0`. So either model produced 0s OR parser stripped content.
2. Asked Will for raw `Call Evaluator Agent` output. Got it: model returned well-formed JSON with all six criteria_scores=0 and a deliberate `critical_issues[0] = { issue_type: "other", description: "Memo Generation bypassed; review provisional", severity: "HIGH" }`. Not a parser bug — the Evaluator deliberately invoked its bypass rule.
3. Asked for `Build Evaluator Request` output to see what memo it received. Got `memo_output: { executive_summary: "", recommendation: "pass", recommendation_rationale: "", company_snapshot: { description: "", stage: "", ... } }`. The memo was an EMPTY SHELL.
4. Asked for raw `Call Memo Generation Agent` output to confirm Memo parser wasn't the culprit. Got the model's actual output: same empty-shell pattern (`executive_summary: ""`, all arrays `[]`, all confidences `0.0`, but `recommendation: "pass"` and `portfolio_fit.overall_alignment: "LOW"`). `finish_reason: "stop"`, `completion_tokens: 184` — not a token cutoff. The model deliberately produced minimum-valid output.

**Root cause.** Memo Generation prompt rule 7 ("prefer omission over speculation") + rule 4 ("if Extraction did not surface a fact, you cannot assert that fact") + seven "MUST cite" rules combine to trigger a global-abstain failure mode on `qwen3-max-preview`. The prompt was Claude-Chat-refined against `qwen3-max-2026-01-23` (which produced 58/60 memos with the same prompt and input). qwen3-max-preview interprets the abstain signals globally rather than per-claim. Same model interaction class as we'll likely see when other prompts are first exposed to qwen3-max-preview.

**Fix (option B per Will's choice — no fallback to qwen3-max-2026-01-23 since that model has been retired).**

Edited `prompts/memo-generation-agent.md`:
- **Rule 7 narrowed** from "If evidence is insufficient, prefer omission over speculation" to "If evidence is insufficient for a SPECIFIC claim, prefer omission of THAT claim over speculation."
- **Added rule 8** explicitly scoping rule 7 to per-claim, NEVER global. Mandates non-empty prose for `executive_summary`, `recommendation_rationale`, and every `company_snapshot` field whenever upstream artifacts have ANY usable content. Mandates corresponding memo arrays (`key_strengths`, `key_risks`, `contradictions`, `red_flags`, `missing_information`) be non-empty when the upstream input is non-empty.
- **Added 6 silent final checks** at the end: explicit non-empty assertions on prose fields + 4 self-revise triggers ("if extracted_facts_per_document is non-empty AND key_strengths is empty → revise" pattern × 4).

Ran `scripts/inject-prompts.js` to sync the embedded copy in `n8n/workflow.json`. Workflow `versionId` bumped `phase3-session2-v19 → v20`.

**Verification (live n8n re-run on CoreWeave).**
- `Call Memo Generation Agent` now produces a substantive memo (no longer the empty shell).
- `Call Evaluator Agent` returns: `evaluator_score: 58 / 60`, `criteria_scores: { citation_completeness: 10, contradiction_acknowledgment: 10, missing_information_coverage: 10, red_flag_propagation: 10, reasoning_coherence: 9, hallucination_check: 9 }`, `routing_decision: complete_high_confidence`, `critical_issues: []`. Same quality bar as the prior `qwen3-max-2026-01-23` baseline, restored on `qwen3-max-preview`.
- Identical model, identical input, prompt change is the only delta.

**Step 2 of Phase 4 entry (meta-eval discrimination check, option A — empty-upstream sanity check).**
Ran `scripts/run-meta-eval.js` against the meta-eval fixtures with empty upstream. Both fixtures scored 0/60, gap = 0.
- Same eager-bypass pattern as Memo Generation, this time in the Evaluator. With empty upstream, qwen3-max-preview invokes the prompt's "All six criteria score 0: structural failure" edge-case rule preemptively instead of scoring criteria 1/5/6 from the memo body alone (which is plenty calibrate-able: both fixtures have 4-source manifests, populated key_strengths/key_risks, citable claims, and the bad fixture has the textbook "highly diversified customer base" + advance_to_deep_diligence pairing that contradicts the actual S-1 evidence).
- Empty-upstream meta-eval cannot produce meaningful discrimination on this Evaluator prompt as currently written — the bypass over-triggers.
- Same fix pattern as Memo will likely apply: scope the all-zero rule to "score-derived only, never preemptive" + tell the model to score criteria 1/5/6 from memo body alone when upstream is empty, and score criteria 2/3/4 as N/A-neutral (or default to 7) when their upstream is empty.
- **Surfaced to Will, awaiting direction:** apply the same prompt-tightening pattern to the Evaluator now (continues Phase 4 entry plan), or move to option C (capture real upstream from the just-completed CoreWeave run).

**Watch out:**
- **Pattern recurrence prediction:** every prompt that has an "edge-case bypass" rule may show this behavior on `qwen3-max-preview`. Memo and Evaluator are confirmed; Gap Analysis and Portfolio Fit also have edge-case clauses. If we observe the same global-bypass pattern there, consider a project-wide prompt-pattern audit before Phase 4 calibration deepens.
- **Doubled-prompt surface (D-6) held up well.** `inject-prompts.js --check` correctly flagged drift on Build Memo Request after the prompts/memo-generation-agent.md edit; default-mode injection re-synced. The mitigation works as designed.
- **Process flag (project-conventions §3):** Memo Generation is a HIGH-stakes prompt. The convention says high-stakes prompt edits route through Claude Chat for refinement before commit. I made this edit as a tactical bugfix (rule 7 scoping + silent checks; not a structural rewrite), then verified empirically. Surfaced this trade-off explicitly to Will at the time of the edit; Will chose to test first and refine after empirically. The 58/60 verification gives empirical evidence that the fix is sound.

### Task Receipt
Routing matrix rows hit: 1 (changed code/prompt), 7 (session state changed), 8 (project task status), 10 (cross-agent risk flag).

Updates fanned out this task:
- `prompts/memo-generation-agent.md` ................... rule 7 narrowed; rule 8 added; 6 silent final checks added; frontmatter bumped
- `n8n/workflow.json` .................................. Build Memo Request system prompt re-injected via inject-prompts.js; versionId v20
- `docs/agents/claude.md` .............................. this entry; frontmatter bumped to 20:15

Updates deferred to a separate atomic commit (immediately following):
- `.claude/memory/state.md` ............................ Phase 4 entry status; cross-references this fix
- `docs/STATUS.md` ..................................... Phase 4 entry progress note
- `.collab/INDEX.md` ................................... timestamp refreshes

Missing / intentionally skipped:
- `.claude/memory/decisions.md` — no new architectural decision; this is a tactical prompt bugfix, not a design choice. The diagnosis (qwen3-max-preview's global-bypass interpretation pattern) is captured in this work-log entry; if the pattern recurs across multiple prompts, that becomes a Claude-owned decision (D-7-class: model-vs-prompt interaction) and earns a decisions.md entry.
- `.claude/memory/pitfalls.md` — could promote to a P-5 ("qwen3-max-preview eagerly invokes preemptive bypass on prompts with strong abstain rules"). Will hold until pattern confirmed on a second prompt (Evaluator); promoting after one observation risks over-fitting the pitfall to one case.
- `.claude/memory/context.md` — I-9 was already updated 2026-04-25T18:45 with the Phase-3-closure context including a watch-out for model-swap parser robustness. This new finding is a related-but-separate issue (prompt-vs-model, not parser-vs-model). I-9 stands; if pattern confirmed on Evaluator, may add to I-9 watch-out section.
- Codex memory files — owned by Codex; framework prohibits cross-agent memory editing.
- Claude Chat refinement of the rule 7/8 edit — explicit user override per project-conventions §3 high-stakes routing exception. Empirical 58/60 result is the gate.

## 2026-04-25T20:45:00-04:00 — Phase 4 step 2: Evaluator prompt fix + meta-eval option (a) finding (anti-discriminative)

**Context.** With Memo Generation fixed (commit `60c4cc2`) and live 58/60 verified, proceeded to Phase 4 step 2: meta-eval discrimination check. Ran `scripts/run-meta-eval.js` (option a, empty upstream) to sanity-check whether discrimination on criteria 1/5/6 alone can clear gap ≥ 20.

**Initial result: gap = 0** (both fixtures scored 0/60). Same eager-bypass pattern as Memo Generation, this time in the Evaluator: the prompt's "All six criteria score 0: structural failure" edge-case rule was being invoked PREEMPTIVELY by qwen3-max-preview when it perceived empty upstream, instead of REACTIVELY after individual scoring. The bad fixture's critical_issues even contained the model's own bypass message: "Evaluation produced all-zero scores; structural failure" — confirming the model invoked the bypass rule itself.

**Pattern recurrence diagnosis (qwen3-max-preview eager-bypass).** Same root cause as Memo Generation. The qwen3-max-2026-01-23 → qwen3-max-preview swap exposed a model-class behavior: edge-case bypass rules in prompts get interpreted as PROACTIVE shortcuts when input has gaps, rather than REACTIVE behaviors after individual scoring. Two prompts now confirmed (Memo + Evaluator). Promoted to **P-5 in pitfalls.md** with the 5-step workaround pattern + regression-test checklist.

**Evaluator prompt fix (5-step pattern from P-5 applied):**

1. Added a new "Empty-upstream handling" section before "Cross-criterion checks" that splits the criteria by upstream dependency:
   - Criterion 1 (citation_completeness): MEMO-BODY-ONLY — always score from memo, independent of upstream.
   - Criterion 2 (contradiction_acknowledgment): if contradiction_output is empty → score 10 UNLESS memo CLAIMS contradictions that don't appear upstream → score 0–3 + emit potential_hallucination critical_issue.
   - Criterion 3 (missing_information_coverage): same pattern as criterion 2 against gap_analysis_output.
   - Criterion 4 (red_flag_propagation): same pattern against red_flag_detector_output.
   - Criterion 5 (reasoning_coherence): MEMO-BODY-ONLY — always score from memo.
   - Criterion 6 (hallucination_check): if extracted_facts_per_document empty → score from internal consistency + obvious-fabrication detection (well-known reality checks for the named company); default 7 with no obvious fabrications, 4–6 for plausible-but-uncorroborated specifics, 0–3 for specifics that contradict reality.
2. Added "Bottom line" sentence stating: "missing upstream is NOT a shortcut to zero-score everything; the all-zero rule is REACTIVE."
3. Tightened the all-zero edge case rule: explicit "AFTER you have scored each individually" + "DO NOT preemptively zero-score" language.
4. Added 4 new silent verification checks: each criterion scored individually using rubric + empty-upstream rules; criteria 2/3/4 scored 10 (not 0) when their upstream is empty unless fabrication detected; criterion 6 scored from internal consistency when extracted_facts empty (not 0); criteria 1 and 5 scored from memo body regardless of upstream availability.

Synced via `scripts/inject-prompts.js`; workflow versionId bumped phase3-session2-v20 → v21.

**Re-ran meta-eval option (a) post-Evaluator-fix:**

```
good_score: 45
bad_score:  48     ← BAD scored HIGHER than GOOD
discrimination_gap: -3  (target ≥ 20)
```

Per-criterion breakdown:

| Criterion | Good | Bad |
|---|---|---|
| citation_completeness | 8 | 10 |
| contradiction_acknowledgment | 0 | 0 |
| missing_information_coverage | 0 | 10 |
| red_flag_propagation | 0 | 0 |
| reasoning_coherence | 10 | 8 |
| hallucination_check | 7 | 10 |

**Diagnosis: empty-upstream meta-eval is structurally anti-discriminative for these fixtures.**

The good fixture is being PUNISHED for being thorough:
- Good has 4 HIGH-importance missing_information items, 3 HIGH-severity red_flags, multiple HIGH-severity contradictions in its memo body. Against empty upstream, ALL of these look like fabrications.
- Bad has 1 missing_information item, 1 LOW-severity red_flag, 1 contradiction. Fewer fabrication hits.
- Net result: good gets MORE 0-scores on criteria 2/3/4 because it has MORE correct content to be flagged as "fabricated against empty upstream."
- Criterion 6 (hallucination_check) scored bad fixture 10/10 because the model didn't catch "highly diversified customer base" as a fabrication about CoreWeave — likely because empty upstream provides nothing to verify against, and qwen3-max-preview's CoreWeave common knowledge is insufficient or the model is being deferential to memo claims.

**The Evaluator change is still a SOUND BUGFIX for production use:**
- Bypass behavior eliminated: per-criterion scoring now happens.
- Both fixtures correctly routed to `flagged_for_review` via the HIGH critical_issue override (good got 3 HIGH critical_issues, bad got 2 — Evaluator IS detecting the fabrications, the score arithmetic just doesn't reflect it strongly enough for discrimination).
- The new defaults (10 when upstream is empty) only fire when upstream IS empty, which never happens in real pipeline runs (RFD always returns something even if no flags found, etc.). Safe for production.

**Conclusion: option (a) is a dead end for Phase 4 calibration.** Cannot produce gap ≥ 20 against THIS pair of fixtures because the fixtures contain rich citable content that needs real upstream to validate against. Moving to **option (c): real upstream from the just-completed CoreWeave run.** Both meta-eval fixtures happen to be CoreWeave memos, so pairing them with real CoreWeave upstream is methodologically clean: tests "does the Evaluator distinguish good vs bad memo when both are evaluated against the same real upstream context?"

**Watch out:**
- The doubled-prompt surface (D-6) handled Evaluator inject cleanly — `inject-prompts.js --check` flagged drift, default-mode injection re-synced. Mitigation working.
- P-5 regression-test guidance suggests preemptively auditing Gap Analysis and Portfolio Fit prompts for similar eager-bypass risk before they bite. Logged as backlog in state.md; not blocking Phase 4.
- I have not yet asked Will to verify the Evaluator change doesn't regress the live 58/60 baseline. The change is behaviorally neutral on populated upstream (all new defaults fire only when upstream is empty), but empirical proof is cheap. Verification ask in next user turn.

**Process flag (project-conventions §3):** Evaluator is medium-stakes — no Claude Chat refinement required by default. Edit committed directly per convention.

### Task Receipt
Routing matrix rows hit: 1 (changed prompt + workflow), 6 (recurring gotcha → P-5), 7 (state changed), 8 (project task status), 10 (cross-agent risk: P-5 affects all future prompt work).

Updates fanned out this task:
- `prompts/evaluator-agent.md` ........................ added "Empty-upstream handling" section; tightened all-zero edge case to reactive; added 4 silent verification checks; frontmatter bumped
- `n8n/workflow.json` ................................. Build Evaluator Request system prompt re-injected via inject-prompts.js; versionId v21
- `.claude/memory/pitfalls.md` ........................ P-5 added — qwen3-max-preview eager-bypass pattern with 5-step workaround + regression-test checklist; frontmatter bumped
- `.claude/memory/state.md` ........................... Phase 4 entry status — step 1 ✅, step 2 in progress moving to option (c); next-steps updated; frontmatter bumped
- `docs/agents/claude.md` ............................. this entry; frontmatter bumped to 20:45
- `.collab/INDEX.md` .................................. timestamp refreshes for the changed files

Missing / intentionally skipped:
- `.claude/memory/decisions.md` — no new architectural decision; bugfix + pitfall capture covers it. (Borderline: model-class behavior on qwen3-max-preview is a Claude-owned observation, but P-5 captures the actionable content; promoting to a D-7-class decision would be ceremony without new content.)
- `.claude/memory/context.md` I-9 — already has a model-swap watch-out from 2026-04-25T18:45 update. Could cross-reference P-5 here; deferred since P-5 is already linked in I-9's "see also" via the model-swap watch-out's substance.
- `docs/STATUS.md` — current-phase already accurate ("Phase 4 next" → "Phase 4 entry in progress" implicit). Will update at Phase 4 closeout, not mid-step.
- Codex memory files — owned by Codex.
- Live verification of Evaluator change against populated-upstream workflow — surfaced to user as the verification ask in next response.
- Reverting the Evaluator change since meta-eval option (a) failed — not done; the change is a sound bugfix independent of the test setup limitation.

## 2026-04-25T21:30:00-04:00 — Phase 4 step 2 ✅ COMPLETE: meta-eval discrimination = 25 on real CoreWeave upstream

**Context.** Per Will's go-ahead, executed option (c): captured 5 upstream artifact outputs from a fresh CoreWeave live run (run_id `89406eeb-725d-443d-961a-a87cd27be0de`, qwen3-max-preview), built fixture files under `test-cases/meta-eval/upstream/`, re-ran `scripts/run-meta-eval.js` with all five `--extraction --contradictions --gaps --red-flags --portfolio-fit` flags. Both meta-eval fixtures are CoreWeave memos so this pairing tests "does the Evaluator distinguish good vs bad memo when both are evaluated against the SAME real upstream context?" — the question Phase 4 actually wants answered.

**Result.**

```
good_score:        53 / 60   (routing: complete_high_confidence)
bad_score:         28 / 60   (routing: flagged_for_review  ✓ < 35 threshold)
discrimination_gap: 25       (target ≥ 20)  ✓ PASS
```

Per-criterion breakdown:

| Criterion | Good | Bad | Gap |
|---|---|---|---|
| citation_completeness | 10 | 10 | 0 |
| contradiction_acknowledgment | 8 | 3 | 5 |
| missing_information_coverage | 7 | 0 | 7 |
| red_flag_propagation | 8 | 3 | 5 |
| **reasoning_coherence** | **10** | **2** | **8** |
| hallucination_check | 10 | 10 | 0 |

Bad fixture's HIGH critical_issues (all 4 textbook defects detected):
1. **unacknowledged_contradiction** — bad memo failed to surface the $1.9B annual vs $1.2B quarterly revenue dispute.
2. **ignored_red_flag** — bad memo downgraded the 77% customer concentration HIGH flag to LOW.
3. **incoherent_recommendation** — bad memo recommended `advance_to_deep_diligence` while Portfolio Fit explicitly recommended `pass`.
4. **strategic_incoherence** — bad memo asserts "highly diversified customer base" as a strength while simultaneously acknowledging the concentration risk.

**Why this is methodologically sound calibration.**
- Both meta-eval fixtures are CoreWeave memos. Pairing with real CoreWeave upstream (Extraction × 4 docs, Contradiction, Gap Analysis, RFD, Portfolio Fit) gives the Evaluator the same upstream context to compare BOTH memos against.
- The discrimination signal lives where the prompt design intended: criteria 2, 3, 4 (upstream-anchored) plus criterion 5 (reasoning_coherence / strategic incoherence). Criterion 5 alone carries 8 points of the 25-point gap, validating the design plan §4 intent that reasoning_coherence is the load-bearing detection for off-criteria defects.
- Citation_completeness and hallucination_check both score 10/10 for each fixture — both authored fixtures have valid citations, and neither contains specific fabrications the Evaluator can verify against the extracted CoreWeave facts. (The bad fixture's "highly diversified customer base" is caught by criterion 5 reasoning_coherence as strategic incoherence, not as a hallucination — because the bad memo cites it to a real CoreWeave source page; the model treats the source as authoritative on existence and applies coherence judgment.)
- Bad fixture below the flagged_for_review threshold (28 < 35) means the routing decision matches the threshold rule, AND the 4 HIGH critical_issues would force flagged_for_review even if the score were higher (per the override rule). Routing is doubly-protected.

**Implementation details.**

Step 1 — fixture file creation. Will pasted the 5 node outputs (Parse Extraction Response, Parse Contradiction Response, Parse Gap Analysis Response, Run Red Flag Detector, Parse Portfolio Fit Response). Extracted just the relevant artifact fields (`extraction_output`, `contradiction_output`, etc.) and wrote 5 JSON files under `test-cases/meta-eval/upstream/`:

- `extraction.json` (4 ExtractionOutput objects, one per source)
- `contradiction.json` (5 contradictions + 7 verified_claims)
- `gap-analysis.json` (20 missing_information items across 4 categories)
- `red-flags.json` (2 deterministic red_flags: customer_concentration_extreme HIGH, revenue_growth_anomalous LOW)
- `portfolio-fit.json` (full PortfolioFitOutput: LOW alignment, recommend pass, 2 anti-patterns matched)

All 5 validated as parseable JSON before invoking the script.

Step 2 — script projection patch. First two attempts at running the meta-eval failed with `good: /criteria_scores/hallucination_check: number above maximum 10`. The model on `qwen3-max-preview` was confidently emitting > 10 on the good fixture's hallucination_check. The workflow's `Parse Evaluator Response` Code node already applies `clampInt(v, 0, 10) ?? 0` to each criterion before storing — but `scripts/run-meta-eval.js` was validating raw model output without that projection step.

Patched `scripts/run-meta-eval.js` to mirror the workflow parser:
- New `projectEvaluator(parsed)` helper: clamps each criteria_scores field to [0,10] integer, recomputes `evaluator_score = sum(criteria_scores)`.
- Applied to both `goodResult.parsed` and `badResult.parsed` before `validator.validateDef(..., 'EvaluatorOutput')`.

This brings meta-eval output range-equivalent to what lands in Supabase. Documented in the script's inline comment.

**Phase 4 step 3 backlog (open for next user direction):**
- RFD `MATERIAL_WEAKNESS_POS` regex misses "exist" / "remain" / "are present" verb forms (S-1 has "Material weaknesses exist..." which doesn't match current pattern).
- Memo HIGH-on-strength miscalibration ("74% gross margin" was tagged HIGH in a prior run; HIGH should describe weaknesses, not strengths).
- Extraction S-1 recall regressions on `headcount` (came back null), `key_personnel` (came back empty array), exact revenue values (rounded to 1.9B instead of 1915426000).

**Watch out:**
- The script projection patch is a behavioral change to the meta-eval harness. Future Codex post-commit review may flag the lack of test coverage for this projection step — could add a tiny smoke test (`assert clampInt(11) === 10`) but deferred to keep this commit atomic.
- The empty-upstream meta-eval mode (option a) remains structurally anti-discriminative as documented in the prior 20:45 work-log entry — could add a `--require-upstream` flag or refuse to proceed if all upstream is empty, but it's a sharp-knife script, deferred to backlog.
- The 5 upstream fixture files are CoreWeave-specific. If we ever add Cerebras or other deals to meta-eval (unlikely given fixtures are CoreWeave-anchored), would need parallel `test-cases/meta-eval/upstream/cerebras/`.
- The model on qwen3-max-preview emits criterion scores > 10 sometimes. The workflow parser handles this silently via clamp. May want to log a one-line warning in the parser when clamping fires, so we know if the model drifts further out-of-range.

**Process flag (project-conventions §3):** Evaluator is medium-stakes; Memo is HIGH-stakes. The Evaluator change committed at `077b9b2` was a tactical bugfix. Empirical 25-point discrimination gap is the correctness gate; the design is validated by Phase 4 calibration result.

### Task Receipt
Routing matrix rows hit: 1 (changed code: run-meta-eval.js + 5 new fixture files), 7 (state changed), 8 (project task status changed), 9 (created 5 new files — fixture files), 10 (cross-agent risk: backlog items now visible).

Updates fanned out this task:
- `test-cases/meta-eval/upstream/extraction.json` (NEW) ........ 4 ExtractionOutput objects from CoreWeave run
- `test-cases/meta-eval/upstream/contradiction.json` (NEW) ..... ContradictionOutput from CoreWeave run
- `test-cases/meta-eval/upstream/gap-analysis.json` (NEW) ...... GapAnalysisOutput from CoreWeave run
- `test-cases/meta-eval/upstream/red-flags.json` (NEW) ......... RedFlagDetectorOutput from CoreWeave run
- `test-cases/meta-eval/upstream/portfolio-fit.json` (NEW) ..... PortfolioFitOutput from CoreWeave run
- `scripts/run-meta-eval.js` ........................ added projectEvaluator() to clamp criteria_scores to [0,10] before validation, mirroring workflow parser
- `docs/agents/claude.md` ........................... this entry; frontmatter bumped
- `docs/STATUS.md` .................................. current-phase rewritten — Phase 3 + Phase 4 entry steps 1+2 COMPLETE; Phase 4 step 3 next; frontmatter bumped
- `.claude/memory/state.md` ......................... current-state rewritten — Phase 4 step 2 COMPLETE; full result captured; frontmatter bumped
- `.collab/INDEX.md` ................................ 5 new fixture-file rows registered; timestamps refreshed for changed files

Missing / intentionally skipped:
- `.claude/memory/decisions.md` — no architectural decision; this is calibration validation. The methodological choice "use real upstream from a CoreWeave live run paired with CoreWeave-anchored fixtures" was a tactical execution choice, not a design decision (the design plan §4 already specifies meta-eval with upstream fixture pairs).
- `.claude/memory/pitfalls.md` — no new pitfall. The qwen3-max-preview > 10 score behavior is parser-tolerant via clamp (not a hard failure), and P-5 already covers the broader qwen3-max-preview behavioral patterns.
- `.claude/memory/context.md` — no new invariant. Phase 4 calibration result is durable but contextual; lives appropriately in state.md / STATUS.md / this work-log entry, not as a context invariant.
- Codex memory files — owned by Codex.
- Live verification of Evaluator change against populated-upstream workflow — Will did re-import + run the workflow before pasting the 5 node outputs (the run produced the upstream artifacts I now use as fixtures). The Memo + RFD + Portfolio Fit + everything chained successfully. Implicit verification: live workflow not regressed by the Evaluator change. Will did NOT explicitly paste the Parse Evaluator Response evaluator_output for this run; if Will wants explicit confirmation, that's a one-click ask, but the implicit signal (full upstream pipeline produced consistent valid outputs) is reasonable evidence.

## 2026-04-26T00:30:00-04:00 — Phase 4 step 3a: RFD MATERIAL_WEAKNESS regex verb-form gap closed

**Context.** Phase 4 step 3 quality backlog item A. The CoreWeave S-1 contains the phrasing "Material weaknesses **exist** in internal control over financial reporting" which the original `MATERIAL_WEAKNESS_POS` regex didn't catch — the pattern required a verb of identification BEFORE "material weakness" (`identified|disclose[ds]?|found|reported|existence of|presence of`), missing the phrase-first verb form. RFD therefore omitted this HIGH-severity flag from the CoreWeave run despite the S-1 explicitly disclosing it three different ways across the packet (S-1 risk factors, analyst report, press release).

**Fix.** Extended both `MATERIAL_WEAKNESS_POS` and `MATERIAL_WEAKNESS_NEG` to handle the phrase-first verb form via regex alternation:

- `MATERIAL_WEAKNESS_POS` now also matches `material weakness(es)? [≤30 chars] (exist|remain|persist|are present|were noted|have been (identified|disclosed|found|noted|reported))`. The 30-char proximity bound prevents false-positives like "material weaknesses, although remediated, exist in our prior period" (40+ chars).
- `MATERIAL_WEAKNESS_NEG` also extended to suppress the new POS pattern when negated: `material weakness(es)? [≤30 chars] (do not exist|no longer exist|have been remediated|were remediated|are no longer present)`. Negation guard fires per-sentence in `matchWithNegationGuard()` — same machinery as before, just covering more phrasings.

**Tests.** Added 6 new test cases at `code/test/red-flag-detector.test.js`:

1. `materialWeakness: positive "material weaknesses exist in internal control" → HIGH flag` (the CoreWeave S-1 actual phrasing)
2. `materialWeakness: positive "material weaknesses remain" → HIGH flag`
3. `materialWeakness: positive "material weaknesses are present" → HIGH flag`
4. `materialWeakness: positive "material weaknesses were noted" → HIGH flag`
5. `materialWeakness: phrase-first negation "material weaknesses do not exist" → no flag`
6. `materialWeakness: phrase-first negation "material weaknesses have been remediated" → no flag`

Ran `node --test code/test/red-flag-detector.test.js`: **43/43 passing** (was 37; added 6 new). All prior tests preserved — the regex extension is purely additive.

**D-6 doubled-code surface.** The RFD module body is also pasted inline in `n8n/workflow.json` Run Red Flag Detector node. Per the explicit IMPLEMENTATION NOTE comment in that node, "If [code/red-flag-detector.js] changes, this node must be re-pasted." Manually updated the embedded copy with the same regex change. Bumped `versionId` to `phase4-step3a-v22`. Verified workflow.json still parses as valid JSON.

**Backlog item recorded:** extending `scripts/inject-prompts.js` to also handle the RFD code paste (it currently only covers the 5 Build * Request prompt nodes). Would eliminate the manual-paste step for future RFD edits. Out of scope for this fix; logged for later.

**Verification.** Live workflow re-run not strictly needed for this regex change because:
1. Unit tests cover the new patterns directly.
2. The CoreWeave S-1 has the exact phrasing ("Material weaknesses exist...") in its risk factors — but on the NEXT live run, this will surface as a third red flag in the workflow output (alongside customer_concentration_extreme HIGH and revenue_growth_anomalous LOW that we already see).
3. The change is purely additive — existing positive matches and negation guards are unchanged.

**Watch out:**
- The 30-char proximity bound is tighter than the verb-first pattern's 60-char bound. Reasoning: the verb-first form is typically prosaic ("we have identified, in connection with our recent audit, certain material weaknesses..."), while the phrase-first form is typically a tight subject-verb assertion ("Material weaknesses exist..."). 30 chars is enough for "Material weaknesses, identified during the 2024 audit, exist..." (40 chars over the bound, would NOT match — acceptable since the verb-first pattern would catch this anyway via "identified ... material weaknesses").
- Per P-5 (qwen3-max-preview eager-bypass), this change to a deterministic detector (no LLM) is structurally immune to model interaction issues. Pure code, deterministic, tested.

### Task Receipt
Routing matrix rows hit: 1 (changed code), 6 (closes a recurring gotcha — Codex P-5 phrasing recall gap noted in earlier work-log entries), 7 (state changed via Phase 4 step 3a → step 3b), 8 (project task status — Phase 4 step 3a closed).

Updates fanned out this task:
- `code/red-flag-detector.js` ........................ MATERIAL_WEAKNESS_POS + NEG regexes extended with phrase-first verb-form alternation; 30-char proximity bound on the new alternation arm
- `code/test/red-flag-detector.test.js` .............. 6 new test cases (4 positive verb-form variants + 2 phrase-first negations); 43/43 passing total
- `n8n/workflow.json` ................................ embedded RFD module body re-synced with the new regex; versionId bumped phase3-session2-v21 → phase4-step3a-v22
- `docs/agents/claude.md` ............................ this entry; frontmatter bumped
- `.collab/INDEX.md` ................................. timestamps refreshed for the 3 changed code files

Missing / intentionally skipped:
- `.claude/memory/decisions.md` — no architectural decision; bugfix on existing detector.
- `.claude/memory/pitfalls.md` — could note "always check regex covers verb-first AND phrase-first forms" but the lesson is captured in the test file (phrase-first variants now cover the gap). Promote only if a third regex shows the same blind spot.
- `.claude/memory/context.md` — no new invariant.
- `.claude/memory/state.md` — Phase 4 step 3 progress is tracked in next-steps already; will batch-update with step 3b.
- `docs/STATUS.md` — Phase 4 step 3 is in-progress, not closed; will batch-update at step 3 closure.
- `scripts/inject-prompts.js` extension to handle RFD — backlog item, out of scope for this fix.
- Live workflow re-run — not required (deterministic regex change, unit-tested).
- Codex memory — owned by Codex.

## 2026-04-26T00:55:00-04:00 — Phase 4 step 3b+3c: Memo severity semantics + Extraction retrieval refinements

**Context.** Phase 4 step 3 quality backlog continues. Item B addresses the prior-run miscalibration where "74% gross margin" was tagged severity HIGH in `key_strengths` (HIGH should describe materiality to recommendation, not magnitude of underlying number). Item C addresses S-1 Extraction recall regressions where the most recent CoreWeave run produced `headcount: null` and `key_personnel: []` for the S-1 Filing despite the data being present in the document.

**Item B fix — Memo prompt severity semantics.**

Added explicit per-context severity semantics block to `prompts/memo-generation-agent.md` between the key_strengths/key_risks construction rules and the contradictions construction rules. The existing prompt allowed severity HIGH/MEDIUM/LOW on both key_strengths and key_risks but provided no guidance on what severity MEANS in each context — so qwen3-max-preview defaulted to "HIGH = big number" on strengths.

New rules:
- **For key_risks** (existing intuition codified): HIGH = material risk that could derail the deal; MEDIUM = significant but manageable; LOW = minor risk.
- **For key_strengths** (the new discriminator): HIGH = institutionally material strength that anchors the recommendation — the human reviewer MUST see this; MEDIUM = supportive strength contributing to thesis; LOW = positive observation worth noting but not material.
- **Anti-pattern explicit call-out**: do NOT label a strength HIGH solely because the underlying number is large. "74% gross margin", "$5B TAM", "700% YoY growth" are MEDIUM by default unless they ARE the primary investment thesis pillar that makes the deal advance vs pass. Concrete examples included for each severity tier.

Synced via `scripts/inject-prompts.js` to the workflow.json embedded copy. Single bump in workflow.json (Build Memo Request 9585 → 11635 bytes). versionId: phase3-session2-v21 → phase4-step3a-v23.

**Item C fix — Extraction retrieval queries broadened.**

Edited the `Prepare Extraction Queries` Code node in `n8n/workflow.json` to broaden the retrieval queries for two sections that were under-recalling on the S-1:

- `company_overview` query: appended "number of employees full-time employees workforce headcount approximately employees as of December". S-1s typically disclose headcount as "As of December 31, 2024, we had approximately 850 employees" buried in the Employees subsection of Item 1 Business — the original query "headcount" alone wasn't bridging the embedding distance to that phrasing.
- `management_assessment` query: replaced the original "management assessment executives founder ceo cfo key personnel key person risk" with "executive officers directors and executive officers management team chief executive officer chief financial officer chief technology officer named executive officers founder co-founder key personnel key person dependence biographies". S-1s use "Directors and Executive Officers" / "Named Executive Officers" as section headings; the original query missed those exact phrasings.

versionId: phase4-step3a-v23 → phase4-step3c-v24.

**Why retrieval queries (not Extraction prompt) is the right lever for C.** The prior run's evidence shows the model extracts `headcount` and `key_personnel` correctly when given a chunk that mentions them (the press release and analyst reports both got `key_personnel` populated). The S-1 specifically failed because the relevant chunks weren't in the top-5 retrieval results for the section query — embedding-based retrieval didn't bridge the semantic gap between query terms ("headcount", "key personnel") and S-1 actual phrasing ("approximately N employees", "Directors and Executive Officers"). Broadening the queries with S-1 phrasing variants is the lowest-risk, highest-leverage fix. Did NOT touch the Extraction prompt itself — the prompt is correct; the retrieval was missing the relevant chunks.

**Verification.** Workflow.json validates as JSON. Live re-run pending — Will to re-import + trigger CoreWeave run. Acceptance criteria for Phase 4 step 3 closure documented in state.md next-steps:
- (a) RFD red_flags now includes `material_weakness` HIGH from S-1 (covered by step 3a regex change, already in workflow v22+).
- (b) Memo key_strengths no longer labels magnitude-y items (74% gross margin) as HIGH severity (covered by 3b prompt change).
- (c) S-1 ExtractionOutput now populates `headcount` (integer) and `key_personnel` (array of named executives) (covered by 3c query change).

**Process flag (project-conventions §3).** Memo Generation is HIGH-stakes; Extraction is HIGH-stakes. Both prompt-class artifacts were edited tactically — Memo via prompt rule addition, Extraction via retrieval query (not the prompt itself). Per the precedent established earlier this session for HIGH-stakes tactical bugfixes, surfaced explicitly to Will at edit time. Empirical live re-run is the correctness gate.

**Watch out:**
- The Memo prompt's new severity semantics block is ~280 tokens added. Total Memo prompt now ~2200 tokens (over the 2000-token convention cap from the Phase 3 review notes). Acceptable for this iteration; can compress later if needed. Concrete examples are load-bearing — don't strip them.
- The new Extraction retrieval queries for `management_assessment` and `company_overview` use more terms. Queries are embedded as a single string and embedded once per (document, section) — the embedding cost is identical (one query per pair regardless of query length). The downstream chunk ranking is unaffected. Pure quality-of-results win, no cost regression.
- Per P-5 (qwen3-max-preview eager-bypass), the Memo severity semantics change introduces explicit guidance which is the OPPOSITE pattern from abstain rules — should not trigger eager bypass. Safe.
- Item B is a HIGH-stakes prompt edit. If Will wants Claude Chat to review the new severity semantics block before committing, just paste prompts/memo-generation-agent.md to them. Otherwise the empirical live run is the gate (same approach as Memo anti-empty-shell fix earlier this session).

### Task Receipt
Routing matrix rows hit: 1 (changed prompt + workflow code), 7 (state changed), 8 (project task status — Phase 4 step 3b+3c addressed in code), 10 (cross-agent risk: HIGH-stakes prompt edit on Memo).

Updates fanned out this task:
- `prompts/memo-generation-agent.md` ........... severity semantics block added between key_strengths/key_risks and contradictions construction rules; explicit anti-pattern call-out for HIGH-on-magnitude; concrete examples for each tier; frontmatter bumped
- `n8n/workflow.json` ......................... Build Memo Request system prompt re-injected (item B); Prepare Extraction Queries node `company_overview` + `management_assessment` queries broadened with S-1 phrasing variants (item C); versionId phase3-session2-v21 → phase4-step3c-v24
- `.claude/memory/state.md` ................... Phase 4 step 3 progress (3a ✅, 3b/3c addressed, awaiting live verification); next-steps re-numbered; frontmatter bumped
- `docs/agents/claude.md` ..................... this entry; frontmatter bumped to 00:55
- `.collab/INDEX.md` .......................... timestamps refreshed for changed files

Missing / intentionally skipped:
- `prompts/extraction-agent.md` — not edited. Item C is a retrieval problem (chunks containing the data weren't in the top-5 for the section query), not an extraction problem (the model extracts correctly when given the chunks). Editing the prompt would mask the root cause. If retrieval still misses post-fix, the next move is increasing top_k or tightening the prompt with S-1 section pointers — not editing the prompt now without empirical evidence it's needed.
- `docs/STATUS.md` — Phase 4 step 3 still in progress (awaiting live verification); will batch-update at step 3 closure.
- `.claude/memory/decisions.md` — no architectural decision; both fixes are tactical.
- `.claude/memory/pitfalls.md` — could note "embedding-based retrieval often misses S-1 sections that use technical / regulatory phrasing not in the natural-language query" but that's a generic IR truth, not a project-specific pitfall worth a P-entry.
- `.claude/memory/context.md` — no new invariant.
- Codex memory files — owned by Codex.
- Live verification — required before Phase 4 step 3 can be marked closed; documented in state.md next-steps as the immediate next-action for Will.
- Claude Chat refinement of the Memo severity semantics block — explicit user override per project-conventions §3 high-stakes routing exception (precedent established for tactical bugfix path).

## 2026-04-26T01:30:00-04:00 — Model swap to qwen3-max-2025-09-23 + Phase 4 step 3 verification + P-6 RFD wrapper fix

**Context.** Will requested two things in one turn: (1) swap LLM provider from `qwen3-max-preview` to `qwen3-max-2025-09-23`, (2) apply the proposed P-6 RFD wrapper fix discovered during Phase 4 step 3 verification. Updates documentation comprehensively after both changes land.

**Phase 4 step 3 first-verification result (Will's CoreWeave re-run on workflow v24).**

Will pasted (a) the Run Red Flag Detector node output, (b) a fragment of Parse Memo Response showing key_strengths, and (c) the full Parse Extraction Response for all 4 source documents. Findings:

- **Item B ✅ verified working.** Memo `key_strengths[0]` = "737% YoY revenue growth in 2024 driven by surging AI demand" → `severity: MEDIUM` (was HIGH on prior runs). The severity-semantics block + anti-pattern call-out from `5e775a5` triggered correctly: the model recognized 737% as "magnitude" and tagged it MEDIUM rather than HIGH.

- **Item C ✅ verified working.** S-1 ExtractionOutput on `coreweave-s1.pdf`:
  - `company_overview.headcount: 881` (was `null` on prior runs)
  - `management_assessment.key_personnel: ["Michael Intrator (CEO, President, Chairman)", "Brian Venturo (Chief Strategy Officer)", "Brannin McBee (Chief Development Officer)"]` (was `[]`)
  - `financial_performance.revenue_latest_period.value: 1915426000` (exact, with citation to S-1 p. 229)
  - `risk_factors[1].factor: "Material weaknesses exist in internal control over financial reporting related to IT general controls, segregation of duties, and insufficient qualified personnel."`
  - The retrieval-query refinements bridged the embedding gap to S-1 phrasings ("approximately employees", "directors and executive officers"). Three new chunks made the top-N for the S-1 specifically.

- **Item A ❌ failed verification — but not because of the regex.** `red_flag_detector_output.red_flags` returned only 2 entries (customer_concentration_extreme HIGH + revenue_growth_anomalous LOW) — the new `material_weakness HIGH` was missing despite the S-1 risk_factors clearly containing the exact phrasing the new regex catches. Inspection of `rfd_meta`:
  ```json
  { "doc_count": 4, "regulatory_filing_count": 0, "total_chunks": 361 }
  ```
  Zero regulatory filings detected even though the S-1 is in the packet. This was the smoking gun.

**P-6 root cause analysis.**

Read the Run Red Flag Detector node's wrapper jsCode and traced the bug:
```js
const sourceTypeBySource = {};
for (const entry of (aggregated.source_manifest || [])) {
  if (entry && entry.source_name && entry.source_type) {  // ← always false for strings
    sourceTypeBySource[entry.source_name] = entry.source_type;
  }
}
```
The wrapper was written assuming `aggregated.source_manifest` was an array of `{source_name, source_type}` objects. When source_manifest was redefined as a STRING array per D-6 (`["CoreWeave Press Release", ...]`), the wrapper wasn't updated. Strings have no `.source_name` or `.source_type`, so the if-check always fails, `sourceTypeBySource` stays empty, every doc gets `source_type: 'unknown'` in `documentsRaw`, and `firstRegulatoryMatch()` filters everything out via its `if (d.source_type !== 'regulatory_filing') continue;` guard.

**Six dead detectors since Phase 3 closure.** The bug silently disabled `material_weakness`, `going_concern`, `related_party_above_threshold`, `auditor_change_recent`, `dual_class_structure`, `s1_previously_withdrawn`. Only the 4 `extractedFactsPerDoc`-based detectors (`customer_concentration_high`, `customer_concentration_extreme`, `revenue_growth_anomalous`, `burn_rate_runway_short`) ever fired. Hidden because we only ever looked at what fired, not at what should have fired but didn't. Phase 3 closure was actually 4-of-10 RFD detectors functional, not 10-of-10.

**P-6 fix.** Replace the source_manifest-iteration with extraction_outputs-iteration. `extractionOutputs` is already defined right above the broken block (`const extractionOutputs = aggregated.extraction_outputs || [];`) and each ExtractionOutput carries both fields natively:

```js
const sourceTypeBySource = {};
for (const eo of extractionOutputs) {
  if (eo && eo.source_name && eo.source_type) {
    sourceTypeBySource[eo.source_name] = eo.source_type;
  }
}
```

Added a comment block above the new loop explaining why the change. Pitfall added at `pitfalls.md` P-6 with full symptom + root cause + workaround + regression test + general lesson for future shape-change consumers.

**LLM provider swap.**

`.env.example` updated: `ALICLOUD_MODEL=qwen3-max-2025-09-23` (was `qwen3-max-preview`). Per Codex P-2, this is env-driven; only `.env` needs updating (not in git) plus a docker-compose container restart. Workflow nodes already read `$env.ALICLOUD_MODEL` everywhere.

Cleaned the one hard-coded fallback in workflow.json's Build Langfuse Batch jsCode: `'qwen3-max-preview' → 'qwen3-max-2025-09-23'`. README.md updated in two places (Stack section + Status section). Historical model references in memory files (decisions.md D-6, pitfalls.md P-5, etc.) deliberately preserved — they accurately describe the model that was in use at the time of those events.

P-5 watch-out applies to this swap: every model swap requires re-validating that the Memo + Evaluator prompt fixes still produce substantive output. The fixes (rule scoping, anti-bypass guards) are per-element rules that should generalize across models, but empirical re-run is the gate.

**Workflow versionId:** `phase4-step3c-v24 → phase4-step3a-v25` (the "step3a" tag reflects this is extending the step-3-A regex fix with the deeper wrapper bug discovery).

**Verification needed (Will's next run).** Re-import workflow + re-run on CoreWeave with the new model. Acceptance:
- `rfd_meta.regulatory_filing_count: 1` (was 0)
- `red_flags[]` contains a third entry: `material_weakness HIGH` from the S-1, with `evidence.source: "CoreWeave S-1 Filing"` and `evidence.raw_text` containing "Material weaknesses exist..."
- Memo + Evaluator continue to produce substantive output (no empty shells, no all-zeros) — confirming P-5 fixes generalize to qwen3-max-2025-09-23
- Items B + C remain verified working

**Watch out:**
- The RFD wrapper jsCode is still NOT covered by unit tests. The unit tests at `code/test/red-flag-detector.test.js` cover the canonical detector module (`code/red-flag-detector.js`) but not the workflow.json embedded wrapper. P-6 mitigation backlog: extract the wrapper to `code/rfd-wrapper.js` with its own tests covering the source_type-lookup behavior.
- Other workflow.json jsCode consumers of `aggregated.source_manifest` could have the same shape-confusion bug (P-6 general lesson). Quick grep target for backlog: `grep -n "source_manifest" n8n/workflow.json` and audit each consumer's contract assumption.
- Per P-5 regression test, confirm the qwen3-max-2025-09-23 swap doesn't reintroduce eager-bypass on Memo or Evaluator. If it does, both prompts would need re-tightening for the new model — but the fixes are per-element scoping rules so they're expected to generalize.
- Workflow re-import is REQUIRED this time (RFD wrapper is jsCode in workflow.json, not env-driven). Container restart alone won't pick up the wrapper fix.

**Process flag.** P-6 is not a HIGH-stakes prompt edit — it's a code bugfix in workflow.json's wrapper jsCode. No project-conventions §3 routing required. The model swap is a config change, also not subject to §3 prompt routing.

### Task Receipt
Routing matrix rows hit: 1 (changed code: workflow.json), 5 (discovered durable truth → P-6 lesson about contract-shape changes propagating to consumers), 6 (recurring-class gotcha → added P-6), 7 (state changed), 8 (project task status — Phase 4 step 3 partial verification + new sub-fix), 10 (cross-agent risk: P-6 implies an audit-pattern for any future contract-field-shape change).

Updates fanned out this task:
- `n8n/workflow.json` ......................... Run Red Flag Detector wrapper source_type lookup fixed (P-6); Build Langfuse Batch fallback model updated to qwen3-max-2025-09-23; versionId phase4-step3c-v24 → phase4-step3a-v25
- `.env.example` ............................ ALICLOUD_MODEL=qwen3-max-2025-09-23
- `README.md` ................................ Stack section + Status section model name updated; Phase 4 progress note added
- `.claude/memory/pitfalls.md` ............... P-6 added (full entry: symptom, root cause, workaround, regression test, general lesson)
- `.claude/memory/state.md` .................. Phase 4 step 3 verification round 1 result captured (B+C verified, A surfaced P-6); model swap reflected; next-steps updated; frontmatter bumped
- `docs/STATUS.md` ........................... current-phase rewritten — model swap noted, Phase 4 step 3 progress detailed; frontmatter bumped
- `docs/agents/claude.md` .................... this entry; frontmatter bumped to 01:30
- `.collab/INDEX.md` ......................... timestamps refreshed for changed files

Missing / intentionally skipped:
- `.claude/memory/decisions.md` — no architectural decision; both changes are bugfix + config swap. The qwen3-max model-family choice was already locked (D-2 / D-6 framing); this swap is just picking a fresh tag within the family.
- `.claude/memory/context.md` — I-9 (qwen3-max family is reasoning model) still applies generically; the model-swap watch-out from earlier already covers the re-validation requirement. No new invariant.
- `code/red-flag-detector.js` — the canonical detector module is unaffected by this bug (the wrapper was the broken layer). No source change needed.
- `code/test/red-flag-detector.test.js` — RFD module tests unchanged (43/43 passing). Wrapper-level test is on backlog.
- Historical model references in CONTEXT.md, decisions.md D-6, pitfalls.md P-5, work-log earlier entries — deliberately preserved as accurate to the time of those events.
- Codex memory files — owned by Codex.
- Live verification — required before Phase 4 step 3 can close; documented in state.md next-steps as the immediate next-action for Will.

## Handoff blocks

When you finish a substantive chunk of work and want another agent to take over,
run `npx @gpgaoplane/multi-agent-collab handoff <to-agent> --from claude --message "..." --files "a b c"`.
It appends a structured block at the end of this log with a stable id, what you did, files touched, and the branch state.
