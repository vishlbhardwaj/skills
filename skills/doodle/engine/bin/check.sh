#!/usr/bin/env bash
# Headless check for every page. Asserts, and exits non-zero on failure.
set -u
cd "$(dirname "$0")/.."
. "$(dirname "$0")/chrome.sh"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
fail=0
cp -R src "$TMP/"; [ -d vendor ] && cp -R vendor "$TMP/"; [ -d drawings ] && cp -R drawings "$TMP/"
# no arguments: every bundled page. With arguments: just those (e.g. drawings/cup.html).
if [ $# -gt 0 ]; then PAGES=("$@"); else
PAGES=(kitchen.html canvas.html buildings.html plants.html scene.html retro.html cafe.html board.html still.html pen.html daily.html houses.html plants3.html furniture3.html vehicles.html stilllife.html faucet.html scapes.html trials.html people.html things.html)
for d in drawings/*.html; do [ -e "$d" ] && PAGES+=("$d"); done
fi
for page in "${PAGES[@]}"; do
  python3 - "$page" "$TMP" <<'PY'
import sys
page, tmp = sys.argv[1], sys.argv[2]
src = open(page).read(); js = open('bin/check.js').read()
out = src.replace('</script>\n</html>', '</script><script>' + js + '</' + 'script></html>')
assert out != src, page + ": could not inject the checker"
import os; os.makedirs(os.path.dirname(tmp + '/' + page), exist_ok=True)
open(tmp + '/' + page, 'w').write(out)
PY
  res=$("$CHROME" --headless --disable-gpu --dump-dom --window-size=1500,1100 \
        --virtual-time-budget=30000 "file://$TMP/$page?reset=1&nodial=1&auto=0" 2>/dev/null \
        | grep -o '__CHK__{.*}</title>' | sed 's/__CHK__//; s|</title>||')
  if [ -z "$res" ]; then echo "FAIL $page — checker never reported"; fail=1; continue; fi
  if echo "$res" | grep -q '"ok":true'; then echo "ok   $page  $res"
  else echo "FAIL $page  $res"; fail=1; fi
done
exit $fail
