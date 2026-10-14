---
name: stamp
description: Place a sticky note, cloud icon (AWS, Azure, GCP), or technology logo from the Excalidraw library packs on the live canvas. Use when the user asks for an icon, logo, or sticky note in a diagram, or names a cloud service like S3, Lambda, BigQuery, Azure Functions.
---

# Stamp a library item

Packs live in `libs/`. Script: `node libs/stamp.mjs`.

1. Find the item: `node libs/stamp.mjs list <word>`. Pick the exact name. If several match, prefer `aws-serverless-icons-v2` for AWS, `original-google-architecture-icons` for GCP, `azure-*` for Azure, `simple-sticky-notes` for stickies.
2. Place it: `node libs/stamp.mjs add --item "<name>" --x <x> --y <y> [--scale 1] [--text "label"]`. Icons are about 80 to 120 px wide at scale 1.
3. For a diagram, lay icons out on a grid with 200 px spacing, then connect them with arrows through the canvas CLI (`add` with `startElementId` / `endElementId` is not possible for stamped groups; use arrows with explicit `points`).
4. `screenshot` and check overlap.

Stamped items are groups of plain shapes. They can be moved and resized in the app like anything else.
