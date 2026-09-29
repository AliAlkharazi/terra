#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/mobile"
if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run)…"
  npm install
fi

case "${1:-}" in
  --ios|ios)
    echo "Starting Terra on iOS Simulator…"
    exec npx expo start --ios
    ;;
  --android|android)
    echo "Starting Terra on Android emulator…"
    exec npx expo start --android
    ;;
  --phone|phone|--tunnel|tunnel)
    echo "Starting Terra for physical phone (tunnel)…"
    exec npx expo start --tunnel
    ;;
  *)
    echo "Starting Terra…"
    exec npx expo start
    ;;
esac
