// Add a sticky note to the board.
// node add-task.mjs --company p1 --title "Fix dbt model" [--size M] [--due 10-20] [--col backlog|todo|inprogress|qa|done|icebox] [--lane must|rest]
// Default: backlog strip of the company. --col todo etc. needs --lane (default: rest).
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { stickyElements, PART_SUFFIXES } from "./sticky.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const L = (() => {
  const base = JSON.parse(readFileSync(join(here, "layout.json"), "utf8"));
  // Optional private override (git-ignored): { "title": "...", "companies": { ... } }
  const localPath = join(here, "layout.local.json");
  if (existsSync(localPath)) Object.assign(base, JSON.parse(readFileSync(localPath, "utf8")));
  return base;
})();
const url = process.env.EXPRESS_SERVER_URL || L.canvasUrl;

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith("--")) { args[argv[i].slice(2)] = argv[i + 1] ?? ""; i++; }
const company = (args.company || "").toLowerCase();
if (!L.companies[company] || !args.title) {
  console.error(`usage: --company <${Object.keys(L.companies).join("|")}> --title "..." [--size S|M|L] [--due MM-DD] [--col backlog|todo|inprogress|qa|done|icebox] [--lane must|rest]`);
  process.exit(2);
}
const col = args.col || "backlog";
const lane = args.lane || "rest";
const c = L.companies[company];
const S = L.sticky;

// Candidate slots for the target region, in fill order.
function slots() {
  const out = [];
  if (col === "backlog") {
    const i = Object.keys(L.companies).indexOf(company);
    const y0 = L.backlog.stripY0 + i * L.backlog.stripH;
    for (const ry of L.backlog.rowY) for (let cx = 0; cx < L.backlog.cols; cx++)
      out.push({ x: L.backlog.slotX0 + cx * L.backlog.slotStep, y: y0 + ry });
    return out;
  }
  if (col === "icebox") {
    for (const ry of L.icebox.rowY) for (let cx = 0; cx < L.icebox.cols; cx++)
      out.push({ x: L.icebox.slotX0 + cx * L.icebox.slotStep, y: ry });
    return out;
  }
  const ci = Object.keys(L.kanban.cols).indexOf(col);
  const ln = L.kanban.lanes[lane];
  if (ci < 0 || !ln) { console.error("unknown --col or --lane"); process.exit(2); }
  const x0 = L.kanban.colX0 + ci * L.kanban.colStep;
  const rows = Math.floor((ln.h - L.kanban.rowY0) / L.kanban.rowStep);
  for (let r = 0; r < rows; r++) for (let sx = 0; sx < L.kanban.slotsPerRow; sx++)
    out.push({ x: x0 + 5 + sx * L.kanban.slotStep, y: ln.y + L.kanban.rowY0 + r * L.kanban.rowStep });
  return out;
}

const res = await fetch(`${url}/api/elements`);
const data = await res.json();
const all = data.elements || data;
const isTask = e => typeof e.id === "string" && e.type === "rectangle" && (e.id.startsWith("task-") || e.id.startsWith("blank-"));
// A blank sticky with no text is free space; one the user typed into is a real task.
const hasText = e => all.some(t => t.type === "text" && t.containerId === e.id && (t.text || "").trim() !== "");
const tasks = all.filter(e => isTask(e) && !(e.id.startsWith("blank-") && !hasText(e)));
const blanks = all.filter(e => isTask(e) && e.id.startsWith("blank-") && !hasText(e));
const overlaps = (s, t) => !(s.x + S.w <= t.x || t.x + (t.width || S.w) <= s.x || s.y + S.h <= t.y || t.y + (t.height || S.h) <= s.y);
const free = slots().find(s => !tasks.some(t => overlaps(s, t)));
if (!free) { console.error(`No free slot in ${col}${col === "backlog" ? " strip " + c.name : " / " + lane}. Prune first.`); process.exit(1); }

const meta = [args.size ? args.size.toUpperCase() : null, args.due ? `due ${args.due}` : null].filter(Boolean).join("  ·  ");
const id = `task-${Date.now().toString(36)}`;
const els = stickyElements({ id, x: free.x, y: free.y, w: S.w, h: S.h, fill: c.fill, fontSize: S.fontSize,
                             text: meta ? `${args.title}\n${meta}` : args.title });
const cli = join(here, "..", "mcp_excalidraw", "dist", "bin.js");
const blank = blanks.find(b => overlaps(free, b));
if (blank) spawnSync("node", [cli, "delete", blank.id, ...PART_SUFFIXES.map(sfx => blank.id + sfx)], { env: { ...process.env, EXPRESS_SERVER_URL: url } });
const r = spawnSync("node", [cli, "add"],
                    { input: JSON.stringify(els), env: { ...process.env, EXPRESS_SERVER_URL: url }, encoding: "utf8" });
if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }
console.log(JSON.stringify({ id, company: c.name, col, lane: col === "backlog" ? null : lane, x: free.x, y: free.y, title: args.title }));
