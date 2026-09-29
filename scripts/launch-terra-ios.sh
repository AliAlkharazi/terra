#!/usr/bin/env bash
# Launch Terra on the iOS Simulator (macOS + Xcode required).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/mobile"

cd "$MOBILE"

if [ ! -d node_modules ]; then
  echo "Installing mobile dependencies (first run)…"
  npm install
fi

# Prefer the local Metro cache; open iOS Simulator and install/open Expo Go.
echo "Starting Terra on iOS Simulator…"
echo "Repo: $ROOT"
echo

exec npx expo start --ios --clear
