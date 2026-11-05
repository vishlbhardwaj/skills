#!/usr/bin/env bash
# Render a drawing to images and open the folder:
#   bin/render.sh <name> [--no-open]
# writes <project>/doodles/<name>/<name>.png (colour) and <name>-line.png (line only),
# where <project> is the folder that holds this engine (.doodle/). DOODLE_OUT=<dir>
# overrides the output folder; DOODLE_NO_OPEN=1 or --no-open skips opening it.
set -eu
ENGINE="$(cd "$(dirname "$0")/.." && pwd)"
name="${1:?usage: bin/render.sh <name> [--no-open]}"
open_it=1; [ "${2:-}" = "--no-open" ] && open_it=0; [ -n "${DOODLE_NO_OPEN:-}" ] && open_it=0
page="drawings/$name.html"
[ -f "$ENGINE/$page" ] || { echo "no $page (make it with bin/new.sh $name)" >&2; exit 1; }
OUT="${DOODLE_OUT:-$(dirname "$ENGINE")/doodles}/$name"
mkdir -p "$OUT"
asp=$(grep -o 'const ASPECT = [0-9.]*' "$ENGINE/drawings/$name.js" | grep -o '[0-9.]*$' || true)
H=1200; W=$(python3 -c "print(round($H * ${asp:-1}))")
cd "$ENGINE"; . bin/chrome.sh
shoot() {
  local prof; prof=$(mktemp -d)
  "$CHROME" --headless --disable-gpu --hide-scrollbars --user-data-dir="$prof" \
    --force-device-scale-factor=2 --window-size="$W,$H" --virtual-time-budget=20000 \
    --screenshot="$2" "file://$ENGINE/$1" >/dev/null 2>&1 || true
  rm -rf "$prof"
  [ -s "$2" ] || { echo "render failed: $1" >&2; exit 1; }
}
shoot "$page?nodial=1&reset=1" "$OUT/$name.png"
shoot "$page?nodial=1&reset=1&outline=1" "$OUT/$name-line.png"
echo "$OUT/$name.png"
echo "$OUT/$name-line.png"
if [ "$open_it" = 1 ]; then
  case "$(uname -s)" in
    Darwin) open "$OUT" || true ;;
    Linux) command -v xdg-open >/dev/null && { xdg-open "$OUT" >/dev/null 2>&1 & } ;;
    MINGW*|MSYS*|CYGWIN*) explorer "$(cygpath -w "$OUT")" || true ;;
  esac
fi
