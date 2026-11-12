// Step 4 (deterministic lookup): find coordinates for each place in a gazetteer.
// The gazetteer is OpenStreetMap's Nominatim (https://nominatim.openstreetmap.org), which asks for
// at most one request per second, a User-Agent that identifies the application, and caching of
// results (https://operations.osmfoundation.org/policies/nominatim/). This script does all three:
// every response is saved in data/cache/nominatim/, so a rerun sends no requests for places it has seen.
//
// Run from the repo root:
//   node 01-use-cases/maps/05-frankenstein-places-map/operations/04-geocode.mjs [--min N]
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
const UA = 'ENGLISH-298AI-frankenstein-places-map/1.0 (educational class example; one-off cached geocoding of place names in Frankenstein)';
const STOP = new Set(['the', 'of', 'and', 'a', 'in', 'at', 'on', 'old', 'new', 'river', 'lake', 'mountains', 'islands']);

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

// If the model's normalized name puts a place in a country ("Lake Geneva, Switzerland", "Brighton,
// Sussex"), search only that country, so we don't get Lake Geneva, Wisconsin. "France/Italy" means
// either. British counties count as Britain (and Ireland, which was in the United Kingdom in 1818).
const BRITISH = new Set(['england', 'scotland', 'wales', 'ireland', 'uk', 'united kingdom', 'great britain', 'britain',
  'bedfordshire', 'berkshire', 'buckinghamshire', 'cambridgeshire', 'cheshire', 'cornwall', 'cumberland', 'cumbria', 'derbyshire',
  'devon', 'devonshire', 'dorset', 'durham', 'essex', 'gloucestershire', 'hampshire', 'herefordshire', 'hertfordshire',
  'huntingdonshire', 'kent', 'lancashire', 'leicestershire', 'lincolnshire', 'middlesex', 'norfolk', 'northamptonshire',
  'northumberland', 'nottinghamshire', 'oxfordshire', 'rutland', 'shropshire', 'somerset', 'staffordshire', 'suffolk',
  'surrey', 'sussex', 'east sussex', 'west sussex', 'warwickshire', 'westmorland', 'wiltshire', 'worcestershire',
  'yorkshire', 'isle of wight', 'fife', 'orkney', 'edinburgh', 'london']);
const COUNTRY_CODES = {
  switzerland: 'ch', france: 'fr', germany: 'de', italy: 'it', russia: 'ru', netherlands: 'nl', turkey: 'tr',
  spain: 'es', chile: 'cl', 'south africa': 'za', denmark: 'dk', austria: 'at', 'haute-savoie': 'fr', navarre: 'es',
};
// Continents and oceans in the context say nothing a search can use ("Rhine River, Europe").
const VAGUE = new Set(['europe', 'arctic', 'asia', 'africa', 'south america', 'central asia', 'continent']);

// The query: the place's name without parenthetical asides or vague context, inside its country.
function queryFor(p) {
  const name = p.name.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  const [head, ...context] = name.split(',').map((x) => x.trim());
  const codes = new Set();
  const keep = [];
  for (const c of context) {
    const parts = c.toLowerCase().split('/').map((x) => x.trim());
    for (const part of parts) {
      if (BRITISH.has(part)) { codes.add('gb'); codes.add('ie'); }
      else if (COUNTRY_CODES[part]) codes.add(COUNTRY_CODES[part]);
    }
    if (parts.length === 1 && !VAGUE.has(parts[0])) keep.push(c); // "France/Italy" is left to countrycodes
  }
  const q = [head, ...keep].join(', ');
  return { q, head, ...(codes.size ? { countrycodes: [...codes].join(',') } : {}) };
}

// Which kinds of OpenStreetMap feature can stand for each type of place. A "building" can be
// almost anything except a road or an area; a "town" must be a place or an administrative area.
const COMPAT = {
  town: ['place', 'boundary'],
  district: ['place', 'boundary', 'landuse'],
  region: ['boundary', 'place', 'natural'],
  country: ['boundary', 'place'],
  street: ['highway', 'place', 'landuse'],
  water: ['waterway', 'natural', 'water', 'place'],
  island: ['place', 'natural', 'boundary'],
  mountain_or_glacier: ['natural'], // a peak, a glacier, a range: not the village named after it
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
// for areas, take the most prominent (Nominatim's "importance"), otherwise the first. A town is
// preferred to the province or district named after it (Arkhangelsk, not Arkhangelsk Oblast).
const SETTLEMENT = new Set(['city', 'town', 'village', 'hamlet', 'suburb', 'municipality', 'quarter', 'neighbourhood']);
function choose(p, results) {
  const ok = results
    .map((r) => ({ r, ...judge(p, r) }))
    .filter((x) => x.confidence !== 'low' && compatible(p.type, x.r))
    .filter((x) => !['region', 'country'].includes(p.type) || (x.r.importance ?? 0) >= 0.25)
    // A region, sea, or mountain is never a settlement (North Pole, Arctic is not North Pole, Alaska).
    .filter((x) => !['region', 'country', 'water', 'mountain_or_glacier', 'island'].includes(p.type) || !SETTLEMENT.has(x.r.addresstype));
  if (!ok.length) return null;
  if (['town', 'region', 'country', 'district', 'island', 'mountain_or_glacier', 'water'].includes(p.type)) ok.sort((a, b) => (b.r.importance ?? 0) - (a.r.importance ?? 0));
  if (p.type === 'town') ok.sort((a, b) => SETTLEMENT.has(b.r.addresstype) - SETTLEMENT.has(a.r.addresstype));
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
    const { head, ...query } = queryFor(p);
    let { results, cached } = await nominatim(query);
    if (!cached) sent++;
    let pick = results.length ? choose(p, results) : null;
    // No acceptable match with the context ("Mont Blanc, Chamonix"): try the bare name, still inside
    // its country if it has one, or anywhere for a mountain, river, sea, or island.
    if (!pick && query.q !== head && (query.countrycodes || ['mountain_or_glacier', 'water', 'island'].includes(p.type))) {
      const retry = await nominatim({ ...query, q: head });
      if (!retry.cached) sent++;
      const pick2 = retry.results.length ? choose(p, retry.results) : null;
      if (pick2 || !results.length) { results = retry.results; pick = pick2; }
    }
    if (++n % 100 === 0) console.log(`  ${n} looked up (${sent} sent to Nominatim)`);
    if (!results.length) { out.push({ ...base, geo_source: 'unresolved (no gazetteer result)' }); continue; }
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
