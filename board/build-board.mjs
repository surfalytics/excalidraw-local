// Print the empty board as an element list for the canvas CLI (`add`).
// Usage: node build-board.mjs | node ../mcp_excalidraw/dist/bin.js add
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { stickyElements } from "./sticky.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const L = (() => {
  const base = JSON.parse(readFileSync(join(here, "layout.json"), "utf8"));
  // Optional private override (git-ignored): { "title": "...", "companies": { ... } }
  const localPath = join(here, "layout.local.json");
  if (existsSync(localPath)) Object.assign(base, JSON.parse(readFileSync(localPath, "utf8")));
  return base;
})();
const S = L.sticky;
const els = [];
const zone = (id, z, stroke, fill) =>
  els.push({ id, type: "rectangle", x: z.x, y: z.y, width: z.w, height: z.h,
             backgroundColor: fill, strokeColor: stroke, strokeStyle: "dashed", roughness: 0, locked: true });
const text = (id, x, y, t, size = 20, color = "#343a40", w = 400) =>
  els.push({ id, type: "text", x, y, width: w, height: size * 1.4, text: t, fontSize: size, strokeColor: color, locked: true });
const slot = (id, x, y, label) =>
  els.push({ id, type: "rectangle", x, y, width: S.w, height: S.h, strokeColor: "#adb5bd",
             strokeStyle: "dotted", roughness: 0, locked: true, ...(label ? { text: label, fontSize: 12, strokeColor: "#868e96" } : {}) });

// Header
text("title", 40, 30, L.title || "My Board", 32, "#212529", 600);
let lx = 420;
for (const [key, c] of Object.entries(L.companies)) {
  els.push({ id: `legend-${key}`, type: "rectangle", x: lx, y: 36, width: 26, height: 26,
             backgroundColor: c.fill, strokeColor: c.stroke, roughness: 0, locked: true });
  text(`legend-${key}-t`, lx + 32, 38, c.name, 16, "#495057", 180);
  lx += 46 + c.name.length * 9.5 + 20;
}
text("rules", 40, 110, "Rules:  Big 3 every morning   |   WIP 3 in In Progress   |   max 5 in Must Have To Do   |   new tasks go to Backlog   |   Friday review: archive Done, set 3-5 weekly goals", 14, "#868e96", 2300);

// This Week
zone("zone-week", L.zones.week, "#495057", "#f8f9fa");
text("zone-week-l", L.zones.week.x + 20, L.zones.week.y + 12, "This Week  -  goals (3 to 5)", 20, "#212529");
for (let i = 0; i < L.week.slots; i++) slot(`goal-slot-${i + 1}`, L.week.slotX0 + i * L.week.slotStep, L.week.slotY, `goal ${i + 1}`);

// Today
zone("zone-today", L.zones.today, "#495057", "#fff9db");
text("zone-today-l", L.zones.today.x + 20, L.zones.today.y + 12, "Today  -  Big 3 + time blocks", 20, "#212529");
for (let i = 0; i < L.today.slots; i++) slot(`today-slot-${i + 1}`, L.today.slotX0 + i * L.today.slotStep, L.today.slotY, `big ${i + 1}`);
for (const [i, b] of L.today.blocks.entries())
  els.push({ id: `today-block-${i + 1}`, type: "rectangle", x: b.x, y: L.today.slotY, width: 240, height: S.h,
             backgroundColor: "#fff3bf", strokeColor: "#f08c00", roughness: 0, text: b.label, fontSize: 14, locked: true });

// Backlog
zone("zone-backlog", L.zones.backlog, "#495057", "#f8f9fa");
text("zone-backlog-l", L.zones.backlog.x + 20, L.zones.backlog.y + 12, `Backlog  -  one strip per company, up to ${L.backlog.maxPerStrip} each, prune at ${L.backlog.pruneAt}`, 20, "#212529", 900);
Object.entries(L.companies).forEach(([key, c], i) => {
  const y = L.backlog.stripY0 + i * L.backlog.stripH;
  els.push({ id: `strip-${key}`, type: "rectangle", x: L.zones.backlog.x + 10, y, width: L.zones.backlog.w - 20, height: L.backlog.stripH - 10,
             strokeColor: c.stroke, strokeStyle: "dashed", roughness: 0, locked: true });
  els.push({ id: `strip-${key}-label`, type: "rectangle", x: L.backlog.labelX, y: y + Math.round((L.backlog.stripH - 10 - S.h) / 2), width: L.backlog.labelW, height: S.h,
             backgroundColor: c.fill, strokeColor: c.stroke, roughness: 0, text: c.name, fontSize: 16, locked: true });
  // Blank stickies: double-click one in the app and type. add-task.mjs reuses them.
  for (let b = 0; b < L.backlog.blanksPerStrip; b++)
    els.push(...stickyElements({ id: `blank-${key}-${b + 1}`, x: L.backlog.slotX0 + b * L.backlog.slotStep, y: y + L.backlog.rowY[0],
                                 w: S.w, h: S.h, fill: c.fill }));
});

// Icebox
zone("zone-icebox", L.zones.icebox, "#868e96", "#f1f3f5");
text("zone-icebox-l", L.zones.icebox.x + 20, L.zones.icebox.y + 12, L.icebox.label, 18, "#495057", 2000);

// Kanban
zone("zone-kanban", L.zones.kanban, "#495057", "#ffffff");
text("zone-kanban-l", L.zones.kanban.x + 20, L.zones.kanban.y + 12, "Board", 20, "#212529");
Object.entries(L.kanban.cols).forEach(([key, name], i) => {
  const x = L.kanban.colX0 + i * L.kanban.colStep;
  text(`col-${key}-l`, x + 10, L.zones.kanban.y + 45, name, 18, "#212529", 320);
  if (i > 0) els.push({ id: `col-sep-${i}`, type: "line", x: x - 5, y: L.kanban.lanes.must.y, points: [[0, 0], [0, 1575]], strokeColor: "#ced4da", roughness: 0, locked: true });
});
for (const [key, lane] of Object.entries(L.kanban.lanes)) {
  els.push({ id: `lane-${key}`, type: "rectangle", x: L.zones.kanban.x + 20, y: lane.y, width: L.zones.kanban.w - 40, height: lane.h,
             strokeColor: lane.stroke, strokeStyle: "dashed", roughness: 0, locked: true });
  text(`lane-${key}-l`, L.zones.kanban.x + 30, lane.y + 8, lane.label, 14, lane.stroke, 200);
}

process.stdout.write(JSON.stringify(els, null, 1));
