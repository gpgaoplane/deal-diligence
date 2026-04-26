---
status: active
type: state
owner: claude
last-updated: 2026-04-25T20:45:00-04:00
read-if: "you need to know Claude's current live work state"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Live State

<!-- section:current-state:start -->
**Branch:** `main` (53+ commits ahead of origin/main; not pushed).
**Active task:** **Phase 4 entry in progress.** Workflow at `versionId: phase3-session2-v21` (Memo + Evaluator prompts both fixed for qwen3-max-preview eager-bypass pattern, P-5 added). Step 1 of Phase 4 entry plan ✅ COMPLETE: `evaluator_score: 0` anomaly debugged → root-caused to Memo prompt's global-bypass interpretation on qwen3-max-preview → fixed → live CoreWeave re-run produces 58/60 Evaluator score (same quality as prior `qwen3-max-2026-01-23` baseline restored). Step 2 partial: meta-eval option (a) ran but failed gap target — the empty-upstream test is structurally anti-discriminative because the rich fixture content has nothing to validate against. Confirmed the Evaluator change is a SOUNDNESS fix (preemptive bypass bug) not a regression risk; safe to keep.
**Pause point:** Awaiting Will to: (1) re-run live workflow to confirm Evaluator change doesn't regress 58/60; (2) capture 5 node outputs from the live CoreWeave run to enable option (c): real-upstream meta-eval. Walk-through pending in next user turn.
**Blockers:** None — empirical proof that meta-eval option (a) is a dead end means option (c) is the operative path forward.
<!-- section:current-state:end -->

<!-- section:next-steps:start -->
1. **Phase 4 step 1 ✅ COMPLETE** — `evaluator_score: 0` debugged and fixed. Memo Generation prompt rules 7–8 + silent checks (commit `60c4cc2`); Evaluator prompt empty-upstream handling + reactive all-zero (commit pending). 58/60 live behavior restored.
2. **Phase 4 step 2 (in progress) — meta-eval discrimination ≥ 20.** Option (a) empty-upstream sanity check ran; failed gap target (45/48 with bad ≥ good — anti-discriminative). Moving to **option (c): real upstream from CoreWeave run**. Capture 5 node outputs from the live workflow, save as JSON fixture files under `test-cases/meta-eval/upstream/`, re-run `scripts/run-meta-eval.js --extraction <path> --contradictions <path> --gaps <path> --red-flags <path> --portfolio-fit <path>`. Both meta-eval fixtures are CoreWeave memos so this pairing is methodologically sound.
3. **Phase 4 step 3 (after step 2 closes) — quality backlog.** RFD `MATERIAL_WEAKNESS_POS` regex verb-forms; Memo HIGH-on-strength miscalibration; Extraction S-1 recall regressions.
4. **Phase 5** — Cerebras generalization (re-run pipeline against the 4 Cerebras docs, no code changes expected).
5. **Phase 6** — demo + 250-word written explanation.
6. **Phase 7** — submission to Pari.
7. **Other backlog (do not gate forward):**
   - Cosmetic: `supabase_id` missing from Slack footer (n8n unwraps single-row REST response).
   - Codex post-commit reviews of medium-stakes prompts (Gap Analysis, Portfolio Fit, Evaluator).
   - 3.12 schema-validation-with-retry machinery DEFERRED — parsers' shape projection sufficient for prototype.
   - Consider proactive empty-shell audit of Gap Analysis + Portfolio Fit prompts per P-5 regression-test guidance (may have same eager-bypass risk on qwen3-max-preview).
<!-- section:next-steps:end -->

<!-- section:open-questions:start -->
- **`evaluator_score: 0` on qwen3-max-preview** — first thing to debug at Phase 4 start. Check whether `criteria_scores` are present-but-malformed vs absent in the raw Evaluator response. Parser at `Parse Evaluator Response` computes `sum(criteria_scores)` authoritatively; if criteria_scores parse fails, default cascade lands at 0 → forces flagged_for_review. Could also be a prompt-shape issue specific to qwen3-max-preview's JSON-mode output.
- **Doubled-prompt surface** (D-6 cost flag): `scripts/inject-prompts.js` is the safety net. Run it (or `--check`) any time `prompts/*.md` changes to keep workflow.json in sync. Contradiction prompt intentionally excluded from inject-prompts.
- **Langfuse trace metadata richness:** trace currently captures token usage + model + run_id. Could add per-observation input/output redaction policy in Phase 4 if needed, but landing 12/12 201s on the manual /api/public/ingestion path is the primary win.
<!-- section:open-questions:end -->

<!-- section:read-watermark:start -->
Last read INDEX at: 2026-04-25T19:15:00-04:00
<!-- section:read-watermark:end -->
