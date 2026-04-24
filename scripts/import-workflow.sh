#!/bin/bash
# scripts/import-workflow.sh — import n8n/workflow.json into the running n8n container.
#
# Approach: docker compose cp the JSON into /tmp inside the container, then
# run `n8n import:workflow --input=/tmp/workflow.json`.
#
# MSYS_NO_PATHCONV=1 is essential on Windows Git Bash — without it, MSYS
# rewrites the Unix-style /tmp/workflow.json path to the host's Windows temp
# dir (C:/Users/<user>/AppData/Local/Temp/workflow.json) BEFORE the command
# reaches docker, which then tries to open it inside the container and fails
# with ENOENT.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f n8n/workflow.json ]; then
  echo "ERROR: n8n/workflow.json not found. Phase 3 task 3.1+ creates it." >&2
  exit 1
fi

# Verify the container is up (use docker compose ps tabular output — more portable than --format json).
if ! docker compose ps n8n 2>/dev/null | grep -qE '\bUp\b|running'; then
  echo "ERROR: n8n container is not running. Run ./scripts/up.sh first." >&2
  echo "       Current state:" >&2
  docker compose ps n8n >&2 || true
  exit 1
fi

echo "[1/3] Copying n8n/workflow.json → container:/tmp/workflow.json ..."
docker compose cp n8n/workflow.json n8n:/tmp/workflow.json

echo "[2/3] Importing via n8n CLI ..."
# MSYS_NO_PATHCONV=1 disables Git Bash's automatic /path ↔ C:\path conversion.
# Without this, /tmp/workflow.json gets rewritten on Windows.
MSYS_NO_PATHCONV=1 docker compose exec -T n8n n8n import:workflow --input=/tmp/workflow.json

echo "[3/3] Cleaning up temp file in container ..."
MSYS_NO_PATHCONV=1 docker compose exec -T n8n rm -f /tmp/workflow.json

echo ""
echo "Done. Open http://localhost:5678 — the workflow should appear in the workflows list."
echo "  1. Open the workflow."
echo "  2. Click 'Active' toggle (top-right) to register the webhook."
echo "  3. Submit form at the Form Trigger's webhook URL."
