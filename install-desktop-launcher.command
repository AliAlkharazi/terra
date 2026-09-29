#!/usr/bin/env bash
# Double-click on a Mac to put "Launch Terra Simulator" on your Desktop.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DEST="${HOME}/Desktop/Launch Terra Simulator.command"

mkdir -p "${HOME}/Desktop"

cat > "$DEST" <<EOF
#!/usr/bin/env bash
# Terra — one-click iOS Simulator launch
set -euo pipefail

ROOT="$ROOT"
MOBILE="\$ROOT/mobile"

cd "\$MOBILE" || {
  echo "Terra repo not found at: \$ROOT"
  echo "Re-run install-desktop-launcher.command from the terra folder."
  read -r -p "Press Enter to close…"
  exit 1
}

if ! command -v xcrun >/dev/null 2>&1; then
  echo "Xcode command-line tools are required for the iOS Simulator."
  echo "Install Xcode from the App Store, then: xcode-select --install"
  read -r -p "Press Enter to close…"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing mobile dependencies (first run)…"
  npm install
fi

echo "Opening Terra on the iOS Simulator…"
echo

npx expo start --ios --clear
status=\$?
if [ \$status -ne 0 ]; then
  echo
  echo "Launch failed (exit \$status)."
  read -r -p "Press Enter to close…"
  exit \$status
fi
EOF

chmod +x "$DEST"
# Allow double-click without Gatekeeper nag when possible
xattr -d com.apple.quarantine "$DEST" 2>/dev/null || true
xattr -d com.apple.quarantine "$ROOT/install-desktop-launcher.command" 2>/dev/null || true

echo
echo "Desktop button created:"
echo "  $DEST"
echo
echo "Double-click “Launch Terra Simulator” anytime to open the app in Simulator."
echo
read -r -p "Press Enter to close…"
