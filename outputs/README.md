---
status: active
type: outputs-readme
owner: shared
last-updated: 2026-04-26T18:00:00-04:00
read-if: "you want to know what lands in this directory"
skip-if: "never"
---

# outputs/

This directory receives one Markdown memo file per workflow run, auto-saved by the n8n workflow.

**File naming:** `<deal_id>-<YYYYMMDD-HHMMSS>.md`

**Mechanism:** the n8n container mounts this host directory at `/outputs/` (see `docker-compose.yml`). Mounted at `/outputs` (sibling of `/files`) rather than `/files/outputs` because the `/files` mount is read-only and Docker cannot create mountpoints inside read-only filesystems. The workflow's `Build Markdown Memo` node renders the structured memo + evaluator + RFD + portfolio fit into a single Markdown document, and the `Write Memo File` node writes it via the n8n Read/Write File node.

**Generated `.md` files are gitignored** (per `.gitignore`); only this README is committed. To share a memo, copy the file or commit it explicitly.

**Re-running a deal** produces a new file with a fresh timestamp; it does not overwrite earlier runs.

**To disable auto-save:** comment out the `Write Memo File` node in `n8n/workflow.json` (or unmount the volume in `docker-compose.yml`); the rest of the pipeline (Slack + Supabase + Langfuse) is unaffected.
