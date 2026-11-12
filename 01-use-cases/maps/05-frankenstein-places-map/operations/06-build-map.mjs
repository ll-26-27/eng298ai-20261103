// Step 6 (deterministic): pour the data into the map template and write outputs/index.html.
// The data is embedded in the page, so it opens by double-clicking (browsers refuse to fetch()
// local files from a page opened with file://).
// Run from the repo root:
//   node 01-use-cases/maps/05-frankenstein-places-map/operations/06-build-map.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOVELS, NARRATORS } from './00-fetch-texts.mjs';
import { parseCSV } from './04-geocode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'outputs');
const EDITION_COLORS = ['#7b4f9d', '#e08a1e'];
const NARRATOR_COLORS = { preface: '#8a857a', walton: '#4e79a7', victor: '#c0392b', creature: '#59a14f' };
// Leaflet's Web Mercator stops at about 85° north; the North Pole is drawn at the top edge.
const MAX_LAT = 84.5;

async function main() {
  const rows = parseCSV(await readFile(join(HERE, '04-places-geocoded.csv'), 'utf8'));
  const mentions = (await readFile(join(HERE, 'data', '03-mentions.jsonl'), 'utf8')).split('\n').filter(Boolean).map(JSON.parse);
  const cost = await readFile(join(HERE, 'cost-log.csv'), 'utf8').catch(() => '');
  // From step 3c: for a place in one edition only, is its name missing from the other text?
  const editionCheck = new Map(parseCSV(await readFile(join(HERE, 'data', '03c-edition-only.csv'), 'utf8').catch(() => 'place_id\n'))
    .map((r) => [r.place_id, r.verdict.startsWith('text') ? 't' : 'm']));

  const present = new Set(mentions.map((m) => m.novel));
  const novels = NOVELS.filter((n) => present.has(n.slug));
  const idx = Object.fromEntries(novels.map((n, i) => [n.slug, i]));
  const nIdx = Object.fromEntries(NARRATORS.map((n, i) => [n.slug, i]));
  const NN = NARRATORS.length;

  const byPlace = new Map();
  for (const m of mentions) {
    if (!byPlace.has(m.place_id)) byPlace.set(m.place_id, []);
    byPlace.get(m.place_id).push(m);
  }

  const places = [], unmapped = [], outMentions = {};
  for (const r of rows) {
    const ms = (byPlace.get(r.place_id) || []).sort((a, b) => idx[a.novel] - idx[b.novel] || a.chapter_seq - b.chapter_seq);
    // Counts per (edition, narrator) pair, flattened: index edition * NN + narrator.
    const k = new Array(novels.length * NN).fill(0), s = [...k];
    for (const m of ms) {
      const i = idx[m.novel] * NN + nIdx[m.narrator];
      k[i]++;
      if (m.role === 'setting') s[i]++;
    }
    if (r.lat && r.lon) {
      let lat = Number(r.lat), drawn = '';
      if (lat > MAX_LAT) { drawn = `drawn at ${MAX_LAT}°N; the place is at ${lat}°N, beyond the map's projection`; lat = MAX_LAT; }
      places.push({
        id: r.place_id, n: r.name, t: r.type, lat, lon: Number(r.lon), drawn,
        src: r.geo_source.startsWith('gazetteer') ? 'g' : 'm', c: r.geo_confidence, match: r.geo_match, osm: r.osm,
        note: r.model_note || '', v: r.variants, k, s, ed: editionCheck.get(r.place_id) || '',
      });
      outMentions[r.place_id] = ms.map((m) => [idx[m.novel], m.chapter_label, m.role === 'setting' ? 's' : 'm', m.quote, m.quote_verified ? 1 : 0, nIdx[m.narrator]]);
    } else {
      unmapped.push({ n: r.name, t: r.type, m: Number(r.mentions), k, ed: editionCheck.get(r.place_id) || '', why: r.model_note ? `model: ${r.model_note}` : r.geo_source });
    }
  }

  const costTotal = cost.split('\n').slice(1).filter(Boolean).reduce((a, l) => a + Number(l.split(',')[7] || 0), 0);
  const about = `Built ${new Date().toISOString().slice(0, 10)} for ENGLISH 298AI, after the <a href="../../01-dickens-places-map/outputs/index.html">Dickens map</a>. Texts from Project Gutenberg (#41445, the 1818 text; #84, the 1831 text; public domain in the US). Places extracted from ${mentions.length.toLocaleString()} mentions by <code>anthropic/claude-haiku-5.5</code> reading each text in chunks of about 1,000 words; narrators assigned by chapter (letters and "Walton, in continuation" to Walton, the Creature's tale to the Creature, the rest to Victor). Coordinates from OpenStreetMap's Nominatim gazetteer, with estimates by <code>anthropic/claude-sonnet-5.5</code> (dashed) for places it could not find. Model calls cost about $${costTotal.toFixed(2)} in all. Map data &copy; OpenStreetMap contributors.`;

  const data = {
    novels: novels.map((n) => ({ slug: n.slug, title: n.title, year: n.year, ebook: n.ebook, color: EDITION_COLORS[NOVELS.indexOf(n) % EDITION_COLORS.length] })),
    narrators: NARRATORS.map((n) => ({ ...n, color: NARRATOR_COLORS[n.slug] })),
    places, unmapped, mentions: outMentions,
    meta: { geocodeModel: 'anthropic/claude-sonnet-5.5', about },
  };
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const tpl = await readFile(join(HERE, '06-map-template.html'), 'utf8');
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'index.html'), tpl.replace('/*__DATA__*/null', () => json));
  console.log(`outputs/index.html: ${novels.length} texts, ${places.length} mapped places, ${unmapped.length} unmapped, ${(json.length / 1e6).toFixed(2)} MB of data`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
