#!/bin/bash
# Put Excalidraw.app into /Applications so Spotlight and Launchpad find it.
# The copy remembers where this repo is through a small path file.
set -e
cd "$(dirname "$0")"
ROOT="$(pwd)"
[ -d Excalidraw.app ] || ./app-wrapper/build.sh
mkdir -p "$HOME/Library/Application Support/Excalidraw"
echo "$ROOT" > "$HOME/Library/Application Support/Excalidraw/project-path"
osascript -e 'tell application "Excalidraw" to quit' >/dev/null 2>&1 || true
rm -rf /Applications/Excalidraw.app
cp -R Excalidraw.app /Applications/Excalidraw.app
echo "Installed /Applications/Excalidraw.app (project: $ROOT)"
echo "Open it with Spotlight: Cmd+Space, type Excalidraw."
