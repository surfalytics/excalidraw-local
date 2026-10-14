---
name: board-plan-day
description: Morning planning on the personal Kanban board. Picks the Big 3 for today from Must Have tasks and fills the Today slots and time blocks. Use when the user says "plan my day", "what should I do today", or runs /board-plan-day.
---

# Plan the day (5 minutes)

First make sure the board scene is open: `curl -s http://127.0.0.1:3456/api/scenes` → if `current` is not `Board`, run `curl -s -X POST -H 'content-type: application/json' -d '{"name":"Board"}' http://127.0.0.1:3456/api/scenes/open`.

Canvas CLI: `node mcp_excalidraw/dist/bin.js <cmd>` with `EXPRESS_SERVER_URL=http://127.0.0.1:3456`. Layout numbers: `board/layout.json`.

1. Read the board: `describe`. Classify every `task-*` sticky by position using `layout.json`:
   - column: by x against `kanban.colX0 + i * colStep` (To Do, In Progress, QA); x inside `zones.done` means finished
   - lane: y inside `kanban.lanes.must` or `kanban.lanes.rest`
   - backlog strip: y inside `backlog.stripY0 + i * stripH`
2. Clear yesterday: delete any `today-*-copy` stickies in the Today slots, all parts: `today-n-copy`, `-body`, `-flap`, `-label`. Leave the slots and time blocks.
3. Propose the Big 3, in this order: Must Have In Progress, Must Have To Do, then Rest In Progress. Prefer at most one L task. Show them as a short list with company and size. Also show the In Progress count. If it is above 3, say which one to move back.
4. Ask the user to confirm or swap. One question, then act.
5. For each chosen task, add a copy into a Today slot with `node board/add-task.mjs` is not possible (it only targets strips and columns), so build it with the sticky helper: `node -e 'import("./board/sticky.mjs").then(m => console.log(JSON.stringify(m.stickyElements({id:"today-1-copy", x:1000, y:250, w:160, h:90, fill:"<fill>", text:"<text>"}))))' | node mcp_excalidraw/dist/bin.js add`. Slot n is at x = `today.slotX0 + (n-1) * slotStep`, y = `today.slotY`. Then `update` the matching time block text to show the task title under the block name, for example "AM focus\n9:00 - 12:00\n→ Fix dbt snapshot".
6. `screenshot` and check: three copies in the slots, no overlap. Reply with the plan in three lines and stop.

Do not move the original stickies. Only the user moves them in the app.
