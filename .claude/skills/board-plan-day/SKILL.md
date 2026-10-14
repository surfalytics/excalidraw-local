---
name: board-plan-day
description: Morning planning on the personal Kanban board. Picks the Big 3 for today from Must Have tasks and fills the Today slots and time blocks. Use when the user says "plan my day", "what should I do today", or runs /board-plan-day.
---

# Plan the day (5 minutes)

Canvas CLI: `node mcp_excalidraw/dist/bin.js <cmd>` with `EXPRESS_SERVER_URL=http://127.0.0.1:3456`. Layout numbers: `board/layout.json`.

1. Read the board: `describe`. Classify every `task-*` sticky by position using `layout.json`:
   - column: by x against `kanban.colX0 + i * colStep`
   - lane: y inside `kanban.lanes.must` or `kanban.lanes.rest`
   - backlog strip: y inside `backlog.stripY0 + i * stripH`
2. Clear yesterday: delete any `today-*-copy` elements and their `today-*-copy-label` texts (copies in the Today slots). Leave the slots and time blocks.
3. Propose the Big 3, in this order: Must Have In Progress, Must Have To Do, then Rest In Progress. Prefer at most one L task. Show them as a short list with company and size. Also show the In Progress count. If it is above 3, say which one to move back.
4. Ask the user to confirm or swap. One question, then act.
5. For each chosen task, `add` a copy into a Today slot: same text, same colors, id `today-<n>-copy`, x/y from `today.slotX0 + (n-1) * slotStep`, `today.slotY`. Then `update` the matching time block text to show the task title under the block name, for example "AM focus\n9:00 - 12:00\n→ Fix dbt snapshot".
6. `screenshot` and check: three copies in the slots, no overlap. Reply with the plan in three lines and stop.

Do not move the original stickies. Only the user moves them in the app.
