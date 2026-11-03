// Step 3 (deterministic lookup): coordinates for each place named in step 2.
// Reads 01-candidates.json, 02-places.json, 02a-affiliations.json. Merges them into one row per
// candidate, then looks each distinct `geocode_query` up in a gazetteer. Writes 03-geocoded.csv
// (one row per candidate, for reading in a spreadsheet) and 03-rows.json (the same, for step 4).
//
// Run from the repo root:
//   node 01-use-cases/maps/03-talking-machines-map/operations/03-geocode.mjs
//
// Gazetteers, in order:
//   1. OpenStreetMap's Nominatim (https://nominatim.openstreetmap.org). Its policy asks for at most one
//      request a second, an identifying User-Agent, and caching: all done here. A result is accepted
//      only if its display name contains the words of the query's first part (before the first comma);
//      otherwise the query is treated as unresolved by Nominatim.
//   2. Wikidata (https://www.wikidata.org/w/api.php), used only when Nominatim is down or rejects the
//      query: wbsearchentities finds the item for the query's first part, wbgetclaims reads its
//      coordinate (property P625). Accepted only if the item's label contains the query's words.
// Every response is cached in operations/cache/, so a rerun sends nothing for places already seen.
// The `geocoder` column says which gazetteer each coordinate came from. Nothing is ever guessed.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, 'cache');
const UA = 'ENGLISH-298AI-talking-machines-map/1.0 (class example; one-off cached geocoding of about 50 place names)';
const STOP = new Set(['the', 'of', 'and', 'a', 'in', 'at', 'on', 'de', 'du', 'la', 'le', 'des', 'university', 'college', 'campus']);
const tokens = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, '')
  .split(/[^a-z0-9]+/).filter((t) => t && !STOP.has(t));

async function cached(url, fetcher) {
  await mkdir(CACHE, { recursive: true });
  const file = join(CACHE, createHash('sha1').update(url).digest('hex') + '.json');
  try { return { data: JSON.parse(await readFile(file, 'utf8')).data, cached: true }; } catch {}
  const data = await fetcher(url);
  await writeFile(file, JSON.stringify({ url, fetched: new Date().toISOString(), data }));
  return { data, cached: false };
}

