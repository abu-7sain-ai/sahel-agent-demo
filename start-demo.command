#!/bin/bash
# Sahel agent demo launcher (macOS Terminal): starts the server only if port 5318 is free, then opens the browser.
cd "$(dirname "$0")" || exit 1
export PATH="$PATH:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin"

if lsof -nP -iTCP:5318 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "The demo is already running. Opening http://127.0.0.1:5318"
  open "http://127.0.0.1:5318"
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ is required: https://nodejs.org"
  read -r -p "Press Enter to close"
  exit 1
fi
[ -d node_modules ] || npm install --omit=dev

# The server opens the browser itself once it is listening.
SAHEL_OPEN=1 node server.js
