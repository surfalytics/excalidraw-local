// One board sticky = one filled hand-drawn rectangle with bound text.


export const PART_SUFFIXES = [];

// The note is a single filled, hand-drawn rectangle (same style as the
// "Simple Sticky Notes" library pack). One element, so double-click edits
// bound text and dragging moves the whole note. Its text is `<id>-label`.
export function stickyElements({ id, x, y, w, h, fill, stroke = "#343a40", text, fontSize = 14, locked = false }) {
  const face = { id, type: "rectangle", x, y, width: w, height: h, backgroundColor: fill, strokeColor: stroke,
                 fillStyle: "solid", strokeWidth: 1, roughness: 1, roundness: null, locked };
  if (!text) return [face];
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
                  strokeColor: "#343a40", containerId: id, locked };
  face.boundElements = [{ id: label.id, type: "text" }];
  return [face, label];
}
