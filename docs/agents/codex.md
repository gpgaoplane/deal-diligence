---
status: active
type: work-log
owner: codex
last-updated: 2026-04-25T01:31:21-04:00
read-if: "you need to see Codex's recent work and watch-outs"
skip-if: "status != active or last-updated <= your watermark"
---

# Codex Work Log

## Onboarded: 2026-04-24

**Platform:** Codex
**Adapter file:** .codex/CODEX.md
**First task:** (first entry below)

---

<!-- new entries appended below, newest last -->

## 2026-04-24T21:35:09-04:00 — Full Codex onboarding and project catch-up

**Context.** User asked Codex to fully onboard, inspect the project content, inherit Claude's working context, and leave the repo in a state where we can continue work without a second onboarding pass.

**Action.** Read the repo's collaboration contract (`AGENTS.md`, `AI_AGENTS.md`, `.collab/{INDEX,ROUTING,PROTOCOL,ACTIVE}.md`), Codex adapter + memory files, Claude's current state / context / decisions / pitfalls / work log, the authoritative project docs (`CONTEXT.md`, the refined design + implementation plans, `docs/project-conventions.md`, `docs/STATUS.md`), recent git history, and the live implementation surfaces (`n8n/workflow.json`, `schemas/agent-output-schemas.json`, `schemas/supabase-schema.sql`, `code/json-schema-validator.js`, `code/red-flag-detector.js`, `code/sagard-portfolio.json`, prompt inventory, and the Extraction draft prompt).

**What I learned.**

- Codex is already bootstrapped in this repo; no `join codex` step is needed because the adapter, memory, work log, and `.collab/agents.d/codex.yml` already exist.
- Phase 1 and Phase 2 are fully complete, but the live repo has already moved into Phase 3 despite the previous `docs/STATUS.md` snapshot still saying "ready to begin Phase 3."
- The current workflow is connected through the ingestion spine: Form Trigger, Coordinator, per-document split, PDF extraction, text chunking, embedding request, embedding extraction, and an aggregate retrieval store.
- The implementation is heavily shaped by Claude's documented n8n constraints: Code-node sandbox limitations (P-1 / P-3) and metadata-dropping node behavior (P-4) are real and already encoded into the workflow.
- A meaningful architecture drift exists between shared design wording and live workflow: the workflow's `Aggregate Vector Store` node currently uses a hand-rolled chunk store rather than the plan's original "Simple Vector Store" framing. That needs either formalization or realignment before specialist-agent retrieval work deepens the dependency.

**Watch out:**
- `docs/STATUS.md` was stale relative to the repo. I corrected it in this task so the next agent does not onboard against an outdated phase snapshot.
- The retrieval-store implementation is now the main cross-agent risk. Until it is either documented in the shared design / decisions surface or reverted, treat `n8n/workflow.json` + Claude's recent log / decisions as the most accurate implementation source for retrieval behavior.
- This repo's framework install does not currently include the upstream helper catch-up scripts locally. Future Codex onboarding here should follow the manual `AI_AGENTS.md` flow rather than assuming `collab-catchup.sh` exists.

### Task Receipt
Updates fanned out this task:
- `docs/agents/codex.md` .............................. this onboarding / catch-up entry
- `.codex/memory/state.md` ............................ current branch, resume point, next steps, open questions, read watermark
- `.codex/memory/context.md` .......................... recorded live Phase 3 state, sandbox-shaped implementation truth, and retrieval-store drift
- `.codex/memory/pitfalls.md` ......................... added P-1 (missing local catch-up helper scripts)
- `docs/STATUS.md` .................................... corrected current phase from "Phase 3 up next" to "Phase 3 in progress" and listed the live workflow baseline
- `.collab/ACTIVE.md` ................................. registered Codex presence on `main`
- `.collab/INDEX.md` .................................. refreshed timestamps for Codex/shared files updated in this task

Missing / intentionally skipped:
- `.codex/memory/decisions.md` — no new Codex-owned design choice was made; this was catch-up and state reconciliation.
- Shared design / implementation plans — I did not rewrite them during onboarding. The retrieval-store drift is real, but it should be either formalized deliberately or corrected deliberately, not silently rewritten during catch-up.
- Code changes / tests — none made or rerun in this onboarding task. Verification here came from direct repo inspection, git history, and the live workflow / schema / code surfaces already committed.

## 2026-04-24T22:08:08-04:00 — Codex review of Extraction prompt (task 3.P1c)

