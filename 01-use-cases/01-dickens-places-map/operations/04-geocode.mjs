// Step 4 (deterministic lookup): find coordinates for each place in a gazetteer.
// The gazetteer is OpenStreetMap's Nominatim (https://nominatim.openstreetmap.org), which asks for
// at most one request per second, a User-Agent that identifies the application, and caching of
// results (https://operations.osmfoundation.org/policies/nominatim/). This script does all three:
// every response is saved in data/cache/nominatim/, so a rerun sends no requests for places it has seen.
//
// Run from the repo root:
//   node mk-projects/01-dickens-places-map/operations/04-geocode.mjs [--min N]
// --min N geocodes only places mentioned at least N times (default 1: every place).
// Reads 03-places-inventory.csv; writes 04-places-geocoded.csv.
//
// What it does NOT do is guess. A place counts as resolved only if one of Nominatim's top three
// results has a name containing the words of the place's name AND is the right kind of feature
// (a street for a street, a town for a town). Everything else is left unresolved, for a human
// (or step 4b, which asks a model and labels the answer as model judgment) to look at.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { csvCell } from './03-inventory.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, 'data', 'cache', 'nominatim');
const UA = 'ENGLISH-298AI-dickens-places-map/1.0 (educational class example; one-off cached geocoding of place names in Dickens novels)';
// Roughly Victorian London plus its edges (Hampstead to Greenwich, Hammersmith to Stratford)
const LONDON_VIEWBOX = '-0.30,51.62,0.12,51.42';
const STOP = new Set(['the', 'of', 'and', 'a', 'in', 'at', 'on', 'london', 'england', 'old', 'new']);

export function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

