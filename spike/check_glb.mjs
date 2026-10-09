// node spike/check_glb.mjs <muscles.glb> <TA2.csv> [--list]
// Counts nodes/meshes/vertices, flags duplicate node names, and names not in TA2 (English or Latin).
// Exits 1 on an empty GLB or duplicate names (raw, or after three.js GLTFLoader name sanitising).
import { readFileSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";

const [glbPath, ta2Path] = process.argv.slice(2);
if (!glbPath || !ta2Path) {
  console.error("usage: node check_glb.mjs <muscles.glb> <TA2.csv> [--list]");
  process.exit(2);
}

const doc = await new NodeIO().read(glbPath);
const root = doc.getRoot();
const nodes = root.listNodes().filter((n) => n.getMesh());
const meshes = root.listMeshes();
const vertsOf = (m) => m.listPrimitives().reduce((s, p) => s + (p.getAttribute("POSITION")?.getCount() ?? 0), 0);
const uniqueVerts = meshes.reduce((s, m) => s + vertsOf(m), 0);
const drawnVerts = nodes.reduce((s, n) => s + vertsOf(n.getMesh()), 0);

// TA2.csv: each line is one quoted field, ";"-separated inside; column 1 English, 2 Latin.
const terms = new Set();
for (const line of readFileSync(ta2Path, "utf8").replace(/^﻿/, "").split(/\r?\n/).slice(1)) {
  const cols = line.replace(/^"|"$/g, "").split(";");
  if (cols[1]) terms.add(cols[1].trim().toLowerCase());
  if (cols[2]) terms.add(cols[2].trim().toLowerCase());
}

// Z-Anatomy names: "<TA2 English>.l" / ".r", some wrapped in parentheses.
const baseName = (name) => name.replace(/\.[lr]$/, "").replace(/^\((.*)\)$/, "$1");
// three.js PropertyBinding.sanitizeNodeName: whitespace -> "_", strips []./: characters.
const threeName = (name) => name.replace(/\s/g, "_").replace(/[[\].:/]/g, "");

const dupes = (arr) => [...new Set(arr.filter((x, i) => arr.indexOf(x) !== i))];
const names = nodes.map((n) => n.getName());
const dup = dupes(names);
const dupThree = dupes(names.map(threeName));
const sided = names.filter((n) => /\.[lr]$/.test(n)).length;
const unmatched = [...new Set(names.map(baseName))].filter((b) => !terms.has(b.toLowerCase())).sort();

console.log(`nodes with mesh: ${nodes.length}`);
console.log(`meshes: ${meshes.length}`);
console.log(`vertices: ${uniqueVerts} unique, ${drawnVerts} drawn (instances counted)`);
console.log(`left/right suffixed nodes: ${sided}, unsided: ${nodes.length - sided}`);
console.log(`duplicate names: ${dup.length}${dup.length ? " " + JSON.stringify(dup) : ""}`);
console.log(`duplicate names after three.js sanitising: ${dupThree.length}${dupThree.length ? " " + JSON.stringify(dupThree) : ""}`);
console.log(`distinct base names: ${new Set(names.map(baseName)).size}, not in TA2: ${unmatched.length}`);
for (const u of unmatched) console.log(`  unmatched: ${u}`);
if (process.argv.includes("--list")) for (const n of [...names].sort()) console.log(`node: ${n}`);

if (nodes.length === 0 || dup.length || dupThree.length) process.exit(1);