**Context.** User asked to move forward after ingestion verification. Per the implementation plan, the next Codex-owned step is `3.P1c`: review `prompts/extraction-agent.md` before Claude Chat refinement and before wiring the first specialist agent.

**Findings.**

- **[P1] Remove midpoint derivation for ranged values.** [`prompts/extraction-agent.md`](D:\Projects\interview-projects\deal-diligence\prompts\extraction-agent.md) currently tells the model to turn range language like `"approximately 85–90%"` into a midpoint like `87` ([prompt lines 188-190]). That instruction conflicts with the same prompt's "never invent values" rule and invites fabricated precision. The safer behavior is: prefer a single explicit figure if one exists elsewhere; otherwise leave the field null or preserve the literal range in a string field where the schema allows one. Extraction numeric fields should not ask the model to synthesize a new scalar.
- **[P1] Remove FX-conversion instructions from Extraction.** The current draft says to convert non-USD figures if the document provides a rate ([prompt lines 191-193]). That creates transformed values that are not literally present in the cited passage, and the schema has no currency field to preserve the original denomination alongside the converted number. This weakens provenance and can produce numbers that look extracted but are actually model-derived. Better: extract the stated figure only, or leave the numeric field null if normalization would require transformation.

**Open question / non-blocking note.**

- The prompt still benefits from the concrete `management_claims` vs `investment_thesis` example already called out in its drafting notes. I do not consider that a blocking bug because the distinction is at least stated, but it is still the most important refinement target for Claude Chat after the two extraction-integrity fixes above.

**Watch out:**
- These are prompt-integrity issues, not style nits. If left in place, they can make the very first agent emit values that are defensible-sounding but not literally extracted, which would pollute downstream contradiction checking, red-flag detection, and memo citations.

### Task Receipt
Updates fanned out this task:
- `docs/agents/codex.md` .............................. this review entry with concrete findings for `3.P1c`
- `.codex/memory/state.md` ............................ updated active task / pause point / next steps after prompt review
- `.collab/INDEX.md` .................................. refreshed timestamps for Codex files updated in this task

Missing / intentionally skipped:
- `prompts/extraction-agent.md` — I did not silently rewrite Claude's draft. This was a Codex review step; Claude / Will should decide whether to patch before Claude Chat refinement or fold the fixes into the refinement pass.
- `.codex/memory/context.md` / `.codex/memory/decisions.md` — no new durable project truth or Codex-owned design choice emerged beyond the review findings themselves.
- Tests — none applicable; this was a prompt review task, not a code change.

## 2026-04-24T22:18:31-04:00 — Co-authored Extraction prompt cleanup before external refinement

**Context.** User asked me to move from pure review into co-author mode for the first next step, then prepare an exact prompt for a fresh ChatGPT chat to refine the draft before one more review pass.

**Action.** Patched [`prompts/extraction-agent.md`](D:\Projects\interview-projects\deal-diligence\prompts\extraction-agent.md) to remove the two instructions most likely to create model-derived numbers:
- midpoint synthesis from ranged values
- FX conversion for non-USD figures

The prompt now tells the model to leave numeric fields null when a scalar would require transformation rather than literal extraction.

**Why this matters.** Extraction is the root of the downstream evidence graph. If the first specialist agent emits transformed values that were not literally stated in the source, contradiction checking, red-flag logic, and memo citations all inherit the contamination.

### Task Receipt
Updates fanned out this task:
- `prompts/extraction-agent.md` ....................... removed midpoint / FX-conversion instructions that invited model-derived numbers
- `docs/agents/codex.md` .............................. this co-authoring entry
- `.codex/memory/state.md` ............................ updated active task / next steps for external refinement handoff
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- `.codex/memory/context.md` / `.codex/memory/decisions.md` — no new durable project truth or Codex-owned design choice beyond the already logged review findings.
- Tests — none applicable; this was a prompt edit, not executable code.

## 2026-04-24T22:21:09-04:00 — Final review of externally refined Extraction prompt

**Context.** User returned the external ChatGPT refinement and asked for one more review pass before moving on to task `3.5`.

**Assessment.** The refined prompt is good enough to adopt. It preserves the schema shape, keeps strict JSON-only output discipline, keeps the citation format tight, and clearly distinguishes `investment_thesis` from `management_claims`. Most importantly, it no longer asks the model to synthesize numbers from ranges or perform FX conversion.

