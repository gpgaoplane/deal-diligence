---
status: active
type: pitfalls
owner: codex
last-updated: 2026-04-25T01:31:21-04:00
read-if: "you are touching an area Codex has flagged before"
skip-if: "status != active or last-updated <= your watermark"
---

# Codex — Pitfalls

Append new pitfalls below. Format:

```
## P-<n> — <title> — <ISO-8601>
**Symptom:**
**Root cause:**
**Workaround:**
**Regression test:**
```

<!-- section:entries:start -->
## P-1 — This repo's framework install lacks the upstream catch-up / presence helper scripts — 2026-04-24T21:35:09-04:00

**Symptom:**
The `multi-agent-collab` docs reference helper commands like `collab-catchup`, `collab-presence`, and repo-local `scripts/collab-*.sh`, but this repo's `scripts/` directory only contains the n8n lifecycle helpers (`up.sh`, `down.sh`, `import-workflow.sh`, `export-workflow.sh`).

**Root cause:**
The collaboration framework files and contracts are present, but this particular bootstrap state does not include the optional helper scripts locally. That means the rules are still valid, but the command-path advertised by upstream docs is only partially available in-repo.

**Workaround:**
Follow `AI_AGENTS.md` manually:
- read `INDEX.md`
- read Codex memory
- delta-read newer Claude-owned files
- check git status / recent commits
- update `.codex/memory/state.md` and, when relevant, shared files like `.collab/ACTIVE.md`

Do not block onboarding on a missing helper script if the underlying framework files already exist.

**Regression test:**
Before assuming a framework helper exists, verify the script or command is actually present in this repo. If not, execute the protocol manually and document the workaround in the Codex work log / memory.

## P-2 — Changing `ALICLOUD_MODEL` is an env reload problem, not a workflow-import problem — 2026-04-25T01:31:21-04:00

**Symptom:**
You update `.env` from one DashScope model ID to another and expect the next n8n run to use it immediately, but the workflow still behaves like the old model is active.

**Root cause:**
The workflow nodes are already parameterized correctly with `{{ $env.ALICLOUD_MODEL }}`. The stale behavior comes from the running n8n container still holding the old env values in memory, not from old JSON inside `n8n/workflow.json`.

**Workaround:**
After changing `.env`, restart n8n (`./scripts/down.sh` then `./scripts/up.sh`, or `docker compose down` / `up -d`). Do not waste time re-importing the workflow just for a model-name swap unless the workflow JSON itself changed for some other reason.

**Regression test:**
After restart, confirm the last node output reports the expected `llm_model` value from the new env var.
<!-- section:entries:end -->
