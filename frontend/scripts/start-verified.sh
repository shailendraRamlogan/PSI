#!/usr/bin/env bash
# PM2 entry point for psi-frontend.
# Verifies the .next build is current, then execs into `next start`.
# Uses exec so PM2 can manage the node process lifecycle (signals, etc).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Step 1: Verify build is current ──
if ! bash "$DIR/verify-build.sh"; then
  echo "[start-verified] Build verification FAILED — refusing to start."
  echo "[start-verified] Run 'cd frontend && npm run build' then restart."
  sleep 5
  exit 1
fi

# ── Step 2: Start Next.js ──
exec npx next start -p "${PORT:-3001}" -H "${HOST:-0.0.0.0}"
