// Step 6 (deterministic): pour the data into the map template and write outputs/index.html.
// The data is embedded in the page, so it opens by double-clicking (browsers refuse to fetch()
// local files from a page opened with file://).
// Run from the repo root:
//   node 01-use-cases/01-dickens-places-map/operations/06-build-map.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOVELS } from './00-fetch-texts.mjs';
import { parseCSV } from './04-geocode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'outputs');
const COLORS = ['#4e79a7', '#c0392b', '#59a14f', '#e08a1e', '#7b4f9d', '#17899a', '#9c755f', '#d4558f'];

async function main() {
  const rows = parseCSV(await readFile(join(HERE, '04-places-geocoded.csv'), 'utf8'));
  const mentions = (await readFile(join(HERE, 'data', '03-mentions.jsonl'), 'utf8')).split('\n').filter(Boolean).map(JSON.parse);
  const cost = await readFile(join(HERE, 'cost-log.csv'), 'utf8').catch(() => '');

  const present = new Set(mentions.map((m) => m.novel));
  const novels = NOVELS.filter((n) => present.has(n.slug));
  const idx = Object.fromEntries(novels.map((n, i) => [n.slug, i]));

  const byPlace = new Map();
  for (const m of mentions) {
    if (!byPlace.has(m.place_id)) byPlace.set(m.place_id, []);
    byPlace.get(m.place_id).push(m);
  }

  const places = [], unmapped = [], outMentions = {};
  for (const r of rows) {
    const ms = (byPlace.get(r.place_id) || []).sort((a, b) => idx[a.novel] - idx[b.novel] || a.chapter_seq - b.chapter_seq);
    const k = novels.map((n) => ms.filter((m) => m.novel === n.slug).length);
    const s = novels.map((n) => ms.filter((m) => m.novel === n.slug && m.role === 'setting').length);
    if (r.lat && r.lon) {
      places.push({
        id: r.place_id, n: r.name, t: r.type, lat: Number(r.lat), lon: Number(r.lon), L: r.in_london === 'true',
        src: r.geo_source.startsWith('gazetteer') ? 'g' : 'm', c: r.geo_confidence, match: r.geo_match, osm: r.osm,
        note: r.model_note || '', v: r.variants, k, s,
      });
      outMentions[r.place_id] = ms.map((m) => [idx[m.novel], m.chapter_label, m.role === 'setting' ? 's' : 'm', m.quote, m.quote_verified ? 1 : 0]);
    } else {
      unmapped.push({ n: r.name, t: r.type, m: Number(r.mentions), k, why: r.model_note ? `model: ${r.model_note}` : r.geo_source });
    }
  }

  const costTotal = cost.split('\n').slice(1).filter(Boolean).reduce((a, l) => a + Number(l.split(',')[7] || 0), 0);
  const about = `Built ${new Date().toISOString().slice(0, 10)} for ENGLISH 298AI. Texts from Project Gutenberg (public domain in the US). Places extracted from ${mentions.length.toLocaleString()} mentions by <code>anthropic/claude-haiku-5.5</code> reading each novel in chunks of about 2,000 words; coordinates from OpenStreetMap's Nominatim gazetteer, with model estimates (dashed) for some places it could not find. Every step is model judgment or a lookup, and both make mistakes: a historical London name can be matched to a modern namesake. Model calls cost about $${costTotal.toFixed(2)} in all. Map data &copy; OpenStreetMap contributors.`;

  const data = {
    novels: novels.map((n, i) => ({ slug: n.slug, title: n.title, year: n.year, ebook: n.ebook, color: COLORS[NOVELS.indexOf(n) % COLORS.length] })),
    places, unmapped, mentions: outMentions,
    meta: { geocodeModel: 'anthropic/claude-sonnet-5.5', about },
  };
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const tpl = await readFile(join(HERE, '06-map-template.html'), 'utf8');
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'index.html'), tpl.replace('/*__DATA__*/null', () => json));
  console.log(`outputs/index.html: ${novels.length} novels, ${places.length} mapped places, ${unmapped.length} unmapped, ${(json.length / 1e6).toFixed(2)} MB of data`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