**Small note, non-blocking.** The line "Never guess, infer, calculate, normalize, or editorialize" is stricter than the earlier draft and may slightly reduce recall on borderline classification fields, but for Extraction I prefer that tradeoff. Literal evidence discipline matters more here than aggressive coverage.

### Task Receipt
Updates fanned out this task:
- `prompts/extraction-agent.md` ....................... updated to the externally refined, reviewed working draft
- `docs/agents/codex.md` .............................. this final review entry
- `.codex/memory/state.md` ............................ updated next steps toward task `3.5`
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- Tests — none applicable; this was a prompt adoption / review step, not runnable code.
- `.codex/memory/context.md` / `.codex/memory/decisions.md` — no new durable truth or Codex-owned architecture decision emerged from this final prompt review.

## 2026-04-24T22:31:01-04:00 — Task 3.5 wired: first-pass Extraction path in n8n workflow

**Context.** User asked to proceed after prompt finalization. With the Extraction prompt adopted, the next live implementation step was task `3.5`: wire the first specialist agent into `n8n/workflow.json`.

**Action.** Added a first-pass Extraction path after `Aggregate Vector Store` using the repo's current hand-rolled retrieval architecture rather than the original design's Simple Vector Store wording. The new workflow path:

- prepares one retrieval query per document x taxonomy section plus one union query
- embeds each query through the configured embedding endpoint
- ranks document-local chunk embeddings by cosine similarity
- regroups the selected hits into per-document `chunks` and `union_chunks`
- builds the adopted Extraction system prompt + user payload
- calls the Alicloud chat-completions endpoint
- parses the JSON response into `extraction_output`

**Implementation notes.**

- I kept the retrieval logic explicit in Code nodes because the live workflow already depends on hand-rolled aggregation and because it makes debugging chunk selection visible in the workflow source.
- I used the same cross-node recovery pattern already established elsewhere in the workflow (`$('NodeName').item` / `.all()`) rather than relying on implicit item merging.
- The workflow JSON parses cleanly after the change and now contains 15 connected nodes, ending at `Parse Extraction Response`.

**Watch out:**
- This is still a first runtime pass. The most likely live issues are request-shape mismatches against the Alicloud-compatible chat endpoint, item-order assumptions across the query embedding leg, or over/under-retrieval in the section queries.
- `Build Extraction Request` currently embeds the adopted prompt text directly into the workflow JSON. That keeps the workflow self-contained, but prompt drift can now happen if the markdown prompt file changes later without a corresponding workflow refresh.

### Task Receipt
Updates fanned out this task:
- `n8n/workflow.json` ................................. wired first-pass Extraction retrieval + LLM path after `Aggregate Vector Store`
- `docs/agents/codex.md` .............................. this implementation entry
- `.codex/memory/state.md` ............................ updated active task / pause point / next steps to runtime verification
- `docs/STATUS.md` .................................... advanced shared project status from "no specialist-agent nodes yet" to "Extraction path wired, pending runtime verification"
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- Runtime import / execution — not run from Codex. This needs the next manual n8n import-and-submit pass.
- `.codex/memory/context.md` / `.codex/memory/decisions.md` — no new durable architecture decision yet; this is implementation progress pending runtime confirmation.

## 2026-04-24T22:41:47-04:00 — Post-first-run hardening of Extraction path

**Context.** User returned the first live `Parse Extraction Response` output for both CoreWeave documents. The run proved the path is fundamentally viable, but it also surfaced two concrete issues:

- the press-release output included an extra `financial_performance.citations` field that is outside the fixed schema
- the S-1 retrieval selected 54 regular chunks, inflating prompt size to ~58k prompt tokens and effectively re-stuffing much of the filing

**Action.** Tightened the workflow in two places:

- `Parse Extraction Response` now projects the model JSON back onto the exact Extraction schema shape, stripping unexpected keys and keeping `source_name` / `source_type` aligned to the workflow input
- `Aggregate Extraction Context` now caps the final prompt context to `24` regular chunks and `6` union chunks after score-aware dedupe

**Why this matters.**

- The schema projection prevents downstream consumers from inheriting model-added keys that look harmless but break strict validation.
- The retrieval cap should materially reduce cost and latency while keeping enough evidence in context for the first specialist agent to work reliably.

**Watch out:**
- This is still not a substitute for a dedicated schema-validation / retry stage later in Phase 3. It is a practical guardrail for the current Extraction leg.
- The retrieval cap is intentionally conservative rather than fully optimized. If recall drops too much on harder filings, we should tune query mix / limits rather than immediately raise the cap back toward full-document stuffing.

