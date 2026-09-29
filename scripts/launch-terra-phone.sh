#!/usr/bin/env bash
# Start Terra for a physical phone via Expo Go (tunnel).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/mobile"

cd "$MOBILE"

if [ ! -d node_modules ]; then
  echo "Installing mobile dependencies (first run)…"
  npm install
fi

echo "Starting Terra for your phone (Expo tunnel)…"
echo "Repo: $ROOT"
echo
echo "On your iPhone:"
echo "  1. Open Expo Go"
echo "  2. Scan the QR code shown below  — or —"
echo "  3. Use the iOS Shortcut 'Open Terra' if you already saved the link"
echo
echo "Keep this window open while you use the app."
echo

# Tunnel so the phone can reach Metro off your LAN / with carrier data.
exec npx expo start --tunnel --clear
