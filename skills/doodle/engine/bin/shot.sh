#!/usr/bin/env bash
# Render one page to a PNG with headless Chrome.
#   bin/shot.sh "things.html?s=phone&outline=1" out.png [WIDTHxHEIGHT]
# nodial=1 and reset=1 are added for you. Look at the PNG: rendering is not reading.
set -eu
cd "$(dirname "$0")/.."
. bin/chrome.sh
url="$1"; out="${2:-shot.png}"; size="${3:-1120x700}"
case "$url" in *\?*) url="$url&nodial=1&reset=1";; *) url="$url?nodial=1&reset=1";; esac
case "$out" in /*) ;; *) out="$OLDPWD/$out";; esac
prof=$(mktemp -d); trap 'rm -rf "$prof"' EXIT
"$CHROME" --headless --disable-gpu --hide-scrollbars --user-data-dir="$prof" \
  --window-size="${size/x/,}" --virtual-time-budget=20000 --screenshot="$out" \
  "file://$PWD/$url" >/dev/null 2>&1
[ -s "$out" ] && echo "$out" || { echo "shot failed: $url" >&2; exit 1; }
