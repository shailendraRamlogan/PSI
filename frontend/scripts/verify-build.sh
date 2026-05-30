#!/usr/bin/env bash
# Pre-start build verification.
# Ensures .next build is current with the latest git commit.
# Prevents silently serving a stale .next directory after a failed build.
set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_STAMP="$FRONTEND_DIR/.next/build-stamp.txt"
NEXT_DIR="$FRONTEND_DIR/.next"

# 1. Check .next/BUILD_ID exists (basic build sanity)
if [ ! -f "$NEXT_DIR/BUILD_ID" ]; then
  echo "[verify-build] ERROR: .next/BUILD_ID missing — no production build found."
  echo "[verify-build] Run 'npm run build' in the frontend directory before starting."
  exit 1
fi

# 2. Compare build stamp against current git HEAD
cd "$FRONTEND_DIR"
CURRENT_HASH=$(git -C "$FRONTEND_DIR" rev-parse --short HEAD 2>/dev/null || echo "no-git")

if [ -f "$BUILD_STAMP" ]; then
  STORED_HASH=$(cat "$BUILD_STAMP")
  if [ "$CURRENT_HASH" = "no-git" ]; then
    echo "[verify-build] WARN: Not in a git repo, skipping hash check."
    echo "[verify-build] Build ID: $(cat "$NEXT_DIR/BUILD_ID")"
    exit 0
  fi
  if [ "$STORED_HASH" != "$CURRENT_HASH" ]; then
    echo "[verify-build] ERROR: Build is stale!"
    echo "[verify-build]   Build was from commit: $STORED_HASH"
    echo "[verify-build]   Current HEAD is:       $CURRENT_HASH"
    echo "[verify-build] Run 'npm run build' and restart."
    exit 1
  fi
  echo "[verify-build] OK — build matches HEAD ($CURRENT_HASH)"
else
  echo "[verify-build] WARN: No build-stamp.txt found (first build or legacy)."
  echo "[verify-build] Build ID: $(cat "$NEXT_DIR/BUILD_ID")"
  echo "[verify-build] Run 'npm run build' to generate a tracked build."
fi

exit 0
