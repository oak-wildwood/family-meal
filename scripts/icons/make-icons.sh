#!/bin/sh
# Renders scripts/icons/icon.html to the PNG icons in public/icons with headless
# Chrome (macOS path; set CHROME to override), then scales with sips. Headless
# Chrome has a minimum window width, so it renders once at 512 and scales down.
# Run from the repo root.
set -eu
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
SRC="file://$(pwd)/scripts/icons/icon.html"
OUT=public/icons
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --virtual-time-budget=2000 --window-size=512,512 --screenshot="$OUT/icon-512.png" "$SRC" 2>/dev/null
for size in 192 180 48; do
  sips -Z "$size" "$OUT/icon-512.png" --out "$OUT/icon-$size.png" >/dev/null
done
# Strip metadata, matching the rule for every committed image.
for f in "$OUT"/icon-*.png; do sips -d all "$f" >/dev/null 2>&1 || true; done
ls -l "$OUT"