### Task Receipt
Updates fanned out this task:
- `n8n/workflow.json` ................................. added schema-shape projection in parse step and retrieval caps in context aggregation
- `docs/agents/codex.md` .............................. this hardening entry
- `.codex/memory/state.md` ............................ updated pause point / next steps for the rerun verification
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- Runtime rerun — not run from Codex. Needs one more manual import / submit pass.
- `docs/STATUS.md` — no new phase change; this was a hardening follow-up within the existing Phase 3 Extraction verification loop.

## 2026-04-24T23:27:41-04:00 — Extraction runtime verification complete; backlog captured for Claude handoff

**Context.** User returned the second live `Parse Extraction Response` output after the schema-projection and retrieval-cap patch. The workflow completed successfully on the CoreWeave press release + S-1 pair.

**Assessment.** Task `3.5` is now good enough to mark complete. The important plumbing checks passed:

- the workflow ran successfully end to end through `Parse Extraction Response`
- the press-release output no longer included the extra `financial_performance.citations` field
- retrieval caps held (`24` regular chunks, `6` union chunks)
- the S-1 prompt dropped from roughly `58,879` to `30,435` prompt tokens

**Attention items for later follow-up (not blockers for moving to Contradiction):**

- S-1 `company_overview.headcount` came back `null` despite earlier evidence that the filing contains that fact
- S-1 `management_assessment.key_personnel` came back empty
- S-1 `financial_performance.revenue_latest_period.value` regressed from a more exact earlier extraction to a rounded `1.9B`

These point to Extraction quality / retrieval-grounding tuning rather than workflow failure. Claude should not need to stop Contradiction work for them, but should keep them visible as a later optimization target before final memo-eval hardening.

### Task Receipt
Updates fanned out this task:
- `docs/STATUS.md` .................................... shared status advanced from "Extraction pending runtime verification" to "Extraction verified; ready for Contradiction"
- `.codex/memory/context.md` .......................... recorded the durable truth that Extraction is green and the remaining risk is quality tuning
- `.codex/memory/state.md` ............................ updated next steps toward `3.P2` / `3.6` and captured the quality backlog
- `docs/agents/codex.md` .............................. this handoff-oriented verification entry
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- `n8n/workflow.json` — no code change was needed in this pass; this was state / handoff documentation after the successful rerun.
- `.codex/memory/decisions.md` — no new Codex-owned architecture decision was made.

## 2026-04-24T23:39:35-04:00 — Contradiction prompt review complete; Variant A stays primary

**Context.** User asked to proceed with the next planned step after Extraction. The immediate task was to compare the two Contradiction prompt variants, choose the right implementation target for `3.6`, and move the repo from Phase-2 stubs to usable Phase-3 drafts.

**Assessment.** Variant A (`prompts/contradiction-agent.tool-use.md`) should remain the primary implementation target.

Why:

- D-2 already provisionally prefers tool-use.
- Contradiction is the stage most harmed by relying only on upstream summaries; it benefits from checking raw passages directly.
- The verified Extraction run already showed token pressure on only two documents. Stuffed-context Contradiction would scale poorly and would compound any Extraction misses.

Variant B (`prompts/contradiction-agent.stuffed.md`) is still valuable, but as the operational fallback if live n8n tool-use fails during `3.6`.

**Action.** Replaced both prompt stubs with real drafts:

- Variant A now has explicit classification rules, severity examples, a concrete schema-shaped example, tool-use guidance, and a working distinction between `UNCONTRADICTED` and `UNSUPPORTED`.
- Variant B now mirrors the same logic without tools, stays conservative about contradictions, and is ready to activate if D-2 flips.

**Watch out:**
- Contradiction is one of the repo's three high-stakes prompts. Per project conventions, Variant A should still go through external Claude Chat refinement before we freeze it into the `3.6` wiring.
- The `ContradictionOutput` schema allows all four classifications in `contradictions`, but only `CORROBORATED` / `UNCONTRADICTED` in `verified_claims`. The prompt now makes that routing explicit; any future edits should preserve it.

### Task Receipt
Updates fanned out this task:
- `prompts/contradiction-agent.tool-use.md` ........... drafted primary Contradiction prompt for Variant A
- `prompts/contradiction-agent.stuffed.md` ............ drafted fallback Contradiction prompt for Variant B
- `.codex/memory/context.md` .......................... recorded durable rationale for keeping Variant A as primary
- `.codex/memory/state.md` ............................ updated current state to `3.P2` drafted / `3.P2r` next
- `docs/agents/codex.md` .............................. this review-and-draft entry
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- External Claude Chat refinement — still pending for Variant A per project convention.
- `n8n/workflow.json` — no runtime wiring yet; this task was prompt selection and drafting only.

