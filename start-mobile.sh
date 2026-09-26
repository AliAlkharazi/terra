#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/mobile"
if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run)…"
  npm install
fi
echo "Starting Terra…"
npx expo start