let last = 0;
async function politeFetch(url) {
  const wait = last + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// A result matches only if every word of the query's first part (the place itself) appears in the
// result's name AND most words of the rest of the query (city, state, country) do too. The second
// test is what stops "Paternoster Row, London" landing on a Paternoster Row in Essex.
function matches(query, label) {
  const parts = query.split(',');
  const head = tokens(parts[0]); const rest = tokens(parts.slice(1).join(' '));
  const got = new Set(tokens(label));
  const headScore = head.length ? head.filter((t) => got.has(t)).length / head.length : 0;
  const restScore = rest.length ? rest.filter((t) => got.has(t)).length / rest.length : 1;
  if (headScore < 1 || restScore < 0.5) return 0;
  return (headScore + restScore) / 2;
}

async function nominatim(query) {
  const qs = new URLSearchParams({ q: query, format: 'jsonv2', limit: '3', 'accept-language': 'en' });
  const url = `https://nominatim.openstreetmap.org/search?${qs}`;
  let data, cachedHit;
  try { ({ data, cached: cachedHit } = await cached(url, politeFetch)); }
  catch (e) { return { error: e.message }; }
  const ok = (data || []).map((r) => ({ r, score: matches(query, r.display_name) })).filter((x) => x.score >= 0.5)
    .sort((a, b) => b.score - a.score || (b.r.importance ?? 0) - (a.r.importance ?? 0));
  if (!ok.length) return { rejected: data?.[0]?.display_name || '(no result)', cached: cachedHit };
  const r = ok[0].r;
  return { lat: Number(r.lat), lon: Number(r.lon), geocoder: 'nominatim', match: r.display_name,
    link: r.osm_type && r.osm_id ? `https://www.openstreetmap.org/${r.osm_type}/${r.osm_id}` : '', confidence: ok[0].score === 1 ? 'high' : 'medium', cached: cachedHit };
}

async function wikidata(query) {
  const head = query.split(',')[0];
  const s = new URLSearchParams({ action: 'wbsearchentities', search: head, language: 'en', type: 'item', limit: '5', format: 'json' });
  let search;
  try { ({ data: search } = await cached(`https://www.wikidata.org/w/api.php?${s}`, politeFetch)); } catch (e) { return { error: e.message }; }
  for (const item of search?.search || []) {
    if (matches(query, item.label || '') < 0.5) continue;
    const c = new URLSearchParams({ action: 'wbgetclaims', entity: item.id, property: 'P625', format: 'json' });
    let claims;
    try { ({ data: claims } = await cached(`https://www.wikidata.org/w/api.php?${c}`, politeFetch)); } catch (e) { return { error: e.message }; }
    const v = claims?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
    if (v) return { lat: v.latitude, lon: v.longitude, geocoder: 'wikidata', match: `${item.label} (${item.id}): ${item.description || ''}`, link: `https://www.wikidata.org/wiki/${item.id}`, confidence: 'medium' };
  }
  return { rejected: search?.search?.[0]?.label || '(no result)' };
}

const csvCell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

async function main() {
  const cand = JSON.parse(await readFile(join(HERE, '01-candidates.json'), 'utf8'));
  const places = JSON.parse(await readFile(join(HERE, '02-places.json'), 'utf8'));
  const aff = JSON.parse(await readFile(join(HERE, '02a-affiliations.json'), 'utf8'));
  const byArxiv = new Map(aff.papers.map((p) => [p.arxiv, p]));

  // Merge: candidates + the place decided for each; added machines come whole from 02-places.json.
  const rows = [];
  for (const c of cand.candidates) {
    let p;
    if (c.layer === 'trained') {
      const a = byArxiv.get(c.arxiv);
      if (!a) { rows.push({ ...c, status_place: 'no affiliation row' }); continue; }
      p = { place_label: a.place_label, geocode_query: a.geocode_query, city: a.city, place_kind: 'affiliation', certainty: a.certainty,
        place_note: a.place_note, place_sources: a.place_sources, opened: `Paper header: ${a.affiliation_line}`, speaks: 'n/a',
        speaks_note: 'A paper, not a being.', affiliation_line: a.affiliation_line, all_affiliations: a.all_affiliations };
    } else {
      p = places.rows[c.id];
      if (!p) { rows.push({ ...c, status_place: 'no place researched' }); continue; }
    }
    rows.push({ ...c, ...p });
  }
  for (const a of places.added) rows.push({ ...a, origin: 'added', status: 'added in step 2', why_it_matters: '' });

  // Geocode each distinct query once.
  const queries = [...new Set(rows.filter((r) => r.geocode_query).map((r) => r.geocode_query))];
  const coords = new Map();
  let sent = 0, viaWikidata = 0, unresolved = 0;
  for (const q of queries) {
    let g = await nominatim(q);
    if (!g.cached) sent++;
    if (g.error || g.rejected) {
      const w = await wikidata(q);
      if (w.lat != null) { g = { ...w, nominatim_note: g.error ? `Nominatim ${g.error}` : `Nominatim rejected: ${g.rejected}` }; viaWikidata++; }
      else { g = { unresolved: true, nominatim_note: g.error || `rejected: ${g.rejected}`, wikidata_note: w.error || `rejected: ${w.rejected}` }; unresolved++; }
    }
    coords.set(q, g);
    process.stdout.write(`  ${q} → ${g.lat != null ? `${g.lat.toFixed(4)}, ${g.lon.toFixed(4)} (${g.geocoder})` : 'UNRESOLVED'}\n`);
  }

  const out = rows.map((r) => {
    const g = coords.get(r.geocode_query) || {};
    return { ...r, lat: g.lat ?? '', lon: g.lon ?? '', geocoder: g.geocoder || '', geo_match: g.match || '', geo_link: g.link || '',
      geo_confidence: g.confidence || '', geo_note: [g.nominatim_note, g.wikidata_note].filter(Boolean).join('; '),
      mapped: g.lat != null && r.certainty !== 'unverified' };
  });
  out.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));

  const cols = ['id', 'layer', 'year', 'date_display', 'title', 'who', 'speaks', 'place_label', 'city', 'place_kind', 'certainty', 'geocode_query',
    'lat', 'lon', 'geocoder', 'geo_confidence', 'geo_match', 'geo_link', 'geo_note', 'place_note', 'place_sources', 'source_url', 'status', 'origin'];
  const csv = [cols.join(','), ...out.map((r) => cols.map((c) => csvCell(Array.isArray(r[c]) ? r[c].join(' | ') : r[c])).join(','))].join('\n') + '\n';
  await writeFile(join(HERE, '03-geocoded.csv'), csv);
  await writeFile(join(HERE, '03-rows.json'), JSON.stringify({ geocoded_on: new Date().toISOString().slice(0, 10), gazetteers: ['OpenStreetMap Nominatim', 'Wikidata P625 (fallback)'],
    counts: { rows: out.length, mapped: out.filter((r) => r.mapped).length, queries: queries.length, sent, viaWikidata, unresolved }, rows: out }, null, 1) + '\n');
  console.log(`${out.length} rows; ${queries.length} distinct places; ${sent} new requests; ${viaWikidata} via Wikidata; ${unresolved} unresolved; ${out.filter((r) => r.mapped).length} rows mapped`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