## 2026-04-24T23:43:40-04:00 — Final review and adoption of refined Contradiction Variant A

**Context.** User returned the external Claude Chat refinement for `prompts/contradiction-agent.tool-use.md` and asked to proceed.

**Assessment.** The refined prompt is good enough to adopt as the ready primary prompt for `3.6`. It is materially cleaner than the local draft in three ways:

- sharper distinction among `DISPUTED`, `UNSUPPORTED`, and `UNCONTRADICTED`
- better conservative guidance around when to use `retrieve_document`
- clearer final-check discipline for schema routing and contradiction evidence

**Local adjustment before adoption.** I preserved two repo-specific requirements that the external refinement did not state explicitly:

- an explicit input description
- a concrete output example, because project conventions require prompt files in `prompts/` to include one

That means the checked-in file is not a verbatim paste of Claude Chat's output; it is the adopted repo version after a final Codex conformity pass.

### Task Receipt
Updates fanned out this task:
- `prompts/contradiction-agent.tool-use.md` ........... adopted refined primary Contradiction prompt after external Claude Chat pass
- `docs/STATUS.md` .................................... updated shared status so `3.P2r` is complete and `3.6` is the next active task
- `.codex/memory/context.md` .......................... recorded that Variant A is now ready to wire
- `.codex/memory/state.md` ............................ advanced current state from prompt refinement to `3.6` wiring
- `docs/agents/codex.md` .............................. this final-adoption entry
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- `n8n/workflow.json` — no wiring yet; that is the next task.
- External refinement of Variant B — intentionally skipped unless D-2 flips and the fallback becomes active.

## 2026-04-24T23:54:42-04:00 — Task 3.6 wired: first-pass Contradiction tool-use loop

**Context.** With Variant A refined and adopted, the next step was `3.6`: wire the Contradiction path and set up a real D-2 runtime test.

**Action.** Added a first-pass Contradiction loop after `Parse Extraction Response` in `n8n/workflow.json`. The new path:

- aggregates all per-document Extraction outputs into one cross-document Contradiction input
- calls the Alicloud chat-completions API with a `retrieve_document` function tool definition
- parses tool calls explicitly
- embeds each retrieval query and ranks chunks from the existing aggregate vector store
- sends tool results back for a final synthesis turn
- parses the final JSON into `contradiction_output`

**Important implementation note.** This is Variant A in spirit and behavior, but not via an n8n AI Agent node. It is a hand-rolled tool-call loop over raw HTTP plus Code nodes. That keeps the workflow aligned with the repo's current architecture, but it also changes the interpretation of D-2 runtime failures: the failure could now be in our workflow path, not just in model tool-use itself.

**Watch out:**
- The first-turn parser intentionally fails loudly if no `tool_calls` are returned. That makes D-2 testing explicit, but it means the first runtime pass may fail hard instead of silently degrading.
- `Build Contradiction Request` embeds the adopted prompt text directly into the workflow source, so prompt drift remains a maintenance risk just as it does for Extraction.

### Task Receipt
Updates fanned out this task:
- `n8n/workflow.json` ................................. wired first-pass Contradiction Variant A tool-use loop
- `docs/STATUS.md` .................................... advanced shared status to `3.6` wired / pending runtime verification
- `.codex/memory/context.md` .......................... recorded the architectural nuance of the hand-rolled tool-call loop
- `.codex/memory/state.md` ............................ updated current state to runtime verification of `3.6`
- `docs/agents/codex.md` .............................. this implementation entry
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- Live n8n run — not yet executed from Codex. This is the immediate next step.
- Variant B runtime wiring — intentionally deferred unless D-2 flips.

## 2026-04-25T00:13:06-04:00 — Timeout hardening after live Extraction-node abort

**Context.** User reported a live rerun failure at `Call Extraction Agent`: `ECONNABORTED`, with n8n reporting `timeout of 120000ms exceeded`. This happened before the workflow reached Contradiction verification.

**Assessment.** This does **not** count as a Contradiction / D-2 failure. The run died at the Extraction chat-completions call, so the right diagnosis is provider latency under an overly tight timeout window.

**Action.** Increased the HTTP timeout on all long-running chat-completions nodes in `n8n/workflow.json` from `120000` to `300000`:

