#!/bin/bash
# Build Excalidraw.app from source into the repo root.
# Needs Xcode command line tools (swiftc, codesign).
set -e
cd "$(dirname "$0")"
APP="../Excalidraw.app"

swiftc -O -framework Cocoa -framework WebKit -o Excalidraw main.swift

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
mv Excalidraw "$APP/Contents/MacOS/Excalidraw"
cp Info.plist "$APP/Contents/Info.plist"
cp Excalidraw.icns "$APP/Contents/Resources/Excalidraw.icns"
codesign --force --deep --sign - "$APP"
touch "$APP"
echo "Built $(cd "$(dirname "$APP")" && pwd)/Excalidraw.app"
