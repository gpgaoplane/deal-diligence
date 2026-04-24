#!/bin/bash
# scripts/export-workflow.sh — export active workflow from n8n → n8n/workflow.json
# Run after any UI change so workflow.json (source of truth per invariant I-5)
# stays in sync with the running instance.
set -euo pipefail

cd "$(dirname "$0")/.."

# Workflow name is 'deal-diligence' per Phase 3 convention.
# If a different name is used, pass it as first arg: ./scripts/export-workflow.sh "other-name"
WORKFLOW_NAME="${1:-deal-diligence}"

echo "Exporting workflow '${WORKFLOW_NAME}' from n8n container..."
mkdir -p n8n
docker compose exec -T n8n n8n export:workflow --output=/tmp/workflow.json --pretty \
  --id="$(docker compose exec -T n8n n8n export:workflow --all --pretty 2>/dev/null | \
    python -c "import sys,json; [print(w['id']) for w in json.loads(sys.stdin.read()) if w.get('name')=='${WORKFLOW_NAME}']" | head -1)"

docker compose cp n8n:/tmp/workflow.json n8n/workflow.json

echo ""
echo "Exported to n8n/workflow.json"
echo "Review diff: git diff -- n8n/workflow.json"