- `Call Extraction Agent`
- `Call Contradiction Agent (Turn 1)`
- `Call Contradiction Agent (Final)`

**Why this matters.** Without this change, future reruns can fail for transport-latency reasons before we learn anything useful about prompt behavior or tool-use reliability.

### Task Receipt
Updates fanned out this task:
- `n8n/workflow.json` ................................. increased chat-node timeouts from 120s to 300s
- `docs/STATUS.md` .................................... recorded that the previous failure was Extraction-provider latency, not Contradiction runtime logic
- `.codex/memory/context.md` .......................... captured the durable interpretation of the failed rerun
- `.codex/memory/state.md` ............................ updated next steps toward a fresh rerun
- `docs/agents/codex.md` .............................. this timeout-hardening entry
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- Fresh live rerun — still needed after re-importing the updated workflow JSON.
- Any prompt changes — none warranted from this failure mode.

## 2026-04-25T00:30:19-04:00 — Fix for Contradiction parser fan-out mode

**Context.** User reported the next live rerun failed at `Parse Contradiction Tool Calls` with: `A 'json' property isn't an object`. n8n's stack trace pointed to Code-node result validation.

**Assessment.** This was a workflow bug in our node mode selection, not a Contradiction prompt failure and not a D-2 failure.

**Root cause.** `Parse Contradiction Tool Calls` needs to fan one model response out into N tool-call items. I had left the node in `runOnceForEachItem` mode while returning an array. n8n expects a single item shape in that mode, so validation failed.

**Action.** Switched `Parse Contradiction Tool Calls` to `runOnceForAllItems` and updated the code to read:

- `const response = $input.all()[0]?.json`
- `const request = $('Build Contradiction Request').all()[0]?.json`

This makes the multi-item return shape valid for the node.

**Interpretation.** Because the failure happened while trying to fan out tool calls, this is weak positive evidence that the model did in fact return tool calls on turn 1. So the run should not be interpreted as a reason to flip to Variant B.

### Task Receipt
Updates fanned out this task:
- `n8n/workflow.json` ................................. fixed `Parse Contradiction Tool Calls` to use `runOnceForAllItems`
- `docs/STATUS.md` .................................... recorded that the latest Contradiction failure was a node-shape bug, not a D-2 failure
- `.codex/memory/context.md` .......................... captured the durable interpretation of this rerun
- `.codex/memory/state.md` ............................ updated next steps toward the next live rerun
- `docs/agents/codex.md` .............................. this parser-fix entry
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- Fresh live rerun — still needed after re-importing the updated workflow JSON.
- Any change to Variant B — not warranted by this failure mode.

## 2026-04-25T00:55:30-04:00 — Contradiction prompt tightened for corroboration specificity

**Context.** User shared the first successful `contradiction_output`. The workflow/tool-use path worked, but the output showed a semantic-quality issue: some exact claims were marked `CORROBORATED` even though the second source only supported the idea directionally.

**Example pattern.**

- exact filing claim: `Microsoft accounted for 62% of revenue`
- article support: `more than half its revenue from a single customer`
- current model label: `CORROBORATED`

That is too strong. The exact `62%` claim should be `UNCONTRADICTED` unless another source supports the same fact at comparable specificity.

**Action.** Tightened `prompts/contradiction-agent.tool-use.md` so:

- broad directional support is not enough for `CORROBORATED`
- exact numeric / highly specific claims need comparable specificity from another source
- otherwise the agent should prefer `UNCONTRADICTED`

**Assessment.** The workflow is already functionally green. This is a targeted semantic-quality iteration, not a topology or D-2 issue.

### Task Receipt
Updates fanned out this task:
- `prompts/contradiction-agent.tool-use.md` ........... tightened corroboration-specificity rules
- `docs/STATUS.md` .................................... recorded the prompt-quality issue and rerun target
- `.codex/memory/context.md` .......................... captured the durable semantic issue from the first successful Contradiction run
- `.codex/memory/state.md` ............................ updated next steps toward a quality rerun
- `docs/agents/codex.md` .............................. this semantic-quality iteration entry
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- `n8n/workflow.json` — no workflow change needed for this issue.
- Variant B prompt — unchanged; this is a Variant A quality refinement.

## 2026-04-25T01:07:48-04:00 — Contradiction runtime verified; prompt tightened again for shared-specificity claims

**Context.** User returned a second successful `contradiction_output` after the first specificity patch. The workflow completed successfully and the output confirmed that the hand-rolled tool-use loop is operational in live n8n runtime.

