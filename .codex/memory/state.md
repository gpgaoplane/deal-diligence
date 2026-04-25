---
status: active
type: state
owner: codex
last-updated: 2026-04-25T01:31:21-04:00
read-if: "you need to know Codex's current live work state"
skip-if: "status != active or last-updated <= your watermark"
---

# Codex — Live State

<!-- section:current-state:start -->
**Branch:** `main`
**Active task:** Handoff prep for Claude after the accepted `qwen3-max-2026-01-23` Contradiction rerun.
**Pause point:** Claude should resume from `3.7` Gap Analysis, not from another mandatory Contradiction-tuning pass.
**Blockers:** None. Current watch-outs are quality-oriented rather than plumbing-oriented: missing S-1 `headcount`, empty `key_personnel`, rounded revenue figure regression, and one narrow detail-merging caveat in some `CORROBORATED` Contradiction wording.
<!-- section:current-state:end -->

<!-- section:next-steps:start -->
1. Claude resumes at `3.7`: draft/refine Gap Analysis prompt and start wiring the next specialist path.
2. Keep Extraction quality backlog visible: S-1 `headcount`, `key_personnel`, and exact revenue recall still need later tuning.
3. Keep the remaining Contradiction wording caveat as backlog, not blocker, unless later runs show it contaminates downstream agents.
4. Continue Phase 3 through Gap Analysis, Red Flag Detector integration, Portfolio Fit, Citation Validity, Memo Generation, Evaluator, and persistence/notification/observability nodes.
<!-- section:next-steps:end -->

<!-- section:open-questions:start -->
- Should the current hand-rolled aggregate chunk store remain the project retrieval architecture, or should Phase 3 realign to the design plan's Simple Vector Store wording before specialist-agent wiring deepens the dependency?
- Should `docs/plans/2026-04-24-deal-diligence-design.md` eventually be updated to reflect the live retrieval-store implementation, or should the workflow be brought back to the plan instead?
- D-2 is effectively confirmed for the current raw-HTTP Contradiction tool-use path; the remaining question is whether the repo eventually wants to keep this topology or migrate back toward an n8n AI Agent abstraction.
- Extraction is currently wired through a lower-level HTTP Request + retrieval-ranking path rather than an n8n AI Agent node. Keep an eye on whether this remains the preferred repo pattern after the first runtime pass.
- For later Extraction tuning: should we improve retrieval recall via better section queries, better score aggregation, or a narrower prompt instruction for exact-number preference before we raise chunk caps again?
- If Variant A tool-use fails inside n8n AI Agent, should the fallback be immediate swap to Variant B for the same run, or should we first try one prompt/tool-definition simplification round?
- Since `3.6` is now working via raw HTTP tool-calling rather than an AI Agent node, should the design docs eventually be updated to formalize this as the repo pattern for specialist agents, or should later phases try to realign with the higher-level node abstraction?
<!-- section:open-questions:end -->

<!-- section:read-watermark:start -->
Last read INDEX at: 2026-04-25T01:31:21-04:00
<!-- section:read-watermark:end -->
