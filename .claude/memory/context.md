---
status: active
type: context
owner: claude
last-updated: 2026-04-26T17:00:00-04:00
read-if: "you need durable project truths as understood by Claude"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Durable Context

Project invariants and non-obvious truths that hold across sessions. Cross-references to `CONTEXT.md` (scope, locked decisions) and `DESIGN.md` (component specs) — do not duplicate content from those; link to their sections.

<!-- section:entries:start -->

## I-1 — Human-in-the-loop boundary — 2026-04-24T02:15:00-04:00

The advance-to-deep-diligence decision stays human. The AI produces a directional signal (`pass | pursue | advance_to_deep_diligence`), never a final recommendation. This boundary is immutable — changing it invalidates the submission's governance story. See `CONTEXT.md §5.2`.

## I-2 — Red Flag Detector is deterministic — 2026-04-24T02:15:00-04:00

The Red Flag Detector sub-workflow is implemented in JavaScript and must never call an LLM. No `Math.random`, no time-dependent logic, no model inference. Thresholds and patterns live as named constants. Pure, unit-testable functions. See `CONTEXT.md §5.5` and `DESIGN.md §1.2`.

**Why it matters:** finance AI's primary objection is hallucination risk. Keeping high-stakes pattern matching out of the LLM is the project's architectural-judgment signal.

## I-3 — Citation enforcement is schema-level — 2026-04-24T02:15:00-04:00

Every `risk`, `strength`, and material claim in memo output carries a `sources: []` array. Enforcement lives in `schemas/agent-output-schemas.json`, not in prompt text. Uncitable claims are marked `UNSUPPORTED` and omitted from the memo. See `DESIGN.md §1.3`.

## I-4 — Framework-per-agent specialist pattern — 2026-04-24T02:15:00-04:00

Each LLM agent operates within a named analytical framework (IC Memo Taxonomy, Triangulation, Institutional LP Diligence Checklist, Sagard Thesis Alignment, Six-Criteria Quality Check). Frameworks are encoded in system prompts AND enforced via output schemas. This is the project's primary intellectual differentiator — not "we wired up an LLM," but "each specialist reasons like an institutional investor within a defined framework." See `CONTEXT.md §5.5`.

## I-5 — Workflow JSON is the source of truth — 2026-04-24T02:15:00-04:00

`n8n/workflow.json` is authoritative; the running n8n instance is not. After any UI change, run the export script and commit the diff. Loss of this discipline means the repo drifts from reality and Codex review becomes untrustworthy.

## I-6 — Swappable components — 2026-04-24T02:15:00-04:00

LLM provider, vector store, notification channel, and storage backend are all parameterized via a single `Set` node at workflow start. Swapping Qwen → Claude via Bedrock is a one-variable change. When adding features, do not hard-code provider-specific behavior — route through the `Set` node's variables. See `DESIGN.md §1.7`.

## I-7 — Three-doc planning system is authoritative — 2026-04-24T02:15:00-04:00

`CONTEXT.md` owns scope and locked decisions, `DESIGN.md` owns component behavior, `IMPLEMENTATION.md` owns sequencing. When they conflict: `CONTEXT.md` wins on decisions, `DESIGN.md` wins on behavior, `IMPLEMENTATION.md` wins on order.

**Scope-locked (Claude Chat / Will only, do not modify without approval):**
- `CONTEXT.md §5` (locked decisions) and `§5.10` (decision rationales)
- `DESIGN.md §1` (design philosophy)
- `IMPLEMENTATION.md` phase gate acceptance criteria

**Framework-aligned (Claude Code may update as conventions evolve):**
- `CONTEXT.md §6` (repo structure), `§7` (local setup runbook), `§8` (agent ops), `§11` (progress log — now a strategic journal)
- `IMPLEMENTATION.md §12` (current status) and completed-task checkoffs
- Non-principle sections of `DESIGN.md` that describe component internals

Flag any proposed change to scope-locked sections via `ARCHITECTURAL-CONCERN:` commit prefix and wait for Will.

## I-8 — Cost is NOT the scaling bottleneck — 2026-04-24T03:45:00-04:00

Per-run estimate: ~$0.55–$1.10 (200K+ input + 20K output + 40K embedding tokens at Qwen3.5-Plus rates). At 10× deal volume: ~$10/day. LLM inference cost is linear, small, and not the bottleneck.

**Actual scaling bottlenecks, in order of impact:**

1. **Reviewer throughput.** 10 deals/day × ~30 items each (red flags, contradictions, missing info) = 300 items/day demanding human triage. Review queue UI, priority sorting, team distribution required at 10×.
2. **False-positive fatigue on red flags.** Regex-based detectors fire on boilerplate over volume. Threshold drift and FP-rate monitoring required.
3. **Prompt drift as Sagard's thesis evolves.** Portfolio Fit agent hard-codes thesis pillars. Unstaffed maintenance cost over a year.
4. **Langfuse trace storage.** Free tier 50K observations/month supports ~30 deals/day; paid tier required for sustained 10×.
5. **Audit-trail query layer.** Compliance queries ("all deals flagged on concentration last quarter") demand materialized views or reporting surface not in prototype.

