---
status: active
type: context
owner: codex
last-updated: 2026-04-25T01:31:21-04:00
read-if: "you need durable project truths as understood by Codex"
skip-if: "status != active or last-updated <= your watermark"
---

# Codex — Durable Context

Append new invariants and project truths below, each with a dated ISO-8601 header.

<!-- section:entries:start -->
## 2026-04-24T21:35:09-04:00 — Phase 3 has already started in the live workflow

The shared planning docs are still the authority for scope and intended sequencing, but the live repository state is already past the "Phase 3 not started" point. `n8n/workflow.json` now contains the connected ingestion spine:

`Form Trigger -> Coordinator -> Split Per-Document -> Extract from File -> Text Chunker -> Embed Chunk -> Extract Embedding -> Aggregate Vector Store`

When status docs and implementation reality disagree during fast-moving build work, use the repo authority order:
1. `CONTEXT.md` for locked scope / decisions
2. current git history + `n8n/workflow.json` for what is actually built
3. Claude's work log / state / decisions for rationale and hazards
4. `docs/STATUS.md` after checking whether it has kept up

## 2026-04-24T21:35:09-04:00 — The live ingestion path is shaped by n8n sandbox constraints

Two implementation truths matter before touching workflow logic:

- n8n Code-node sandbox constraints are real and load-bearing here: `ajv.compile()` is unusable in-node (P-1), Node `crypto` is unavailable (P-3), and metadata-dropping nodes require explicit upstream reach-back (P-4).
- Because of those constraints, the ingestion path is implemented as pure-JS code nodes plus HTTP Request nodes, and the schema-validation fallback is the hand-rolled validator in `code/json-schema-validator.js`.

Any Codex review or implementation proposal should assume "simple Node code in n8n" is not the same as "normal Node.js."

## 2026-04-24T21:35:09-04:00 — The current retrieval-store implementation has drifted from the original design wording

The design plan still describes a Simple Vector Store-centered ingestion path, but the live workflow's `Aggregate Vector Store` node explicitly says the current path is a hand-rolled retrieval store: a single workflow item holding `chunks[]` with text, embeddings, and metadata for downstream cosine retrieval.

That does not automatically mean the design is wrong. It does mean future work should make the direction explicit: either formalize this path in the shared design / decision surface, or realign the workflow before specialist-agent retrieval work deepens the dependency.

## 2026-04-24T23:27:41-04:00 — Extraction is live-verified; the next risk is quality, not plumbing

Task `3.5` is now functionally green in live n8n runs on the CoreWeave press release + S-1 pair. The workflow completed successfully, `Parse Extraction Response` emitted the expected top-level structure, the schema-shape projection removed extra model-added keys, and retrieval capping reduced the S-1 prompt from roughly 58.9k to 30.4k prompt tokens.

The most important follow-up is no longer "make Extraction run" but "make Extraction extract the right high-value facts consistently." Concrete observations from the verified run:

- the S-1 output still missed at least one previously recovered field (`headcount`)
- `management_assessment.key_personnel` came back empty on the S-1
- `revenue_latest_period` regressed from a more exact earlier value to a rounded `1.9B`

So future work should treat Extraction as production-plumbed but not yet quality-maxed. The next phase can move on to Contradiction, but there is now an explicit later backlog for retrieval / ranking / grounding refinement before final evaluation hardening.

## 2026-04-24T23:39:35-04:00 — Contradiction should still start with Variant A (tool-use), with Variant B kept ready as fallback

After reviewing the two Contradiction stubs against the schema, design docs, and the now-verified Extraction behavior, Variant A remains the better primary path for `3.6`.

Why:

- the repo's D-2 decision already provisionally prefers tool-use
- Contradiction is the agent that most benefits from checking raw passages instead of trusting possibly lossy Extraction summaries
- the verified Extraction run showed prompt-size pressure even on two documents; a stuffed-context Contradiction path will scale poorly across four documents

Variant B should still stay ready as a live fallback if n8n AI Agent tool-use flakes at wire time, but it should be treated as the operational safety net, not the intended first choice.

## 2026-04-24T23:43:40-04:00 — Contradiction Variant A prompt is now refined enough to wire

The external Claude Chat pass improved the primary Contradiction prompt materially: clearer routing between `verified_claims` and `contradictions`, stronger conservatism around `DISPUTED`, and explicit handling of `UNSUPPORTED` with empty `contradicting_evidence` when no contrary evidence exists.

For the checked-in repo version, two local additions were preserved intentionally:

- explicit input description (`ExtractionOutput[]`, `source_manifest`, `retrieve_document`)
- a concrete schema example, because project conventions require prompt files to include one

So the current repo prompt should be treated as the ready-to-wire version for `3.6`, not as another intermediate draft.

## 2026-04-24T23:54:42-04:00 — Contradiction Variant A is wired as a hand-rolled tool-call loop, not an n8n AI Agent node

For the actual `3.6` implementation, the repo now uses the same architectural style as Extraction rather than an opaque AI Agent node:

- aggregate all Extraction outputs into one Contradiction input
- call the Alicloud chat-completions API with a `retrieve_document` function tool definition
- parse tool calls explicitly in a Code node
- execute retrieval against the existing aggregate chunk store via query embeddings + cosine ranking
- send tool results back in a second chat-completions turn
- parse the final JSON into `contradiction_output`

