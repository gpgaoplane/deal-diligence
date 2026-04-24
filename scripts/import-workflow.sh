#!/bin/bash
# scripts/import-workflow.sh — import n8n/workflow.json into local n8n
# Uses n8n's CLI inside the container.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f n8n/workflow.json ]; then
  echo "ERROR: n8n/workflow.json not found. Phase 3 task 3.15 creates it." >&2
  exit 1
fi

echo "Importing n8n/workflow.json into running n8n container..."
docker compose exec -T n8n n8n import:workflow --input=/home/node/.n8n/../.. < n8n/workflow.json 2>&1 || \
  (echo "Falling back to file-copy-then-import..."; \
   docker compose cp n8n/workflow.json n8n:/tmp/workflow.json && \
   docker compose exec -T n8n n8n import:workflow --input=/tmp/workflow.json)

echo "Done. Open http://localhost:5678 to verify."
