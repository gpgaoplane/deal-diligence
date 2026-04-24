#!/bin/bash
# scripts/up.sh — start local n8n stack
# Per implementation plan §5, task 2.12.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERROR: .env not found at repo root. Copy .env.example and fill in secrets." >&2
  exit 1
fi

echo "Starting n8n via docker compose..."
docker compose up -d

echo ""
echo "Waiting for n8n to accept connections on :5678..."
for i in {1..30}; do
  if curl -sf -o /dev/null -w "%{http_code}" http://localhost:5678/healthz 2>/dev/null | grep -q "200"; then
    echo "n8n is up."
    break
  fi
  if [ $i -eq 30 ]; then
    echo "WARNING: n8n did not become healthy within 30s. Check 'docker compose logs n8n'." >&2
    exit 1
  fi
  sleep 1
done

echo ""
echo "n8n UI:   http://localhost:5678"
echo "Basic auth user: admin (password from .env)"
echo "Logs:     docker compose logs -f n8n"
echo "Tear down: ./scripts/down.sh"