This means D-2 can still be tested in live n8n runtime, but the test is now "does Qwen tool-use work through our raw HTTP workflow path?" rather than "does the n8n AI Agent LangChain wrapper work?" That distinction matters if runtime fails and we later decide whether to blame the model, the prompt, or the node topology.

## 2026-04-25T00:13:06-04:00 — A failed rerun hit provider latency before Contradiction logic

The latest live rerun did not falsify D-2 and did not expose a Contradiction prompt/tool bug. It failed earlier at `Call Extraction Agent` with `ECONNABORTED` after the workflow's then-current 120s HTTP timeout.

That means the correct interpretation is operational latency, not reasoning failure. The workflow has now been hardened so the long-running chat-completions nodes (`Call Extraction Agent`, `Call Contradiction Agent (Turn 1)`, `Call Contradiction Agent (Final)`) use 300s timeouts.

## 2026-04-25T00:30:19-04:00 — A later Contradiction failure was a Code-node mode bug, not a D-2 failure

The next rerun got further and failed at `Parse Contradiction Tool Calls` with: `A 'json' property isn't an object`. That is an n8n Code-node result-shape error, not a model/tool-use failure.

Root cause: the node was still in `runOnceForEachItem` mode while returning an array of multiple items, one per tool call. It has now been switched to `runOnceForAllItems`, and the code was updated to read from `$input.all()[0]` and `$('Build Contradiction Request').all()[0]`.

Interpretation: this run likely indicates turn 1 *did* return tool calls, because the parser got far enough to fan them out. So this error is weak positive evidence for Variant A viability, not a reason to flip to Variant B.

## 2026-04-25T00:55:30-04:00 — First successful Contradiction run exposed a corroboration-specificity issue

The first successful `contradiction_output` was good enough to confirm the tool-use loop works, but it over-labeled some exact claims as `CORROBORATED` when the second source only provided broad directional support.

Concrete pattern:

- exact filing claim like `62%`
- paired with article language like `more than half`
- model labeled the exact claim `CORROBORATED`

That should instead be `UNCONTRADICTED` unless another source supports the claim at comparable specificity. The prompt is now tightened accordingly. This is a semantic-quality refinement, not a workflow-topology issue.

## 2026-04-25T01:07:48-04:00 — Contradiction runtime is verified, but corroborated claims still need a shared-specificity guard

The latest successful CoreWeave rerun is enough to treat task `3.6` as runtime-verified for the current hand-rolled HTTP tool-use path:

- turn 1 emitted `retrieve_document` calls
- retrieval returned relevant raw passages from the aggregate chunk store
- the final parse step produced valid `ContradictionOutput`

The remaining issue is narrower than the first specificity bug. Even after tightening the prompt once, the model can still write a `CORROBORATED` claim at a more specific level than one of its cited sources actually supports.

Concrete pattern from the rerun:

- filing supports `Microsoft represented 62% of revenue`
- article supports only `more than half of revenue came from a single customer`
- model wrote a single `CORROBORATED` claim with both citations at the more specific `Microsoft 62%` level

So the durable rule is stricter than "exact numbers need comparable specificity": every citation listed for a `CORROBORATED` claim must support the claim as written. If sources overlap only at a looser level, the agent should either rewrite the claim to that shared denominator or keep the more specific version as `UNCONTRADICTED`.

## 2026-04-25T01:14:58-04:00 — The live chat model default is now qwen3-max-2026-01-23

The workflow was already parameterized correctly through `ALICLOUD_MODEL`; no workflow-node logic change was required to switch models. The active config change was:

- `.env`: `ALICLOUD_MODEL=qwen3-max-2026-01-23`

Supporting surfaces were updated so future agents do not keep assuming `qwen3.5-plus` is the live default:

- `.env.example`
- `README.md`
- `CONTEXT.md`
- `docs/plans/2026-04-24-deal-diligence-design.md`

Operationally, this means the next live n8n run only needs an n8n restart so the container re-reads the updated env vars; workflow re-import is not required for the model swap itself because the HTTP nodes already read `{{ $env.ALICLOUD_MODEL }}` at runtime.

## 2026-04-25T01:31:21-04:00 — qwen3-max improved Contradiction enough that the user accepted the baseline and wants Claude to continue from 3.7

The first live Contradiction reruns on `qwen3.5-plus` proved the tool-use loop worked but still over-labeled at least one exact claim (`Microsoft 62%`) as `CORROBORATED`. After switching the active chat model to `qwen3-max-2026-01-23`, the next CoreWeave rerun materially improved that behavior:

- the false `Microsoft 62%` corroboration disappeared
- `llm_model` in the run output confirmed the workflow was using `qwen3-max-2026-01-23`
- the overall `contradiction_output` was good enough that the user explicitly said "its okay" and asked for a full handoff to Claude rather than another Contradiction tuning round

Important handoff implication: the current accepted baseline is **not** "Contradiction still blocks progress." It is:

- Extraction is live-verified
- Contradiction is live-verified
- qwen3-max is the active model
- one narrow detail-merging caveat remains in some `CORROBORATED` wording, but it is now backlog, not gate
- Claude should pick up at `3.7` (Gap Analysis) unless new evidence forces a return to Contradiction quality work
<!-- section:entries:end -->
