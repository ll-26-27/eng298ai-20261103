// 03-geocode.mjs — deterministic lookup, no model.
//
// Coordinates for the modern landmarks that anchor the walk. Three lookups,
// tried in order, each cached to disk in operations/cache/ so a rerun sends
// nothing:
//   1. OpenStreetMap feature by id (Overpass API, one batched request): exact, used where a
//      specific mapped feature is meant (a church, a temple's footprint, the
//      one uncovered stretch of the river).
//   2. Nominatim gazetteer search (one request a second, identifying
//      User-Agent, results confined to an Athens bounding box).
//   3. Wikidata, property P625 (coordinate location).
// The `geocoder` field on every row says which answered, and `matched` says
// what it matched. The walking route itself is NOT geocoded: it is a
// hand-drawn, conjectural line in 03-route.geojson, and the plane tree has no
// coordinates of its own anywhere in this folder.
//
// Run from the repo root:
//   node 01-use-cases/maps/04-phaedrus-walk/operations/03-geocode.mjs
// Writes operations/03-landmarks.json.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const cacheDir = join(here, "cache");
mkdirSync(cacheDir, { recursive: true });
const UA = "eng298ai-20261103-phaedrus-walk/1.0 (Bok Center Learning Lab workshop; github.com/ll-26-27)";

