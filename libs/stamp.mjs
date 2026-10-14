// Place a library item (sticky note, cloud icon, logo) on the canvas.
//   node libs/stamp.mjs list [query]                 list item names, optional substring filter
//   node libs/stamp.mjs add --item "<name>" --x 100 --y 200 [--scale 1] [--text "label"]
// Items are matched by substring, case-insensitive. Ids are regenerated so the same item can be stamped many times.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const url = process.env.EXPRESS_SERVER_URL || "http://127.0.0.1:3456";

function loadAll() {
  const items = [];
  for (const f of readdirSync(here).filter(f => f.endsWith(".excalidrawlib")).sort()) {
    const lib = JSON.parse(readFileSync(join(here, f), "utf8"));
    const base = f.replace(/\.excalidrawlib$/, "");
    if (Array.isArray(lib.libraryItems))
      lib.libraryItems.forEach((it, i) => items.push({ lib: base, name: it.name || `${base} ${i + 1}`, elements: it.elements }));
    else if (Array.isArray(lib.library))
      lib.library.forEach((els, i) => items.push({ lib: base, name: `${base} ${i + 1}`, elements: els }));
  }
  return items;
}

const argv = process.argv.slice(2);
const cmd = argv[0];
const args = {};
for (let i = 1; i < argv.length; i++) if (argv[i].startsWith("--")) { args[argv[i].slice(2)] = argv[i + 1] ?? ""; i++; }
const items = loadAll();

if (cmd === "list") {
  const q = (argv[1] && !argv[1].startsWith("--") ? argv[1] : "").toLowerCase();
  for (const it of items) if (!q || it.name.toLowerCase().includes(q) || it.lib.includes(q)) console.log(`${it.lib}\t${it.name}`);
  process.exit(0);
}
if (cmd !== "add" || !args.item) { console.error("usage: list [query] | add --item <name> --x N --y N [--scale S] [--text label]"); process.exit(2); }

const q = args.item.toLowerCase();
const hit = items.find(it => it.name.toLowerCase() === q) || items.find(it => it.name.toLowerCase().includes(q));
if (!hit) { console.error(`No library item matches "${args.item}". Try: node libs/stamp.mjs list ${args.item}`); process.exit(1); }

const scale = Number(args.scale || 1);
const tx = Number(args.x || 0), ty = Number(args.y || 0);
const minX = Math.min(...hit.elements.map(e => e.x)), minY = Math.min(...hit.elements.map(e => e.y));
const idMap = new Map(hit.elements.map(e => [e.id, randomBytes(8).toString("hex")]));
const gidMap = new Map();
const gid = g => { if (!gidMap.has(g)) gidMap.set(g, randomBytes(8).toString("hex")); return gidMap.get(g); };
const out = hit.elements.filter(e => !e.isDeleted).map(e => {
  // Old packs use the legacy type "draw"; the server only knows "freedraw".
  const n = { ...e, type: e.type === "draw" ? "freedraw" : e.type, id: idMap.get(e.id), x: tx + (e.x - minX) * scale, y: ty + (e.y - minY) * scale,
              width: e.width * scale, height: e.height * scale, groupIds: (e.groupIds || []).map(gid),
              version: 1, versionNonce: Math.floor(Math.random() * 2 ** 31), seed: Math.floor(Math.random() * 2 ** 31), updated: Date.now() };
  if (Array.isArray(e.points)) n.points = e.points.map(([px, py, ...rest]) => [px * scale, py * scale, ...rest]);
  if (e.fontSize) n.fontSize = e.fontSize * scale;
  if (e.containerId) n.containerId = idMap.get(e.containerId) || null;
  if (Array.isArray(e.boundElements)) n.boundElements = e.boundElements.map(b => ({ ...b, id: idMap.get(b.id) || b.id })).filter(b => idMap.has(b.id) || true);
  if (e.startBinding) n.startBinding = { ...e.startBinding, elementId: idMap.get(e.startBinding.elementId) || e.startBinding.elementId };
  if (e.endBinding) n.endBinding = { ...e.endBinding, elementId: idMap.get(e.endBinding.elementId) || e.endBinding.elementId };
  return n;
});
// Optional label: replace the first text element's text, or add one under the item.
if (args.text) {
  const t = out.find(e => e.type === "text");
  if (t) { t.text = args.text; t.originalText = args.text; }
  else out.push({ id: randomBytes(8).toString("hex"), type: "text", x: tx, y: ty + Math.max(...out.map(e => e.y + e.height - ty)) + 8,
                  width: 200, height: 24, text: args.text, fontSize: 16, fontFamily: 1, strokeColor: "#343a40", groupIds: [] });
}
const res = await fetch(`${url}/api/elements/batch`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ elements: out }) });
const body = await res.json().catch(() => ({}));
if (!res.ok || body.success === false) { console.error("canvas rejected:", JSON.stringify(body).slice(0, 400)); process.exit(1); }
console.log(JSON.stringify({ item: hit.name, lib: hit.lib, elements: out.length, x: tx, y: ty }));
