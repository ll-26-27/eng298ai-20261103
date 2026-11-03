// 04-build.mjs — deterministic code, no model.
//
// Inlines the three data files and the route into the page template and
// writes outputs/index.html, so the page opens from the file system with no
// server and no fetches of its own (only Leaflet and the basemap tiles come
// from the network).
//
// Run from the repo root:
//   node 01-use-cases/maps/04-phaedrus-walk/operations/04-build.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(readFileSync(join(here, f), "utf8"));

const passages = read("01-passages.json");
const stops = read("02-stops.json");
const landmarks = read("03-landmarks.json");
const route = read("03-route.geojson");

// Consistency checks: every stop in 02 has a passage in 01, and every
// landmark a stop cites exists in 03.
const pids = new Set(passages.stops.map((s) => s.id));
const lids = new Set(landmarks.landmarks.map((l) => l.id));
for (const s of stops.stops) {
  if (!pids.has(s.id)) throw new Error(`02-stops.json: stop "${s.id}" has no passage in 01-passages.json`);
  for (const l of s.landmarks || []) if (!lids.has(l)) throw new Error(`02-stops.json: stop "${s.id}" cites unknown landmark "${l}"`);
  for (const k of s.sources) if (!stops.sources[k]) throw new Error(`02-stops.json: stop "${s.id}" cites unknown source "${k}"`);
}
const unresolved = landmarks.landmarks.filter((l) => l.lat == null).map((l) => l.id);
if (unresolved.length) console.warn(`warning: landmarks without coordinates will be skipped: ${unresolved.join(", ")}`);

const data = { built: new Date().toISOString().slice(0, 10), passages, stops, landmarks, route };
// "</script" inside a JSON string would end the script block; escape it.
const json = JSON.stringify(data).replace(/<\//g, "<\\/");
const html = readFileSync(join(here, "04-template.html"), "utf8").replace("/*__DATA__*/", json);
mkdirSync(join(here, "..", "outputs"), { recursive: true });
writeFileSync(join(here, "..", "outputs", "index.html"), html);
console.log(`wrote outputs/index.html (${(html.length / 1024).toFixed(0)} KB): ${stops.stops.length} stops, ${passages.stops.length} passages, ${landmarks.landmarks.length - unresolved.length} landmarks, ${route.features.length} route features`);
