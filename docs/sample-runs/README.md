---
status: active
type: sample-runs-index
owner: shared
last-updated: 2026-04-26T16:45:00-04:00
read-if: "you want to see captured outputs from end-to-end runs without running the workflow yourself"
skip-if: "you have n8n running locally"
---

# Sample Runs

Captured node outputs from validated end-to-end workflow runs. These are the proof-of-work artifacts referenced in `docs/submission-writeup.md`.

## Files

| File | Source | What it shows |
|---|---|---|
| `coreweave-58of60-memo.json` | run_id `14297a4c-...` | Memo Generation output that scored 58/60 — the high-water-mark example |
| `coreweave-58of60-evaluator.json` | run_id `14297a4c-...` | Six-criteria evaluator scores corresponding to the memo above |
| `coreweave-rfd-output.json` | run_id `75ba2ad5-...` | Red Flag Detector output showing 5 flags (3 from S-1 after the P-6 wrapper fix); demonstrates 8-of-10 functional detector coverage on CoreWeave |
| `cerebras-rfd-output.json` | Phase 5 generalization run | RFD output on a different deal packet — demonstrates that the regulatory-only detectors fire correctly on an unseen deal (OpenAI Warrant, dual-class structure) |
| `cerebras-extraction-s1.json` | Phase 5 generalization run | Cerebras S-1 ExtractionOutput showing populated financials (cash, operating loss, competitors) — demonstrates retrieval-query refinements landed in Phase 4 step 3c generalize |

## How to capture more

For any new live run in n8n:

1. After the workflow completes, click into the **Executions** tab and select the run
2. For each node listed below, click → **Output** → copy the JSON → save under `docs/sample-runs/<deal>-<node>.json`
3. Stage and commit with `[demo] capture <deal> sample run for submission`

**Recommended nodes to capture per run:**
- Parse Extraction Response (one item per source — capture as `<deal>-extraction.json`, the 4-element array)
- Parse Contradiction Response (`<deal>-contradiction.json`)
- Parse Gap Analysis Response (`<deal>-gap-analysis.json`)
- Run Red Flag Detector (`<deal>-rfd.json`)
- Parse Portfolio Fit Response (`<deal>-portfolio-fit.json`)
- Parse Memo Response (`<deal>-memo.json`) — this is the headline artifact
- Parse Evaluator Response (`<deal>-evaluator.json`)

## Privacy / sensitivity note

Sample runs are over PUBLIC documents (S-1 filings, public press releases, public analyst reports). No PII, no internal Sagard data, no credentials. Safe to include in a public-facing repo.

## Empty state

This directory is intentionally empty at submission time. To populate it, either:
- Capture during the Loom recording per `docs/demo-runbook.md`, OR
- Re-run any prior validated execution from n8n's Executions tab and capture the outputs as JSON
