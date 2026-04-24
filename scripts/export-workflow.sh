#!/bin/bash
# scripts/export-workflow.sh — export active workflow from n8n → n8n/workflow.json.
#
# Run after ANY UI change so workflow.json stays canonical (invariant I-5).
#
# MSYS_NO_PATHCONV=1 is essential on Windows Git Bash (see import-workflow.sh).
#
# Usage:
#   ./scripts/export-workflow.sh              # exports workflow named "deal-diligence"
#   ./scripts/export-workflow.sh other-name   # exports a different-named workflow
set -euo pipefail

cd "$(dirname "$0")/.."

WORKFLOW_NAME="${1:-deal-diligence}"

if ! docker compose ps n8n 2>/dev/null | grep -qE '\bUp\b|running'; then
  echo "ERROR: n8n container is not running. Run ./scripts/up.sh first." >&2
  exit 1
fi

echo "[1/3] Looking up workflow '${WORKFLOW_NAME}' in n8n..."
# n8n export:workflow supports --all (to export everything) or --id=<id>.
# Since we have a stable name, list all workflows and grep for the ID.
ALL_JSON=$(MSYS_NO_PATHCONV=1 docker compose exec -T n8n n8n export:workflow --all --pretty 2>/dev/null || true)
if [ -z "$ALL_JSON" ]; then
  echo "ERROR: no workflows to export. Run ./scripts/import-workflow.sh first?" >&2
  exit 1
fi

# Parse JSON to find the workflow ID matching the name.
WORKFLOW_ID=$(printf '%s' "$ALL_JSON" | python -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    for w in data:
        if w.get('name') == '${WORKFLOW_NAME}':
            print(w.get('id', ''))
            break
except Exception as e:
    sys.stderr.write(f'parse error: {e}\n')
" || true)

if [ -z "$WORKFLOW_ID" ]; then
  echo "ERROR: workflow '${WORKFLOW_NAME}' not found in n8n." >&2
  echo "       Available workflows:" >&2
  printf '%s' "$ALL_JSON" | python -c "
import sys, json
d = json.loads(sys.stdin.read())
for w in d:
    print(f'         - {w.get(\"name\",\"?\")} (id={w.get(\"id\",\"?\")})')" >&2
  exit 1
fi

echo "       Found workflow id=${WORKFLOW_ID}"

echo "[2/3] Exporting to container:/tmp/workflow.json ..."
MSYS_NO_PATHCONV=1 docker compose exec -T n8n n8n export:workflow \
  --id="${WORKFLOW_ID}" --output=/tmp/workflow.json --pretty

echo "[3/3] Copying container:/tmp/workflow.json → n8n/workflow.json ..."
mkdir -p n8n
docker compose cp n8n:/tmp/workflow.json n8n/workflow.json
MSYS_NO_PATHCONV=1 docker compose exec -T n8n rm -f /tmp/workflow.json

echo ""
echo "Exported to n8n/workflow.json"
echo "Review diff: git diff -- n8n/workflow.json"
