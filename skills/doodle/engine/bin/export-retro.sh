#!/bin/zsh
# Dump a page's subjects (with Rive parts) as JSON:
#   bin/export-retro.sh /abs/out.json                      retro.html, Retro, TILE
#   bin/export-retro.sh /abs/out.json cafe.html Cafe STILE  any page/module/tile var
#   ... cafe.html Cafe STILE "style=clean&lines=tonal"     the clean register
set -eu
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
PAGE=${2:-retro.html}; MODN=${3:-Retro}; TV=${4:-TILE}; XQ=${5:-}
python3 - "$TMP" "$PAGE" "$MODN" "$TV" <<'PY'
import sys
tmp, page, mod, tv = sys.argv[1:5]
src = open(page).read(); js = open('bin/export-retro.js').read()
pre = '<script>window.__EXP = {mod: "%s", tile: "%s"};</script>' % (mod, tv)
out = src.replace('</script>\n</html>', '</script>' + pre + '<script>' + js + '</' + 'script></html>')
assert out != src
open(tmp + '/' + page, 'w').write(out)
PY
cp -R src vendor "$TMP/"
"$CHROME" --headless --disable-gpu --dump-dom --virtual-time-budget=20000 "file://$TMP/$PAGE?nodial=1&reset=1&$XQ" 2>/dev/null \
  | python3 -c "
import sys, re, html
m = re.search(r'<pre id=\"retro-dump\">(.*?)</pre>', sys.stdin.read(), re.S)
assert m, 'no dump'
open(sys.argv[1], 'w').write(html.unescape(m.group(1)))" "$1"
