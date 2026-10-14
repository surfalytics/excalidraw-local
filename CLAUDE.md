# excalidraw-local

Native macOS Excalidraw app plus an MCP server so Claude Code can draw on it. See `README.md` for install and use.

## Layout

| Path | What it is |
|---|---|
| `app-wrapper/main.swift` | Native app. Swift + WebKit. Starts `mcp_excalidraw/dist/server.js` on port 3456, shows it, stops it on quit. |
| `app-wrapper/build.sh` | Builds `Excalidraw.app` into the repo root. The `.app` is git-ignored. |
| `mcp_excalidraw/` | Submodule. Upstream fork. Do not edit here. Built output in `dist/`. |
| `excalidraw/` | Submodule. Upstream fork. Do not edit here. Not used at runtime. |
| `canvas-data/` | Live canvas state. Git-ignored. |
| `diagrams/` | Personal diagrams and board archives. Git-ignored. |
| `diagrams-examples/` | Sample diagrams for the README. Committed. |
| `setup.sh` | One-time install. Registers the `excalidraw` MCP server in Claude Code at user scope. |
| `update.sh` | Pull submodules and rebuild. |

## How it connects

```
Claude Code  --MCP (stdio)-->  mcp_excalidraw/dist/index.js  --HTTP-->  canvas server :3456  <--WebKit--  Excalidraw.app
```

- The app finds the repo root from its own location. Keep `Excalidraw.app` in the repo root.
- MCP env: `EXPRESS_SERVER_URL=http://127.0.0.1:3456`, `EXCALIDRAW_DATA_DIR=<repo>/canvas-data`, `EXCALIDRAW_EXPORT_DIR=$HOME`.
- If the app is not open, the MCP server auto-starts the canvas with the same data dir.

## Rules for changes

- Local changes go in `app-wrapper/`, scripts, or docs. Never inside the submodules.
- Change the port in two places together: `app-wrapper/main.swift` and `setup.sh`. Then re-run `setup.sh`.
- Keep the repo outside `~/Desktop`, `~/Documents`, `~/Downloads`. macOS blocks Finder-launched apps from reading those.
- Exports from Claude: project diagrams go in that repo's `docs/`. Others go in `diagrams/`.
- Yarn for the Excalidraw source comes from `corepack`. Use `corepack yarn`, not `yarn`.

## Personal Kanban board

The personal task board lives on the live canvas. Docs: `board/README.md`. Layout numbers: `board/layout.json` (single source for scripts).

- Add a task: skill `board-add` → `node board/add-task.mjs --company <key> --title "..."`. Company keys come from `board/layout.json`, or from the git-ignored `board/layout.local.json` with your real project names.
- Morning: skill `board-plan-day`. Friday: skill `board-week-review`.
- Rebuild empty board: `./board/build-board.sh` (snapshots first).
- A sticky is a Post-it from `libs/post-it.excalidrawlib`: body, flap, and an invisible rectangle with the text, grouped. Builder: `board/sticky.mjs`. Ids: `task-x`, `task-x-body`, `task-x-flap`, `task-x-label`. Board furniture is locked. Never move stickies on the board unless the user asks. They drag them in the app.

## Library packs

`libs/*.excalidrawlib` are served by the canvas (`EXCALIDRAW_LIBS_DIR`) and preloaded into the app sidebar. Stamp from scripts with `node libs/stamp.mjs` (skill `stamp`). The preload lives in our fork of `mcp_excalidraw` (commit "Serve and preload Excalidraw library packs"). Keep that patch when pulling upstream.

## Scenes (diagrams sidebar)

The canvas shows one scene at a time. Scenes are `.excalidraw` files in `diagrams/` (`EXCALIDRAW_SCENES_DIR`). API: `GET /api/scenes`, `POST /api/scenes/open {name}`, `POST /api/scenes {name, fromCurrent?}`, `PATCH /api/scenes {from, name}`, `DELETE /api/scenes?name=`, `POST /api/scenes/save`, folders: `POST /api/scenes/folders {name}`, `DELETE /api/scenes/folders?name=`. A scene name may include a folder path like `work/arch/diagram`. The Kanban board is the scene named `Board`. Before any board skill runs, check `GET /api/scenes` and open `Board` if it is not current. Before drawing a new diagram for the user, create a new scene for it instead of drawing over the board. The scenes feature lives in our fork of `mcp_excalidraw` (commit "Scenes: multi-diagram workspace sidebar").
