#!/usr/bin/env bash
# Start a new drawing of your own: drawings/<name>.html + drawings/<name>.js.
#   bin/new.sh red-bicycle
# Draw in drawings/<name>.js; deliver with bin/render.sh <name> (PNGs, folder opened).
set -eu
cd "$(dirname "$0")/.."
name="${1:?usage: bin/new.sh <name>   (letters, digits, dashes)}"
case "$name" in *[!a-zA-Z0-9-]*) echo "name: letters, digits and dashes only" >&2; exit 1;; esac
mkdir -p drawings
for ext in html js; do
  f="drawings/$name.$ext"
  [ -e "$f" ] && { echo "$f already exists" >&2; exit 1; }
  sed "s/__NAME__/$name/g" "templates/drawing.$ext" > "$f"
done
echo "drawings/$name.html  drawings/$name.js"
echo "draw in drawings/$name.js, then: bin/render.sh $name"
