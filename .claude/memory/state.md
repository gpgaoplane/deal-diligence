---
status: active
type: state
owner: claude
last-updated: 2026-04-25T15:30:00-04:00
read-if: "you need to know Claude's current live work state"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Live State

<!-- section:current-state:start -->
**Branch:** `main`
**Active task:** Phase 3 main path complete (3.11 + 3.10b + 3.13 + 3.14 + 3.15 + 3.16w). Workflow now has 45 connected nodes from Form Trigger through Send Slack Notification: ingestion → Extraction → Contradiction → Gap Analysis → RFD → Portfolio Fit → Memo Generation → Validate Memo Citations → Evaluator → Build Supabase Record → Insert Deal Memo → Build Slack Message → Send Slack Notification. `versionId: phase3-session2-v15`. Also landed: `scripts/inject-prompts.js` (D-6 mitigation; 5 of 5 prompt nodes verified in-sync).
**Pause point:** Will re-imports workflow + runs the FULL CoreWeave end-to-end test. Memo + Evaluator + Supabase row + Slack message should all materialize. Remaining Phase 3 work after this: 3.17w error handler (separate workflow), 3.12 schema-validation-with-retry machinery (architecture; could be retrofitted later), Langfuse 3.24-3.29.
**Pause point:** Natural gate at task `3.P5` (Memo Generation prompt draft) — high-stakes prompt requires Claude Chat refinement before commit per project-conventions §3.
**Blockers:** None.
<!-- section:current-state:end -->

<!-- section:next-steps:start -->
1. **Will live-runs the workflow** — re-import `n8n/workflow.json`, submit a CoreWeave run, inspect `Parse Gap Analysis Response` output for `gap_analysis_output.missing_information[]` shape conformance.
2. **Codex post-commit review of 3.P3 + 3.7** per project-conventions §10 trigger 1 (unrefined prompt + new wiring).
3. **Task 3.8** — Red Flag Detector integration. The detector module already exists at `code/red-flag-detector.js` (37/37 tests passing per Phase 2 Receipt). 3.8 is the n8n wiring: Execute Workflow → JS Code node wrapping the module. Per I-2: deterministic only — no LLM, no `Math.random` (Coordinator's Math.random uuidv4 is allowed elsewhere; RFD is the I-2 boundary).
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
