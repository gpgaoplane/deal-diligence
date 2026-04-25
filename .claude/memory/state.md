---
status: active
type: state
owner: claude
last-updated: 2026-04-25T09:30:00-04:00
read-if: "you need to know Claude's current live work state"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Live State

<!-- section:current-state:start -->
**Branch:** `main`
**Active task:** `3.P3` Gap Analysis prompt drafted at `prompts/gap-analysis-agent.md` (replaced the Phase 2 stub with a Phase 3 draft following the 7-part convention). Awaiting Codex post-commit review per project-conventions §10 trigger 1.
**Pause point:** Will's eyeball + Codex review. Then `3.7` wiring (workflow nodes after `Parse Contradiction Response`).
**Blockers:** None.
<!-- section:current-state:end -->

<!-- section:next-steps:start -->
1. **Codex post-commit review of 3.P3** per project-conventions §10 trigger 1.
2. **Task 3.7** — Wire Gap Analysis specialist into `n8n/workflow.json` after `Parse Contradiction Response`. Input: aggregated Extraction outputs + Contradiction output + union retrieval chunks. Output: `GapAnalysisOutput` (`missing_information[]`). The wired path will follow the D-6 pattern: aggregate inputs in a Code node → Build Gap Analysis Request → Call Gap Analysis Agent (raw HTTP chat-completions) → Parse Gap Analysis Response with schema-shape projection.
3. **Tasks 3.8 → 3.13** — Red Flag Detector integration (deterministic JS, I-2), Portfolio Fit, Citation Validity, Memo Generation (high-stakes; Claude Chat refinement), schema-validation-with-retry machinery, Evaluator.
4. **Tasks 3.14 → 3.17w** — routing IF, Supabase write, Slack, error handler.
5. **Tasks 3.18w / 3.19w / 3.20w** — helper scripts (run-meta-eval.js, validate-memo-citations.js, validate-fixture.js).
6. **Tasks 3.24 → 3.29** — Langfuse integration after Will installs community nodes via UI.
7. **Backlog (carried from Codex baseline; do not gate forward progress):**
   - Extraction recall: S-1 `headcount`, `key_personnel`, exact revenue values regressed to rounded figures (e.g. `1.9B`).
   - Contradiction wording: narrow detail-merging caveat where `CORROBORATED` claims can still carry detail not fully shared by every citation.
<!-- section:next-steps:end -->

<!-- section:open-questions:start -->
- **Retrieval-store architecture drift (carried from Codex):** the live `Aggregate Vector Store` node is a hand-rolled chunk store, not the design plan's "Simple Vector Store" wording. Decision deferred — either formalize the live pattern in design docs, or realign the workflow before specialist-agent dependency deepens further. Lean: formalize, since Extraction + Contradiction already build on it.
- **Specialist-agent topology (carried from Codex):** all wired specialists (Extraction, Contradiction) use raw HTTP + Code-node tool-call loops rather than the n8n AI Agent node. Should this become the formal repo pattern? D-2 is effectively confirmed for the hand-rolled path; the question is whether to update design docs to reflect it.
- **Community-node install (Will's task):** still pending UI install of `@langfuse/n8n-nodes-langfuse` and `n8n-nodes-openai-langfuse`. Only blocks task 3.24, not Phase 3 progress through 3.13.
- **PDF fidelity:** S-1 PDFs are text-rendered (no tables/layout). If Phase 4 retrieval quality degrades, may need to regenerate via weasyprint/playwright. Not a current blocker — Codex's verified Extraction run shows the pipeline reads them adequately.
<!-- section:open-questions:end -->

<!-- section:read-watermark:start -->
Last read INDEX at: 2026-04-25T09:14:33-04:00
<!-- section:read-watermark:end -->