**What the rerun proved.**

- `Call Contradiction Agent (Turn 1)` emitted `retrieve_document` calls
- retrieval returned relevant raw passages from the aggregate chunk store
- `Parse Contradiction Response` produced valid structured output

So task `3.6` is now functionally verified for the current raw-HTTP tool-use topology.

**Remaining quality issue.** The earlier prompt fix improved things, but one important leak remained:

- filing support: `Microsoft represented 62% of revenue`
- article support: `more than half of revenue came from a single customer`
- model output: a single `CORROBORATED` claim written at the more specific `Microsoft 62%` level with both citations attached

That means the prompt needed one stricter rule: every citation in a `CORROBORATED` item must support the claim **as written**. If sources overlap only at a looser level, the model should either:

- rewrite the claim to the shared denominator, or
- keep the more specific claim as `UNCONTRADICTED`

**Action.**

- tightened [`prompts/contradiction-agent.tool-use.md`](D:\Projects\interview-projects\deal-diligence\prompts\contradiction-agent.tool-use.md) with the shared-specificity rule
- mirrored the same wording into the embedded prompt inside [`n8n/workflow.json`](D:\Projects\interview-projects\deal-diligence\n8n\workflow.json)
- bumped workflow `versionId` to `phase3-session1-v6`
- updated shared/Codex handoff surfaces so Claude sees that `3.6` is runtime-green and the remaining work is one last semantic-quality rerun

**Watch out:**
- The prompt file and the embedded workflow prompt had drifted. This task re-synced them. Future Contradiction prompt edits should continue to touch both surfaces in the same turn.

### Task Receipt
Updates fanned out this task:
- `prompts/contradiction-agent.tool-use.md` ........... tightened `CORROBORATED` so every cited source must support the claim as written
- `n8n/workflow.json` ................................. synced the embedded Contradiction prompt and bumped workflow version to `phase3-session1-v6`
- `docs/STATUS.md` .................................... marked `3.6` runtime verification as pass and logged the remaining shared-specificity issue
- `.codex/memory/context.md` .......................... recorded the durable truth that runtime is green and the remaining issue is claim-writing specificity
- `.codex/memory/state.md` ............................ updated active task / next step to one final Contradiction quality rerun
- `docs/agents/codex.md` .............................. this runtime-verification and prompt-sync entry
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- Live rerun after this second prompt patch — still needed from n8n after re-importing the updated workflow.
- Variant B prompt — unchanged; the current issue is a Variant A semantic refinement, not a tool-use failure.

## 2026-04-25T01:14:58-04:00 — Switched live Alicloud chat model to qwen3-max-2026-01-23

**Context.** User asked to switch the active LLM from `qwen3.5-plus` to `qwen3-max-2026-01-23` before the next Contradiction rerun.

**Assessment.** The repo was already set up for a clean model swap. All chat-completions nodes in [`n8n/workflow.json`](D:\Projects\interview-projects\deal-diligence\n8n\workflow.json) read `{{ $env.ALICLOUD_MODEL }}` at runtime, so no workflow-node rewiring was necessary.

**Action.**

- updated local [`.env`](D:\Projects\interview-projects\deal-diligence\.env) to `ALICLOUD_MODEL=qwen3-max-2026-01-23`
- updated [`.env.example`](D:\Projects\interview-projects\deal-diligence\.env.example) so the repo default matches the live config
- updated [README.md](D:\Projects\interview-projects\deal-diligence\README.md), [CONTEXT.md](D:\Projects\interview-projects\deal-diligence\CONTEXT.md), and [docs/plans/2026-04-24-deal-diligence-design.md](D:\Projects\interview-projects\deal-diligence\docs\plans\2026-04-24-deal-diligence-design.md) so future agents stop assuming `qwen3.5-plus` is the current prototype model

**Operational note.** Because the model name comes from container env, the only runtime step needed now is to restart n8n so it reloads `.env`. Re-importing the workflow is not required for the model swap itself.

### Task Receipt
Updates fanned out this task:
- `.env` .............................................. switched live `ALICLOUD_MODEL` to `qwen3-max-2026-01-23`
- `.env.example` ...................................... updated repo default chat model to `qwen3-max-2026-01-23`
- `README.md` ......................................... updated stack summary to the new live default model
- `CONTEXT.md` ........................................ updated active project context to the new live prototype model
- `docs/plans/2026-04-24-deal-diligence-design.md` .... updated design-plan default model reference
- `.codex/memory/context.md` .......................... recorded the durable truth that the live default model has changed and only restart is required
- `.codex/memory/state.md` ............................ updated next steps toward restart + rerun on the new model
- `docs/agents/codex.md` .............................. this model-switch entry
- `.collab/INDEX.md` .................................. refreshed timestamps for files updated in this task

