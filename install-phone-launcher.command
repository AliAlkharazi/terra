#!/usr/bin/env bash
# Double-click once on a Mac to:
#  - put "Launch Terra Phone" on your Desktop
#  - write short iPhone Shortcut setup steps next to it
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DEST="${HOME}/Desktop/Launch Terra Phone.command"
TIPS="${HOME}/Desktop/Terra iPhone Shortcut.txt"

mkdir -p "${HOME}/Desktop"

cat > "$DEST" <<EOF
#!/usr/bin/env bash
set -euo pipefail
ROOT="$ROOT"
MOBILE="\$ROOT/mobile"
cd "\$MOBILE" || { echo "Terra repo not found at: \$ROOT"; read -r; exit 1; }
[ -d node_modules ] || npm install
echo "Starting Terra for iPhone (Expo tunnel)…"
echo "Scan the QR in Expo Go. Keep this window open."
echo
npx expo start --tunnel --clear
status=\$?
[ \$status -eq 0 ] || { echo "Failed (\$status)"; read -r; exit \$status; }
EOF

chmod +x "$DEST"
xattr -d com.apple.quarantine "$DEST" 2>/dev/null || true
xattr -d com.apple.quarantine "$ROOT/install-phone-launcher.command" 2>/dev/null || true
xattr -d com.apple.quarantine "$ROOT/Launch Terra Phone.command" 2>/dev/null || true

cat > "$TIPS" <<'EOF'
Terra — one-tap on iPhone (after first run)

A) Every session (Mac)
   Double-click Desktop → "Launch Terra Phone"
   Wait until the Expo QR / exp:// link appears.

B) One-tap on iPhone (Shortcuts)
   1. On Mac, copy the exp://… (or https://expo.dev/go?…) link from Terminal.
   2. On iPhone open Shortcuts → + → Add Action → Open URLs
   3. Paste the link → name the Shortcut "Terra"
   4. Share sheet → Add to Home Screen

   Note: tunnel links can change. If it stops working, paste the new
   exp:// link into the same Shortcut (edit → Open URL).

C) Without saving a link
   Open Expo Go → Scan QR from the Mac Terminal / Expo window.
EOF

echo
echo "Created:"
echo "  $DEST"
echo "  $TIPS"
echo
echo "Mac: double-click “Launch Terra Phone” whenever you want the app."
echo "iPhone: follow the tips file to pin a Home Screen Shortcut."
echo
open "$HOME/Desktop"
read -r -p "Press Enter to close…"
