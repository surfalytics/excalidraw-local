---
name: board-add
description: Add a task sticky to the personal Kanban board on the Excalidraw canvas. Use when the user says "add task ...", "new task for Project 1 ...", "put ... on the board", or names a company and a to-do.
---

# Add a task to the board

1. Parse from the user's words:
   - `company`: a key from `board/layout.json`, or from `board/layout.local.json` if it exists (it holds the user's real project names). Read that file first and map the user's words to the closest project name. "personal", "home", "family" → `personal`.
   - `title`: rewrite as verb + object, max 6 words. Example: "the dbt snapshot thing is broken" → "Fix dbt snapshot".
   - `size`: S, M, or L if the user gives a hint. Otherwise omit.
   - `due`: MM-DD if the user gives a date.
   - Placement: default is Backlog. If the user says "must have", "urgent", "today", or "on the board": `--col todo --lane must`. If "to do" without priority: `--col todo --lane rest`. If "icebox", "park", "someday", or "outdated": `--col icebox`.
2. Run from the repo root:
   ```bash
   node board/add-task.mjs --company <key> --title "<title>" [--size S|M|L] [--due MM-DD] [--col ...] [--lane ...]
   ```
3. Reply in one line: company, title, where it landed. If the script says no free slot, tell the user to prune that strip or lane.

Several tasks in one message: run the script once per task.