Missing / intentionally skipped:
- n8n restart — not run from Codex in this turn; doing so would interrupt the current local service and is the next operational step.
- Workflow re-import — intentionally skipped because the model swap is env-driven, not embedded in node JSON.

## 2026-04-25T01:31:21-04:00 — Final Claude handoff after accepted qwen3-max Contradiction rerun

**Context.** User ran the focused CoreWeave Contradiction test on `qwen3-max-2026-01-23` and then asked me to fully prepare the repo handoff so Claude can pick up from the current work stage without re-deriving context.

**What the latest accepted run established.**

- the model switch worked; last-node output showed `llm_model: qwen3-max-2026-01-23`
- the main earlier Contradiction bug is gone: the false `Microsoft 62%` `CORROBORATED` claim no longer appears
- the workflow is still green end to end through `Parse Contradiction Response`
- a narrower wording caveat remains in some `CORROBORATED` claims, where the final wording can still carry a detail that is not fully shared by every citation

**User direction.** The user explicitly accepted the current quality as sufficient and asked for a handoff to Claude rather than another Contradiction iteration. That means the active baton-pass state is:

- `3.5` Extraction = accepted live baseline
- `3.6` Contradiction = accepted live baseline
- active chat model = `qwen3-max-2026-01-23`
- next task = `3.7` Gap Analysis

**Action.**

- updated shared status so the repo now says the project is ready to move to `3.7`
- updated Codex memory to record that the current accepted baseline is on `qwen3-max`
- recorded the durable decision to proceed rather than spend another round on Contradiction quality
- recorded the env-reload pitfall so Claude does not waste time re-importing workflow JSON on future model swaps
- manually prepared the baton pass in Codex-owned surfaces because this repo does not have the helper handoff script locally

**Watch out:**
- `.collab/ACTIVE.md` previously showed Codex as active on `main`. I am clearing that row in this handoff so Claude does not see a stale collision and pause unnecessarily.
- Prompt/workflow alignment remains load-bearing: if Claude edits `prompts/contradiction-agent.tool-use.md` later, the embedded prompt inside `n8n/workflow.json` must be kept in sync in the same turn.

### Task Receipt
Updates fanned out this task:
- `docs/STATUS.md` .................................... advanced the shared project baseline to “ready for `3.7` on accepted qwen3-max Contradiction output”
- `.codex/memory/context.md` .......................... recorded the accepted qwen3-max rerun and explicit user direction to proceed
- `.codex/memory/state.md` ............................ reset pause point so Claude resumes at `3.7`
- `.codex/memory/decisions.md` ........................ recorded the decision to proceed from current Contradiction quality rather than tune further now
- `.codex/memory/pitfalls.md` ......................... recorded that model swaps need container restart, not workflow re-import
- `docs/agents/codex.md` .............................. this final baton-pass entry
- `.collab/ACTIVE.md` ................................. cleared stale Codex active row for Claude handoff
- `.collab/INDEX.md` .................................. refreshed timestamps for all updated handoff surfaces

Missing / intentionally skipped:
- Any further workflow or prompt edits — intentionally skipped because the user asked for handoff prep, not another implementation pass.

**Claude handoff:**
- Resume at `3.7` Gap Analysis.
- Treat the current `qwen3-max-2026-01-23` Extraction + Contradiction baseline as accepted by the user.
- Do not spend another mandatory round on Contradiction tuning unless downstream work exposes a real blocker.
- Keep these backlogs visible:
  - Extraction recall: `headcount`, `key_personnel`, exact revenue recall
  - Contradiction wording: narrow detail-merging caveat in some `CORROBORATED` phrasing
- Active files worth reading first:
  - `docs/STATUS.md`
  - `.codex/memory/{state,context,decisions,pitfalls}.md`
  - `n8n/workflow.json`
  - `prompts/contradiction-agent.tool-use.md`

## Handoff blocks

When you finish a substantive chunk of work and want another agent to take over,
run `collab-handoff <to-agent>`. It appends a structured block at the end of this
log with a stable id, what you did, files touched, and the branch state. See
`docs/handoff-schema.md` for the full format.