**Why this is a durable truth and not just a plan section:** Phase 6's 250-word submission answers "what breaks first at 10x?" — this invariant sources that answer. If the Evaluator, Memo Generation, or Portfolio Fit prompts later mention scaling, they should reference these five bottlenecks, not "LLM costs scale linearly." Cross-referenced in `docs/plans/2026-04-24-deal-diligence-design.md §5`.

## I-9 — Qwen3-Max family on DashScope is a reasoning model — 2026-04-24T04:15:00-04:00 (revised 2026-04-26T17:00:00-04:00 after Phase 5 closure)

Originally observed on `qwen3.5-plus` via credential sanity-check: a trivial "reply with pong" prompt returned `completion_tokens: 214` of which `reasoning_tokens: 208`. Response shape is `{"content": "<final>", "reasoning_content": "<chain-of-thought>"}`. Behavior carries forward to `qwen3-max-2026-01-23`, `qwen3-max-preview`, and the currently-active `qwen3-max-2025-09-23` — all three models emit `reasoning_content` separately from `content`. Phase 3, 4, and 5 runs confirm.

**Three binding implications, updated against Phase 3 evidence:**

1. **Cost model.** Per-run actuals (CoreWeave, run_id `0efb319c`): Extraction (2 docs) + Contradiction + Gap + Portfolio Fit + Memo + Evaluator ≈ ~200K-300K total tokens at qwen3-max-preview rates. Cost remains under the I-8 estimate; cost is still NOT the #1 bottleneck.

2. **JSON-output parsing.** Risk RESOLVED for the live raw-HTTP topology (per D-6): all chat-completions calls are direct `POST /chat/completions` with `response_format: { type: 'json_object' }`. Parsers read `data.choices[0].message.content` only — `reasoning_content` never reaches the schema-shape projection. The original concern was the n8n AI Agent node's LangChain wrapper potentially concatenating fields; D-6 routed around it. **Re-emerges as risk** if a future specialist is rewired through the AI Agent node — verify the wrapper isolates `content` before trusting schema validation.

3. **Latency.** Per-run wall-clock on a 4-doc CoreWeave packet: ~3-5 minutes total. Within demo budget. The 300s per-node HTTP timeouts (added after a live `ECONNABORTED` at 120s on Extraction) are the operative ceiling.

**Watch-out for model swaps** (history: qwen3-max-2026-01-23 → qwen3-max-preview on 2026-04-25; qwen3-max-preview → qwen3-max-2025-09-23 on 2026-04-26): every swap re-tests the prompt fixes empirically. The qwen3-max-preview swap surfaced two cascading bugs: (a) `evaluator_score: 0` due to the model invoking the Memo prompt's abstain rule globally rather than per-claim (root-caused as P-5 eager-bypass; fixed via per-element scoping in Memo + Evaluator prompts; commit `60c4cc2` + `077b9b2`), (b) parser robustness validated separately. The qwen3-max-2025-09-23 swap was clean — Phase 5 Cerebras run validated that the per-element scoping fixes generalize across the qwen3-max family AND across deal packets. Re-validate parser robustness against any new model's output shape before declaring a swap green; the 5-step P-5 workaround pattern is the operational playbook.

## I-10 — Pipeline is deal-agnostic — 2026-04-26T17:00:00-04:00

Validated empirically across two distinct deal packets without code change:

- **CoreWeave** (dev iteration): 58/60 evaluator score, 17/17 valid citations, 5 red_flags including the post-P-6-fix regulatory-only detectors (`material_weakness` HIGH + `related_party_above_threshold` MEDIUM + `dual_class_structure` LOW from S-1).
- **Cerebras** (Phase 5 generalization): pipeline ran end-to-end with no code changes, producing substantive memo + clean evaluator + 3+ red_flags (`related_party_above_threshold` MEDIUM on OpenAI Warrant + `dual_class_structure` LOW + 1 partial). Cross-source numerical agreement S-1 ↔ Cerebras Analyst Report (#2). Multi-source disambiguation `(#2)` suffix working.

**What this means:**

1. **Prompt fixes are model-class, not deal-class.** P-5 (eager-bypass) corrections in Memo + Evaluator prompts (per-element scoping rules + silent self-revise checks) survived a deal change AND a model swap. The fix design is robust.
2. **Code paths are deal-agnostic.** All 7 specialists' code paths exercised cleanly on Cerebras inputs they had not seen during Phase 4 calibration. No CoreWeave-specific assumptions baked in.
3. **D-6 architecture (hand-rolled aggregate chunk store + raw-HTTP tool-use loops) generalizes.** Both retrieval (section-targeted + union pass) and Contradiction tool-use loop ran cleanly on a different document corpus.

**What it does NOT mean:**

- Generalization to non-AI / non-tech / non-public-filing deals is unverified. The retrieval prompts and Portfolio Fit scoring are tuned for AI/SaaS/hardware deals. A consumer-goods or biotech deal would likely surface tuning gaps.
- The Red Flag Detector's regulatory-only detectors depend on the deal having a regulatory filing (S-1 or equivalent) in the packet. Pre-public deals without an S-1 will exercise only the 4 extraction-based detectors.

**Watch-out for future deal additions:** if quality gaps emerge on a new deal packet (e.g., a Phase 5-style backlog item), apply the Phase 4 step 3 triage pattern (surface gap → propose minimal fix → verify live → commit atomically). Do NOT rewrite prompts wholesale; per-element narrow fixes have proven robust.

<!-- section:entries:end -->
