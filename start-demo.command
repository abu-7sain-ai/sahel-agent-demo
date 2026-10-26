#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ is required: https://nodejs.org"
  read -r -p "Press Enter to close"
  exit 1
fi
[ -d node_modules ] || npm install --omit=dev
(sleep 1.5; open "http://127.0.0.1:5318") &
node server.js
