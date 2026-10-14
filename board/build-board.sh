#!/bin/bash
# Rebuild the empty board on the live canvas. Saves a snapshot of the current canvas first.
set -e
cd "$(dirname "$0")"
export EXPRESS_SERVER_URL="${EXPRESS_SERVER_URL:-http://127.0.0.1:3456}"
cli() { node ../mcp_excalidraw/dist/bin.js "$@"; }
cli snapshot save "before-board-$(date +%Y%m%d-%H%M%S)" >/dev/null
cli clear --yes >/dev/null
node build-board.mjs | cli add | grep -E '"count"' || true
cli screenshot --scale 1 --out /tmp/board.png >/dev/null && echo "Board built. Preview: /tmp/board.png"
