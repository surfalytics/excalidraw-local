// One board sticky = Post-it body and folded corner from libs/post-it.excalidrawlib,
// plus an invisible rectangle on top that carries the text. All three share a group,
// so dragging moves the whole note. Scripts identify a sticky by the rectangle id.
import { randomBytes } from "node:crypto";

// Geometry of the library item, normalized to its own box (211.39 x 208.63).
const BODY = [[0, 0], [207.617, 0.729], [211.392, 174.341], [176.663, 207.166], [2.265, 208.625], [0, 0]];
const FLAP_AT = [211.062, 175.061];
const FLAP = [[0, 0], [-33.889, -5.0], [-36.111, 33.333], [0, 0]];
const BOX = [211.392, 208.625];

export const PART_SUFFIXES = ["-body", "-flap"];

export function stickyElements({ id, x, y, w, h, fill, stroke = "#343a40", text, fontSize = 14, locked = false }) {
  const sx = w / BOX[0], sy = h / BOX[1];
  const groupId = randomBytes(8).toString("hex");
  const common = { fillStyle: "solid", strokeWidth: 1, roughness: 1, opacity: 100, groupIds: [groupId], locked };
  const body = { id: `${id}-body`, type: "line", x, y, width: w, height: h, points: BODY.map(([px, py]) => [px * sx, py * sy]),
                 backgroundColor: fill, strokeColor: stroke, ...common };
  const flap = { id: `${id}-flap`, type: "line", x: x + FLAP_AT[0] * sx, y: y + FLAP_AT[1] * sy,
                 width: 36.111 * sx, height: 38.333 * sy, points: FLAP.map(([px, py]) => [px * sx, py * sy]),
                 backgroundColor: "#ffffff", strokeColor: stroke, ...common };
  const face = { id, type: "rectangle", x, y, width: w, height: h, strokeColor: "transparent", backgroundColor: "transparent",
                 roughness: 0, groupIds: [groupId], locked };
  if (!text) return [body, flap, face];
  // Explicit bound text. A server-made label would copy the transparent stroke color and be invisible.
  const maxChars = Math.floor((w - 12) / (fontSize * 0.55));
  const wrap = line => { const out = []; let cur = ""; for (const word of line.split(" ")) {
    if ((cur + " " + word).trim().length > maxChars && cur) { out.push(cur); cur = word; } else cur = (cur + " " + word).trim(); }
    if (cur) out.push(cur); return out; };
  const lines = text.split("\n").flatMap(wrap);
  text = lines.join("\n");
  const tw = Math.min(w - 12, Math.max(...lines.map(l => l.length)) * fontSize * 0.6);
  const th = lines.length * fontSize * 1.25;
  const label = { id: `${id}-label`, type: "text", x: x + (w - tw) / 2, y: y + (h - th) / 2, width: tw, height: th,
                  text, originalText: text, fontSize, fontFamily: 1, textAlign: "center", verticalAlign: "middle",
                  strokeColor: "#343a40", containerId: id, groupIds: [groupId], locked };
  face.boundElements = [{ id: label.id, type: "text" }];
  return [body, flap, face, label];
}