export function writeCSV(rows) {
  const cols = Object.keys(rows[0]);
  return [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n';
}

const tokens = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/['’]/g, '').replace(/\bsaint\b/g, 'st').split(/[^a-z0-9]+/).filter((t) => t && !STOP.has(t));

let lastRequest = 0;
async function nominatim(params) {
  const qs = new URLSearchParams({ format: 'jsonv2', limit: '3', 'accept-language': 'en', ...params });
  const url = `https://nominatim.openstreetmap.org/search?${qs}`;
  const file = join(CACHE, createHash('sha1').update(url).digest('hex') + '.json');
  try { return { results: JSON.parse(await readFile(file, 'utf8')).results, cached: true }; } catch {}
  const wait = lastRequest + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const results = await res.json();
  await writeFile(file, JSON.stringify({ url, fetched: new Date().toISOString(), results }));
  return { results, cached: false };
}

// If the model's normalized name puts a place in Britain ("Brighton, Sussex"), search only Britain
// and Ireland, so we don't get Brighton, Sussex County, New Jersey.
const BRITISH = new Set(['england', 'scotland', 'wales', 'ireland', 'uk', 'united kingdom', 'great britain', 'britain',
  'bedfordshire', 'berkshire', 'buckinghamshire', 'cambridgeshire', 'cheshire', 'cornwall', 'cumberland', 'derbyshire',
  'devon', 'devonshire', 'dorset', 'durham', 'essex', 'gloucestershire', 'hampshire', 'herefordshire', 'hertfordshire',
  'huntingdonshire', 'kent', 'lancashire', 'leicestershire', 'lincolnshire', 'middlesex', 'norfolk', 'northamptonshire',
  'northumberland', 'nottinghamshire', 'oxfordshire', 'rutland', 'shropshire', 'somerset', 'staffordshire', 'suffolk',
  'surrey', 'sussex', 'east sussex', 'west sussex', 'warwickshire', 'westmorland', 'wiltshire', 'worcestershire',
  'yorkshire', 'isle of wight', 'tyne and wear', 'west midlands', 'merseyside', 'greater manchester']);

// The query: the place's name without parenthetical asides; London places are searched inside London.
function queryFor(p) {
  const name = p.name.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  if (p.in_london === 'true') {
    return { q: /london/i.test(name) ? name : `${name}, London`, viewbox: LONDON_VIEWBOX, bounded: '1' };
  }
  const context = name.split(',').slice(1).map((x) => x.trim().toLowerCase());
  if (context.some((c) => BRITISH.has(c))) return { q: name, countrycodes: 'gb,ie' };
  return { q: name };
}

// Which kinds of OpenStreetMap feature can stand for each type of place. A "building" can be
// almost anything except a road or an area; a "town" must be a place or an administrative area.
const COMPAT = {
  town: ['place', 'boundary'],
  district: ['place', 'boundary', 'landuse'],
  region: ['boundary', 'place', 'natural'],
  country: ['boundary', 'place'],
  street: ['highway', 'place', 'landuse'],
  square_or_park: ['leisure', 'place', 'highway', 'landuse', 'tourism', 'historic', 'amenity'],
  river_or_water: ['waterway', 'natural', 'water', 'place'],
  bridge: ['man_made', 'highway', 'bridge', 'historic', 'railway'],
};
const compatible = (type, r) => COMPAT[type] ? COMPAT[type].includes(r.category) : !['highway', 'place', 'boundary'].includes(r.category);

// Does the result's own name contain the words of the place's name (before the first comma)?
function judge(p, r) {
  const head = p.name.replace(/\(.*?\)/g, '').split(',')[0];
  let want = tokens(head);
  if (!want.length) want = head.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); // e.g. "London" itself
  const label = r.name || r.display_name.split(',')[0];
  const got = new Set([...tokens(label), ...label.toLowerCase().split(/[^a-z0-9]+/)]);
  if (!want.length) return { score: 0, confidence: 'low' };
  const score = want.filter((t) => got.has(t)).length / want.length;
  return { score, confidence: score === 1 ? 'high' : score >= 0.5 ? 'medium' : 'low' };
}

// Of Nominatim's top three results, keep those whose name matches and whose kind fits the type;
// for areas, take the most prominent (Nominatim's "importance"), otherwise the first.
function choose(p, results) {
  const ok = results
    .map((r) => ({ r, ...judge(p, r) }))
    .filter((x) => x.confidence !== 'low' && compatible(p.type, x.r))
    .filter((x) => !['region', 'country'].includes(p.type) || (x.r.importance ?? 0) >= 0.25);
  if (!ok.length) return null;
  if (['town', 'region', 'country', 'district'].includes(p.type)) ok.sort((a, b) => (b.r.importance ?? 0) - (a.r.importance ?? 0));
  return ok[0];
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  const minIdx = process.argv.indexOf('--min');
  const min = minIdx > 0 ? Number(process.argv[minIdx + 1]) : 1;
  const places = parseCSV(await readFile(join(HERE, '03-places-inventory.csv'), 'utf8'));
  let sent = 0, n = 0;
  const out = [];
  for (const p of places) {
    const base = { ...p, lat: '', lon: '', geo_source: '', geo_confidence: '', geo_match: '', osm: '' };
    if (p.type === 'fictional') { out.push({ ...base, geo_source: 'not looked up (fictional or unlocatable)' }); continue; }
    if (Number(p.mentions) < min) { out.push({ ...base, geo_source: `not looked up (fewer than ${min} mentions)` }); continue; }
    const { results, cached } = await nominatim(queryFor(p));
    if (!cached) sent++;
    if (++n % 100 === 0) console.log(`  ${n} looked up (${sent} sent to Nominatim)`);
    if (!results.length) { out.push({ ...base, geo_source: 'unresolved (no gazetteer result)' }); continue; }
    const pick = choose(p, results);
    if (!pick) {
      out.push({ ...base, geo_source: 'unresolved (gazetteer match rejected)', geo_match: results[0].display_name });
      continue;
    }
    const r = pick.r;
    out.push({
      ...base,
      lat: Number(r.lat).toFixed(5),
      lon: Number(r.lon).toFixed(5),
      geo_source: 'gazetteer (Nominatim)',
      geo_confidence: pick.confidence,
      geo_match: r.display_name,
      osm: r.osm_type && r.osm_id ? `https://www.openstreetmap.org/${r.osm_type}/${r.osm_id}` : '',
    });
  }
  await writeFile(join(HERE, '04-places-geocoded.csv'), writeCSV(out));
  const count = (f) => out.filter(f).length;
  console.log(`looked up ${n} (${sent} new requests). gazetteer high ${count((r) => r.geo_source.startsWith('gazetteer') && r.geo_confidence === 'high')}, medium ${count((r) => r.geo_source.startsWith('gazetteer') && r.geo_confidence === 'medium')}, unresolved ${count((r) => r.geo_source.startsWith('unresolved'))}, fictional ${count((r) => r.geo_source.includes('fictional'))}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