// `osm` is an OpenStreetMap feature (type/id) found by an Overpass search for
// named features within 1.2 km of the Olympieion on 2026-11-03; `query` is
// for Nominatim; `wikidata` the item for the fallback. `role` says what the
// point does on the map.
const LANDMARKS = [
  { id: "olympieion", name: "Temple of Olympian Zeus (Olympieion)", osm: "way/63765671", query: "Temple of Olympian Zeus, Athens", wikidata: "Q207650", role: "anchor",
    why: "Phaedrus has come from Epicrates' house, “the one that was Morychus’s, near the Olympieion” (227b)." },
  { id: "acropolis", name: "Acropolis", osm: "relation/4423249", query: "Acropolis of Athens", wikidata: "Q131013", role: "orientation", why: "Orientation only." },
  { id: "arch-of-hadrian", name: "Arch of Hadrian", osm: "way/175107932", query: "Arch of Hadrian, Athens", wikidata: "Q1056262", role: "orientation", why: "Orientation only (AD 131/2, long after the dialogue)." },
  { id: "delphinion", name: "Temple of Apollo Delphinios (site)", osm: "way/146815833", query: "Delphinion, Athens", role: "landmark", why: "Pausanias 1.19.1 places it close to the Olympieion; marks the sanctuary quarter the pair walk through." },
  { id: "agia-fotini", name: "Church of Agia Fotini on the Ilissos", osm: "way/81830941", query: "Agia Fotini Ilissou, Athens", role: "landmark",
    why: "Built 1872 on the river bed; the one place the Ilissos is still open to the sky in central Athens." },
  { id: "pan-sanctuary", name: "Sanctuary of Pan (rock relief)", osm: "node/4881822067", query: "Sanctuary of Pan, Ardittou, Athens", role: "landmark",
    why: "Rock-cut sanctuary beside the church; a relief of Pan was found on the rock in 1911. Some identify this rocky stretch with the shrine of Acheloos and the Nymphs of 230b–c; others do not." },
  { id: "ilissos-open", name: "The Ilissos, uncovered stretch", osm: "way/395596983", role: "landmark",
    why: "The only section of the river mapped as not in a tunnel; everything else is culverted under streets." },
  { id: "artemis-agrotera", name: "Temple of Artemis Agrotera (site, Agrai)", osm: "way/479255983", query: "Temple of Artemis Agrotera, Athens", wikidata: "Q2412946", role: "landmark",
    why: "Pausanias 1.19.6: “across the Ilisus is a district called Agrae and a temple of Artemis Agrotera.” Socrates at 229c: the altar of Boreas is “where you cross over to the precinct of Agra.” Demolished 1778; retaining wall found 1962." },
  { id: "zeus-meilichios", name: "Temple of Zeus Meilichios (site)", osm: "node/9517245642", role: "landmark", why: "A 4th-century BC temple on the Agrai bank; shows how thick with sanctuaries this side of the river was." },
  { id: "panathenaic-stadium", name: "Panathenaic Stadium", osm: "relation/19023844", query: "Panathenaic Stadium, Athens", wikidata: "Q207848", role: "landmark",
    why: "Built by Lykourgos c. 330 BC, so not yet there in the dialogue’s dramatic date; marks the ravine between Agra and Ardettos." },
  { id: "ardettos", name: "Ardettos hill", osm: null, query: "Ardettos, Athens", wikidata: "Q4789181", role: "landmark",
    why: "Wycherley (1963) put the plane tree on the east bank at the foot of Ardettos." },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const key = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

async function cached(label, url, fetcher) {
  const file = join(cacheDir, `${label}-${key(url)}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const data = await fetcher(url);
  const rec = { url, fetched: new Date().toISOString(), data };
  writeFileSync(file, JSON.stringify(rec, null, 2));
  return rec;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// One Overpass request for every OSM id at once (the per-id version was
// rate-limited with HTTP 429 on 2026-11-03), cached as a single file.
let overpassBatch = null;
async function overpass(osm) {
  if (!overpassBatch) {
    const ids = LANDMARKS.filter((l) => l.osm).map((l) => { const [t, i] = l.osm.split("/"); return `${t}(${i});`; }).join("");
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(`[out:json];(${ids});out center tags;`)}`;
    const { data } = await cached("overpass", url, getJson);
    overpassBatch = new Map(data.elements.map((el) => [`${el.type}/${el.id}`, el]));
  }
  const el = overpassBatch.get(osm);
  if (!el) return null;
  const c = el.center || { lat: el.lat, lon: el.lon };
  const t = el.tags || {};
  return { lat: c.lat, lon: c.lon, label: t["name:en"] || t.name || osm, tags: t };
}

async function nominatim(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&q=${encodeURIComponent(q)}&viewbox=23.70,37.99,23.78,37.95&bounded=1`;
  const { data } = await cached("nominatim", url, getJson);
  return data;
}

async function wikidata(qid) {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const { data } = await cached("wikidata", url, getJson);
  const ent = data.entities[qid];
  const claim = ent?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
  return claim ? { lat: claim.latitude, lon: claim.longitude, label: ent?.labels?.en?.value } : null;
}

const rows = [];
for (const lm of LANDMARKS) {
  const row = { id: lm.id, name: lm.name, role: lm.role, why: lm.why, lat: null, lon: null, geocoder: null, matched: null, notes: [] };
  if (lm.osm) {
    try {
      const o = await overpass(lm.osm);
      if (o) Object.assign(row, { lat: o.lat, lon: o.lon, geocoder: "overpass", matched: `OSM ${lm.osm}: ${o.label}${o.tags.start_date ? ` (start_date ${o.tags.start_date})` : ""}` });
      else row.notes.push(`overpass: ${lm.osm} not found`);
    } catch (e) { row.notes.push(`overpass: ${e.message}`); }
  }
  if (row.lat === null && lm.query) {
    try {
      const hits = await nominatim(lm.query);
      await sleep(1100);
      const hit = hits && hits[0];
      if (hit) Object.assign(row, { lat: +hit.lat, lon: +hit.lon, geocoder: "nominatim", matched: `${hit.display_name} [${hit.type}] (OSM ${hit.osm_type}/${hit.osm_id})` });
      else row.notes.push("nominatim: no result in the Athens bounding box");
    } catch (e) { row.notes.push(`nominatim: ${e.message}`); }
  }
  if (row.lat === null && lm.wikidata) {
    try {
      const w = await wikidata(lm.wikidata);
      if (w) Object.assign(row, { lat: w.lat, lon: w.lon, geocoder: "wikidata", matched: `${w.label} (${lm.wikidata}, P625)` });
      else row.notes.push("wikidata: no P625");
    } catch (e) { row.notes.push(`wikidata: ${e.message}`); }
  }
  console.log(`${lm.id.padEnd(20)} ${(row.geocoder || "UNRESOLVED").padEnd(10)} ${row.lat ?? ""} ${row.lon ?? ""}  ${row.matched ?? row.notes.join("; ")}`);
  rows.push(row);
}

writeFileSync(join(here, "03-landmarks.json"), JSON.stringify({
  built: new Date().toISOString().slice(0, 10),
  userAgent: UA,
  attribution: "Coordinates © OpenStreetMap contributors (ODbL) via Overpass and Nominatim; Wikidata (CC0) where noted.",
  landmarks: rows,
}, null, 2));
const unresolved = rows.filter((r) => r.lat === null);
console.log(`\nwrote operations/03-landmarks.json: ${rows.length - unresolved.length}/${rows.length} located`);
if (unresolved.length) { console.error("UNRESOLVED:", unresolved.map((r) => r.id).join(", ")); process.exitCode = 1; }
