#!/bin/bash
# scripts/down.sh — tear down local n8n stack (preserves volume)
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Stopping n8n..."
docker compose down

echo "Done. Workflow data in ./n8n/n8n-data/ is preserved."
echo "To wipe data: rm -rf ./n8n/n8n-data"
