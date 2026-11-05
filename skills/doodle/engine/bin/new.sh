#!/usr/bin/env bash
# Start a new drawing of your own: drawings/<name>.html + drawings/<name>.js.
#   bin/new.sh red-bicycle
# Your drawings live in drawings/. The other pages are the bundled examples and kits:
# read them, copy from them, never add to them.
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
echo "render: bin/shot.sh \"drawings/$name.html?outline=1\" $name-line.png"
