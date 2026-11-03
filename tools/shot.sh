#!/bin/bash
# Dev tool: headless screenshot of the game. Usage: tools/shot.sh "<query>" out.png [WxH] [virtual-ms]
# e.g. tools/shot.sh "level=5&tool=ride&warp=60&shot=1" shots/l5.png 1280x800
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
Q="${1:-}"; OUT="${2:-$DIR/shots/shot.png}"; SIZE="${3:-1280x800}"; MS="${4:-1500}"; PAGE="${5:-index.html}"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --window-size="${SIZE/x/,}" --virtual-time-budget="$MS" --screenshot="$OUT" "file://$DIR/$PAGE?$Q" 2>/dev/null
test -s "$OUT"
echo "$OUT"
