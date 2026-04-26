---
status: active
type: state
owner: claude
last-updated: 2026-04-25T18:45:00-04:00
read-if: "you need to know Claude's current live work state"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Live State

<!-- section:current-state:start -->
**Branch:** `main` (51 commits ahead of origin/main; not pushed).
**Active task:** **Phase 3 CLOSED + observable.** 52-node workflow (45-node main path + 5-node error sub-flow + 2-node Langfuse pair). `versionId: phase3-session2-v19`. Active chat model: `qwen3-max-preview`. Three live runs verified end-to-end on CoreWeave. The third run (run_id `0efb319c-...`) landed a complete Langfuse trace (12/12 ingestion events 201) with all observations correctly tagged `qwen3-max-preview`. Error sub-flow correctly did NOT fire on the green run — confirmed expected behavior.
**Pause point:** Natural session-close at Phase 3 completion. **Phase 4 (CoreWeave dev iteration → meta-eval discrimination ≥ 20)** is the next phase but should NOT begin without explicit user direction. First Phase 4 calibration item is documented as the `evaluator_score: 0` anomaly observed in run `0efb319c` on `qwen3-max-preview` — likely Parse Evaluator Response parser fall-through to score=0 default because qwen3-max-preview's output shape diverges slightly from qwen3-max-2026-01-23.
**Blockers:** None.
<!-- section:current-state:end -->

<!-- section:next-steps:start -->
1. **Phase 4 entry (await user direction)** — investigate `evaluator_score: 0` anomaly in run `0efb319c` first. Inspect `Parse Evaluator Response` raw model output vs parser logic. May need parser tightening or prompt re-tuning for qwen3-max-preview.
2. **Phase 4 main work** — meta-eval discrimination ≥ 20. Use `scripts/run-meta-eval.js` with upstream fixture pairs (CLI flags `--extraction --contradictions --gaps --red-flags --portfolio-fit`). Without upstream fixtures, criteria 2/3/4 cannot be calibrated meaningfully (loud stderr WARN already in place per Codex P2 fix).
3. **Phase 5** — Cerebras generalization (re-run pipeline against the 4 Cerebras docs, no code changes expected).
4. **Phase 6** — demo + 250-word written explanation.
5. **Phase 7** — submission to Pari.
6. **Backlog (do not gate forward):**
   - RFD `MATERIAL_WEAKNESS_POS` regex misses "exist" / "remain" / "are present" verb forms.
   - Memo's severity HIGH on "74% gross margin" key_strength miscalibration (HIGH should describe weaknesses, not strengths).
   - Extraction recall: S-1 `headcount`, `key_personnel`, exact revenue values regress to rounded.
   - Cosmetic: `supabase_id` missing from Slack footer (n8n unwraps single-row REST response).
   - Codex post-commit reviews of medium-stakes prompts (Gap Analysis, Portfolio Fit, Evaluator).
   - 3.12 schema-validation-with-retry machinery DEFERRED — parsers' shape projection sufficient for prototype.
<!-- section:next-steps:end -->

<!-- section:open-questions:start -->
- **`evaluator_score: 0` on qwen3-max-preview** — first thing to debug at Phase 4 start. Check whether `criteria_scores` are present-but-malformed vs absent in the raw Evaluator response. Parser at `Parse Evaluator Response` computes `sum(criteria_scores)` authoritatively; if criteria_scores parse fails, default cascade lands at 0 → forces flagged_for_review. Could also be a prompt-shape issue specific to qwen3-max-preview's JSON-mode output.
- **Doubled-prompt surface** (D-6 cost flag): `scripts/inject-prompts.js` is the safety net. Run it (or `--check`) any time `prompts/*.md` changes to keep workflow.json in sync. Contradiction prompt intentionally excluded from inject-prompts.
- **Langfuse trace metadata richness:** trace currently captures token usage + model + run_id. Could add per-observation input/output redaction policy in Phase 4 if needed, but landing 12/12 201s on the manual /api/public/ingestion path is the primary win.
<!-- section:open-questions:end -->

<!-- section:read-watermark:start -->
Last read INDEX at: 2026-04-25T19:15:00-04:00
<!-- section:read-watermark:end -->
