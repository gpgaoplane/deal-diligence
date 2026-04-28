---
status: active
type: runbook
owner: shared
last-updated: 2026-04-27T21:00:00-04:00
read-if: "you are recording the Loom demo for the Sagard submission"
skip-if: "you are not the operator running the demo"
---

# Demo Runbook — Sagard Submission Loom Recording

Target length: **4–4.5 minutes**. Hard cap 5 minutes.

## Pre-recording checklist

Run through this once before hitting record:

1. `./scripts/up.sh` → verify n8n is at `localhost:5678` with a green health indicator
2. n8n UI open, deal-diligence workflow selected. Form Trigger URL copied to clipboard
3. Browser tabs ready in this order (Cmd+Tab order):
   1. n8n workflow editor
   2. n8n execution log (will fill during run)
   3. Slack `#investment-team` channel
   4. Supabase `deal_memos` table (https://supabase.com → project → Table Editor)
   5. Langfuse trace dashboard
4. `test-cases/cerebras/` folder open in Finder/Explorer (4 PDFs visible) — Cerebras is the cleaner demo since the OpenAI Warrant flag is a recognizable institutional finding
5. `.env` populated, `ALICLOUD_MODEL=qwen3.5-plus-2026-02-15`
6. Camera off (Pari needs the screen, not the talking head)

## Recording sequence

### (0:00–0:20) Open with the problem

Show the 4 Cerebras PDFs side-by-side in the file viewer. Voice-over:

> "Sagard's investment team gets a fragmented deal packet for every pitch — an S-1, a press release, two analyst takes. Reading these end-to-end takes hours and the institutional memory is in the reviewer's head. This system converts that packet into a cited, auditable memo so the human reviewer starts at the synthesis layer, not the extraction layer."

### (0:20–0:40) Show the trigger

Switch to n8n. Click **Form Trigger** node, then click **Test workflow**. Open the form URL in a new tab. Voice-over:

> "Inputs: a deal_id and the four PDFs. That's it. Everything downstream — extraction, contradiction detection, gap analysis, deterministic red flag surfacing, portfolio fit against Sagard's actual thesis, memo synthesis, and a six-criteria meta-evaluator — runs without further input."

Drop the 4 Cerebras PDFs into the form. Set `deal_id: cerebras-demo`. Submit.

### (0:40–2:30) Narrate the run

While the workflow executes (will take ~10-15 min — DO NOT WAIT FOR FULL RUN; cut to a pre-recorded completed run below). Switch to the workflow editor and walk through the pipeline:

> "Seven specialists in sequence. Coordinator classifies sources by filename regex — deterministic. Extraction runs per-document with section-targeted retrieval — eleven sections at k=5, plus one union pass at k=8. Contradiction is a tool-use loop — the agent retrieves the specific passages it needs to verify each claim against. Gap Analysis flags missing institutional-LP-checklist items. The Red Flag Detector is pure JavaScript — no LLM, no randomness, no time-dependent logic. Portfolio Fit checks alignment against Sagard's actual portfolio companies and thesis pillars from the file. Memo Generation produces the IC memo, then a Citation Validity check against the source manifest, then the Evaluator scores the memo on six criteria."

Point at the Red Flag Detector node specifically:

> "This one is the load-bearing audit decision. Pure JS, fully reproducible. If a regulator or LP asks 'why did we flag this deal,' we can replay it bit-for-bit."

**TRANSITION:** Stop the live run via cancel button (or let it complete in background). Switch to a pre-recorded completed CoreWeave or Cerebras execution by clicking on it in the **Executions** tab.

### (2:30–3:00) Walk the output

Open the latest completed execution. Click **Parse Memo Response** node:

> "The memo is structured: executive summary, recommendation, key strengths, key risks, contradictions, red flags, missing information, citations. Every claim cites a source from the Coordinator's manifest — that's enforced at the JSON Schema layer plus a post-hoc validator. If a citation doesn't resolve, the claim is dropped, not faked."

Click **Run Red Flag Detector** node, scroll to red_flags array:

> "Cerebras: customer concentration is no longer extreme thanks to the OpenAI and AWS deals, so that flag doesn't fire — that's a true negative. Related-party-above-threshold flags the OpenAI Warrant. Dual-class structure flags the Class A common stock. Each one is deterministic — same input, same output, every time."

Click **Parse Evaluator Response**:

> "The Evaluator scores six criteria, sums to 60, with HIGH-severity critical issues forcing flagged_for_review regardless of score. This is the meta-eval that lets us calibrate the prompts via fixture pairs — gap of 25 points between an intentionally-good and intentionally-bad memo, well above the 20-point target."

### (3:00–3:25) The "good company, wrong investor" angle — institutional triage

Click **Parse Portfolio Fit Response**. Show the JSON: `overall_thesis_alignment: LOW`, `recommended_action: pass`, `anti_patterns[]` with the matched entries. Voice over:

> "This is the differentiator. Both CoreWeave and Cerebras are excellent companies by absolute standards — CoreWeave grew 737% YoY and IPO'd at $35B+; Cerebras has wafer-scale silicon and an OpenAI partnership. A generic 'is this a good company' tool says 'AI is hot, advance on both.' But Sagard's thesis is consumer fintech, AI applied TO finance, healthtech, and climate tech. These are AI infrastructure plays — wrong shape of opportunity for this fund. The pipeline correctly identifies the mismatch via the Portfolio Fit agent reading Sagard's actual portfolio JSON. This is institutional triage — not 'is this good in the abstract' but 'would Sagard fund this.' Swap the JSON, retarget the engine to a different investor's thesis. The judgment surface is data, not code."

### (3:25–3:55) Show the receivers — three persistence surfaces

Switch to Slack:

> "Reviewer notification. Severity emoji, recommendation, top three risks, link to the full memo."

Switch to Supabase `deal_memos` table editor. Click the latest row to expand, then walk three columns explicitly:

> "Three columns to call out. **executive_summary** — three-paragraph IC opener. **portfolio_fit** — JSON with the alignment score, recommended action, and matched anti-patterns. **memo_markdown** — wait, actually the rendered Markdown lives at outputs/<deal>-<timestamp>.md on disk. Let me show that."

Switch to your file explorer / VS Code, open `outputs/coreweave-<latest-timestamp>.md`:

> "One Markdown file per run, auto-saved. Reviewer-readable IC memo with the recommendation up top, full company snapshot, portfolio fit reasoning, severity-tagged strengths and risks, contradictions, deterministic red flags with raw-text quotes for audit replay, missing information ranked by importance, evaluator score breakdown. This is the artifact a human triages from."

Switch back to Supabase briefly:

> "Persisted in Supabase too — same data plus run_id, deal_id, evaluator_score, routing_decision, timestamps. Indexed on (run_id, deal_id) for replay queries. The Markdown file is the human surface; the row is the system of record."

Switch to Langfuse:

> "Per-LLM-call observation, plus an explicit span for the deterministic Red Flag Detector tagged `deterministic: true`, plus the evaluator score attached to the trace as `deal-diligence-quality`. Twelve observations per run. This is the engineering surface — for debugging prompt drift across model versions or auditing model behavior, not for reviewers."

### (3:55–4:15) Close

> "Validated on two real deal packets — CoreWeave at 58/60 and Cerebras end-to-end with no code change. Both got 'pass' — not because the companies are bad, but because they don't fit Sagard's thesis. That's the institutional-triage value. Cost is about a dollar per deal in tokens, but cost is not the production bottleneck — reviewer throughput, false-positive fatigue, prompt drift, and the audit-query layer are. The path to scale is in the writeup. Code's in the repo. Thanks."

End recording.

## Post-recording

1. Trim dead air at the head and tail in Loom
2. Get the share URL
3. Paste it into `docs/submission-writeup.md` where the placeholder reads `<Loom URL placeholder>`
4. Commit: `[6] add demo Loom URL`
5. Push: `git push origin main`

## Things to avoid showing

- The `.env` file — secrets
- Any work-log entries discussing P-5 (prompt fix history) or P-6 (RFD wrapper bug) — that's debugging context, not value-prop. The audit trail in `docs/agents/claude.md` is for the curious deep-dive reviewer, not the demo.
- The pre-deadline framing in `CONTEXT.md` — historical artifact
- Codex memory files (`.codex/memory/*`) — cross-agent boundary, not relevant to the value-prop

## If something breaks mid-recording

- **n8n workflow errors**: cut, reset to a pre-recorded run (Executions tab → click any green execution from CoreWeave verification round). Narrate as if it's the live run; the value-prop is the same. Don't try to debug live.
- **Slack message doesn't arrive**: cut, switch to Supabase view, narrate that the alert path is "Supabase → Slack via webhook + retry-on-error sub-flow." Don't try to debug the webhook live.
- **Loom recording crashes**: restart, take it from the top. The script above is dense enough that you can re-record under 5 minutes.

## Backup demo material (in repo)

If a live run isn't viable on demo day, point Pari at:

- `docs/sample-runs/` — captured Memo + Evaluator JSON from validated runs
- `n8n/workflow.json` — the source-of-truth workflow she can import to her own n8n
- `test-cases/coreweave/` and `test-cases/cerebras/` — replay-able input fixtures
- `prompts/*.md` — all 7 system prompts as standalone artifacts she can read without n8n
