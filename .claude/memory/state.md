---
status: active
type: state
owner: claude
last-updated: 2026-04-25T21:30:00-04:00
read-if: "you need to know Claude's current live work state"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Live State

<!-- section:current-state:start -->
**Branch:** `main` (54+ commits ahead of origin/main; not pushed).
**Active task:** **Phase 4 entry COMPLETE — meta-eval discrimination gap target hit (25 points; target ≥ 20).** Workflow at `versionId: phase3-session2-v21`. Both Memo + Evaluator prompts now hardened against qwen3-max-preview eager-bypass (P-5). Three Phase 4 artifacts committed: (1) Memo prompt anti-empty-shell rules + silent checks (`60c4cc2`); (2) Evaluator empty-upstream handling + reactive all-zero (commit pending); (3) 5 upstream fixture files + run-meta-eval.js projection patch + this state update (next commit).

Phase 4 step 2 final result on real CoreWeave upstream:
- good_score = 53/60 → routing: complete_high_confidence
- bad_score  = 28/60 → routing: flagged_for_review  ✓ < 35 threshold
- discrimination_gap = 25  (target ≥ 20: ✓ PASS)
- bad fixture's 4 textbook defects all detected as HIGH critical_issues
- reasoning_coherence carries 8 points of the gap (strategic incoherence test working)

**Pause point:** Phase 4 step 3 (CoreWeave dev iteration on quality backlog: RFD verb-form, Memo HIGH-on-strength miscalibration, Extraction recall regressions) — open for next user direction. Phases 5–7 (Cerebras generalization → demo → submission) all unlocked.
**Blockers:** None.
<!-- section:current-state:end -->

<!-- section:next-steps:start -->
1. **Phase 4 step 1 ✅ COMPLETE** — `evaluator_score: 0` debugged. Memo prompt anti-empty-shell rules (commit `60c4cc2`).
2. **Phase 4 step 2 ✅ COMPLETE** — meta-eval discrimination = 25 (target ≥ 20). Evaluator empty-upstream handling (commit `077b9b2`); 5 upstream fixture files + `run-meta-eval.js` projection patch (next commit).
3. **Phase 4 step 3 (next) — CoreWeave quality backlog.** Top items: (a) RFD `MATERIAL_WEAKNESS_POS` regex misses "exist" / "remain" / "are present" verb forms; (b) Memo HIGH-on-strength miscalibration for "74% gross margin"; (c) Extraction S-1 recall regressions for `headcount`, `key_personnel`, exact revenue values.
4. **Phase 5** — Cerebras generalization (re-run pipeline against the 4 Cerebras docs; no code changes expected).
5. **Phase 6** — demo + 250-word written explanation.
6. **Phase 7** — submission to Pari.
7. **Other backlog (do not gate forward):**
   - Cosmetic: `supabase_id` missing from Slack footer (n8n unwraps single-row REST response).
   - Codex post-commit reviews of medium-stakes prompts (Gap Analysis, Portfolio Fit, Evaluator).
   - 3.12 schema-validation-with-retry machinery DEFERRED — parsers' shape projection sufficient for prototype.
   - Consider proactive empty-shell audit of Gap Analysis + Portfolio Fit prompts per P-5 regression-test guidance (same eager-bypass risk on qwen3-max-preview).
   - Reduce empty-upstream meta-eval setup limitation — currently option (a) of meta-eval is anti-discriminative on rich fixtures; document as a script limitation or add a "skip if upstream empty" mode.
<!-- section:next-steps:end -->

<!-- section:open-questions:start -->
- **`evaluator_score: 0` on qwen3-max-preview** — first thing to debug at Phase 4 start. Check whether `criteria_scores` are present-but-malformed vs absent in the raw Evaluator response. Parser at `Parse Evaluator Response` computes `sum(criteria_scores)` authoritatively; if criteria_scores parse fails, default cascade lands at 0 → forces flagged_for_review. Could also be a prompt-shape issue specific to qwen3-max-preview's JSON-mode output.
- **Doubled-prompt surface** (D-6 cost flag): `scripts/inject-prompts.js` is the safety net. Run it (or `--check`) any time `prompts/*.md` changes to keep workflow.json in sync. Contradiction prompt intentionally excluded from inject-prompts.
- **Langfuse trace metadata richness:** trace currently captures token usage + model + run_id. Could add per-observation input/output redaction policy in Phase 4 if needed, but landing 12/12 201s on the manual /api/public/ingestion path is the primary win.
<!-- section:open-questions:end -->

<!-- section:read-watermark:start -->
Last read INDEX at: 2026-04-25T19:15:00-04:00
<!-- section:read-watermark:end -->
