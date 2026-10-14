---
name: board-week-review
description: Friday review of the personal Kanban board. Summarizes Done per company, archives the week, clears Done, prunes Backlog, and sets 3 to 5 goals for next week. Use when the user says "weekly review", "close the week", or runs /board-week-review.
---

# Weekly review (15 minutes)

Canvas CLI: `node mcp_excalidraw/dist/bin.js <cmd>` with `EXPRESS_SERVER_URL=http://127.0.0.1:3456`. Layout numbers: `board/layout.json`. Week id: `YYYY-WW` using the ISO week of today.

1. Read the board with `describe` and classify `task-*` stickies by column, lane, and company color (`backgroundColor` matches `layout.json` companies).
2. Report, as a table: Done count per company, unfinished Must Have tasks, In Progress count, Backlog strips with more than 8 stickies.
3. Archive, in this order:
   - `snapshot save week-YYYY-WW`
   - `export --out diagrams/board-archive/week-YYYY-WW.excalidraw`
   - delete every sticky in the Done column. Deleting a `task-x` rectangle leaves its bound text `task-x-label` behind, so delete both ids
   - delete `today-*-copy` elements
4. Ask two things in one message: what to do with each unfinished Must Have task (keep, move to Rest, drop), and the 3 to 5 goals for next week.
5. Apply the answers. Write each goal as a text-only sticky in a `goal-slot-<n>` position: id `goal-<n>`, type rectangle, white fill, stroke `#495057`, text = goal, fontSize 14. Delete old `goal-*` stickies first.
6. `screenshot`, check, then reply with: archive path, what was cleared, next week's goals. The archive folder is git-ignored; it stays on this machine.

Stale Backlog tasks go to the Icebox: `node board/add-task.mjs --company <key> --title "<same text>" --col icebox`, then delete the original and its label. Never delete Backlog or Icebox stickies without the user's confirmation.
