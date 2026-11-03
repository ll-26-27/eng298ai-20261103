// Step 4 (deterministic code): build the page.
// Reads 03-rows.json and 04-template.html; writes ../outputs/index.html with the data embedded inline,
// so the page opens by double-click (a page opened from the file system can't fetch a data file).
// No model is called.
//   node 01-use-cases/maps/03-talking-machines-map/operations/04-build.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(await readFile(join(HERE, '03-rows.json'), 'utf8'));
const template = await readFile(join(HERE, '04-template.html'), 'utf8');

const keep = ['id', 'layer', 'year', 'date_display', 'precision', 'title', 'who', 'description', 'why_it_matters', 'quote', 'quote_attribution', 'copyright',
  'source_url', 'status', 'check_note', 'origin', 'speaks', 'speaks_note', 'place_label', 'city', 'place_kind', 'certainty', 'place_note', 'place_sources',
  'opened', 'affiliation_line', 'all_affiliations', 'lat', 'lon', 'geocoder', 'geo_match', 'geo_link', 'geo_confidence', 'geo_note', 'mapped', 'arxiv'];
const rows = data.rows.map((r) => Object.fromEntries(keep.filter((k) => r[k] !== undefined && r[k] !== '').map((k) => [k, r[k]])));
const payload = { built: new Date().toISOString().slice(0, 10), geocoded_on: data.geocoded_on, counts: data.counts, rows };
const json = JSON.stringify(payload).replace(/</g, '\\u003c');
if (!template.includes('/*__DATA__*/null')) throw new Error('template is missing the /*__DATA__*/null placeholder');
await mkdir(join(HERE, '..', 'outputs'), { recursive: true });
await writeFile(join(HERE, '..', 'outputs', 'index.html'), template.replace('/*__DATA__*/null', () => json));
const by = rows.reduce((t, r) => ((t[r.layer] = (t[r.layer] || 0) + 1), t), {});
console.log(`outputs/index.html: ${rows.length} rows`, by, `${rows.filter((r) => r.mapped).length} on the map`);
