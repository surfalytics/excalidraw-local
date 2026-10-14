#!/bin/bash
# One-time setup. Run from the repo root after cloning.
#   ./setup.sh            install MCP canvas, build the macOS app, register MCP in Claude Code
#   ./setup.sh --source   also install deps for the Excalidraw source (optional, for hacking on it)
set -e
cd "$(dirname "$0")"
ROOT="$(pwd)"
PORT=3456

command -v node >/dev/null || { echo "Node.js 20+ is required. Install it first."; exit 1; }
command -v swiftc >/dev/null || { echo "Xcode command line tools are required: xcode-select --install"; exit 1; }

echo "==> Fetching submodules"
git submodule update --init --depth 1

echo "==> Building MCP canvas server"
(cd mcp_excalidraw && npm ci && npm run build)

echo "==> Building Excalidraw.app"
./app-wrapper/build.sh

mkdir -p canvas-data diagrams

if command -v claude >/dev/null; then
  echo "==> Registering MCP server in Claude Code (user scope)"
  claude mcp remove excalidraw --scope user >/dev/null 2>&1 || true
  claude mcp add excalidraw --scope user \
    -e EXPRESS_SERVER_URL=http://127.0.0.1:$PORT \
    -e ENABLE_CANVAS_SYNC=true \
    -e EXCALIDRAW_EXPORT_DIR="$HOME" \
    -e EXCALIDRAW_DATA_DIR="$ROOT/canvas-data" \
    -e EXCALIDRAW_LIBS_DIR="$ROOT/libs" \
    -e EXCALIDRAW_SCENES_DIR="$ROOT/diagrams" \
    -- "$(command -v node)" "$ROOT/mcp_excalidraw/dist/index.js"
else
  echo "Claude Code CLI not found. Skipped MCP registration."
fi

if [ "$1" = "--source" ]; then
  echo "==> Installing Excalidraw source deps"
  (cd excalidraw && corepack enable && corepack yarn install)
fi

echo
echo "Done. Open Excalidraw.app, then ask Claude Code to draw a diagram."
