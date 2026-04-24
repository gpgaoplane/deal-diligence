---
status: active
type: context
owner: claude
last-updated: 2026-04-24T02:30:00-04:00
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

<!-- section:entries:end -->
