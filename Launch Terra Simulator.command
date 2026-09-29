#!/usr/bin/env bash
# Double-click this file (in Finder) to open Terra on the iOS Simulator.
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

if ! command -v xcrun >/dev/null 2>&1; then
  echo "Xcode / iOS Simulator not found."
  echo "Install Xcode from the App Store, then run: xcode-select --install"
  read -r -p "Press Enter to close…"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run)…"
  npm install
fi

echo "Opening Terra on the iOS Simulator…"
echo
npx expo start --ios --clear
status=$?
if [ $status -ne 0 ]; then
  echo
  echo "Launch failed (exit $status)."
  read -r -p "Press Enter to close…"
  exit $status
fi
