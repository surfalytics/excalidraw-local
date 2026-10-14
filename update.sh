#!/bin/bash
# Pull latest submodules and rebuild the MCP canvas server and the app.
set -e
cd "$(dirname "$0")"
git submodule update --remote --merge --depth 1
(cd mcp_excalidraw && npm ci && npm run build)
./app-wrapper/build.sh
pkill -f "mcp_excalidraw/dist/server.js" || true
echo "Done. Open Excalidraw.app again."
