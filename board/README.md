# Personal Kanban board

One Excalidraw board for all work and personal tasks. Drawn on the live canvas. Moved by hand in `Excalidraw.app` or through Claude Code.

## Layout

| Area | What goes there |
|---|---|
| **This Week** (top left) | 3 to 5 goals for the week. Set on Friday for next week. |
| **Today** (top right) | Big 3 for today, plus three time blocks. Filled every morning. |
| **Backlog** (right side) | One strip per company. Every new task lands here first. Up to 32 per strip, prune at 24. Each strip starts with 8 blank Post-its from the sticky-note library pack: double-click one and type. |
| **Icebox** (bottom) | Outdated or free-floating tickets. Review on Friday. Drop after 4 weeks or move back to Backlog. |
| **Board** (center) | To Do, In Progress (WIP 3), QA, Done. Two lanes across all columns: **Must Have** on top, **Rest** below. |

Colors: Project 1 yellow, Project 2 blue, Project 3 red, Project 4 grey, Project 5 green, Project 6 orange, Personal purple. The legend is in the header.

To use your real project names, create `board/layout.local.json` (git-ignored):

```json
{ "title": "My Board", "companies": { "acme": { "name": "Acme", "fill": "#ffec99", "stroke": "#f08c00" } } }
```

Then run `./board/build-board.sh`. Scripts and skills read the local file when it exists.

## Sticky note format

```
Verb + object
S  ·  due 10-20
```

- Start with a verb: "Fix", "Write", "Review", "Call".
- Size: S under 1 hour, M half a day, L a day or more. Split L tasks.
- Due date only if real.

## Routine

**Every morning, 5 minutes.** Run `/board-plan-day` in Claude Code, or do it by hand:
1. Look at Must Have in To Do and In Progress.
2. Pick the Big 3. Must Have first. At most one L task.
3. Copy them into the Today slots. Assign each to a time block.
4. In Progress holds at most 3 stickies. If more, move one back.

**When a task arrives.** Add it to the Backlog strip of its company. Do not put it on the board yet. Say to Claude: "add task Fix dbt snapshot for Project 1, size M" or run:

```bash
node board/add-task.mjs --company p1 --title "Fix dbt snapshot" --size M
node board/add-task.mjs --company personal --title "Book dentist" --size S --col todo --lane must
```

Company keys: `p1` to `p6` and `personal` by default, or the keys from your `layout.local.json`. Columns: `backlog` (default), `todo`, `inprogress`, `qa`, `done`, `icebox`.

The script reuses a blank sticky if one sits in the next free slot. A blank you typed into counts as a real task and is kept.

**Every Friday, 15 minutes.** Run `/board-week-review` in Claude Code, or by hand:
1. Count Done per company. Note what was finished.
2. Archive: snapshot the canvas, export to `diagrams/board-archive/week-YYYY-WW.excalidraw`, clear Done.
3. List unfinished Must Have tasks. Decide: keep, move to Rest, or drop.
4. Prune Backlog strips with more than 24 stickies. Move stale ones to the Icebox. Drop Icebox tickets older than 4 weeks.
5. Write 3 to 5 goals for next week in This Week.

## Rules

- Big 3 every morning. Finish them before touching Rest.
- WIP 3 in In Progress.
- Max 5 stickies in Must Have To Do. More means something is not a must.
- New tasks go to Backlog, never straight to the board.
- Done is cleared every Friday. The archive keeps history.

## Deleting a sticky by script

A sticky is four elements: the Post-it body `task-x-body`, the folded corner `task-x-flap`, an invisible rectangle `task-x` that holds the text, and the text `task-x-label`. They share a group, so in the app one click selects the whole note and Delete removes it. From scripts, delete all four ids.

## Rebuild

`./board/build-board.sh` saves a snapshot, clears the canvas, and draws the empty board. Layout numbers live in `board/layout.json`. The add-task script reads the same file, so change positions there only.
