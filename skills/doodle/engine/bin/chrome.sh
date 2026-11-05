# Sourced by check.sh and shot.sh: sets $CHROME to a headless-capable Chrome/Chromium.
# Override with CHROME=/path/to/chrome.
if [ -z "${CHROME:-}" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           "/Applications/Chromium.app/Contents/MacOS/Chromium" \
           "$(command -v google-chrome 2>/dev/null)" "$(command -v google-chrome-stable 2>/dev/null)" \
           "$(command -v chromium 2>/dev/null)" "$(command -v chromium-browser 2>/dev/null)"; do
    [ -n "$c" ] && [ -x "$c" ] && CHROME="$c" && break
  done
fi
if [ -z "${CHROME:-}" ]; then echo "No Chrome/Chromium found. Install one or set CHROME=/path/to/chrome." >&2; exit 2; fi
