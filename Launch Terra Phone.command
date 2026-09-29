#!/usr/bin/env bash
# Double-click (Finder) to start Terra for your physical iPhone via Expo Go.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
MOBILE="$ROOT/mobile"

if [ ! -d "$MOBILE" ]; then
  echo "No mobile/ folder next to this file."
  echo "Put this .command inside your terra project folder, then try again."
  read -r -p "Press Enter to close…"
  exit 1
fi

cd "$MOBILE"

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run)…"
  npm install
fi

echo "══════════════════════════════════════════════"
echo "  Terra → iPhone (Expo Go + tunnel)"
echo "══════════════════════════════════════════════"
echo
echo "1. Keep this Terminal window open."
echo "2. On iPhone open Expo Go and scan the QR code."
echo "3. Tip: after the first successful open, create an iOS Shortcut"
echo "   that opens the exp:// link so next time is one tap."
echo "   (Shortcuts app → Open URL → paste the exp:// link from below)"
echo

npx expo start --tunnel --clear
status=$?
if [ $status -ne 0 ]; then
  echo
  echo "Launch failed (exit $status)."
  echo "Check: Expo Go installed, internet OK, npx/expo available."
  read -r -p "Press Enter to close…"
  exit $status
fi
