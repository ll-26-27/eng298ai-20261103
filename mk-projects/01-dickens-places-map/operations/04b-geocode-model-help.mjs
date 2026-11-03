// Step 4b (model judgment, clearly labelled): for places the gazetteer could not resolve, ask a
// stronger model where they were in the nineteenth century. Its answers go into
// 04-places-geocoded.csv with geo_source "model estimate", never "gazetteer", and the map draws
// them differently. Low-confidence answers are recorded but not mapped. Treat every one as a lead
// to check, not a fact.
//
// Run from the repo root (after step 4):
//   node --env-file=.env mk-projects/01-dickens-places-map/operations/04b-geocode-model-help.mjs [--min N]
// --min N: only places mentioned at least N times (default 2), to keep the bill small.
// Answers are cached in data/cache/geocode-model/ and also gathered in data/04b-model-geocodes.jsonl.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { chatJSON, logCost, pool } from './openrouter.mjs';
import { parseCSV, writeCSV } from './04-geocode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, 'data');
const CACHE = join(DATA, 'cache', 'geocode-model');
const MODEL = process.env.GEOCODE_MODEL || 'anthropic/claude-sonnet-5.5';
const BATCH = 25;

const PROMPT = `You are a historical geographer helping a literary scholar map the places in Charles Dickens's novels. A gazetteer (OpenStreetMap's Nominatim) could not confidently locate the places below. For each one, say where it was in Dickens's time (roughly 1830-1870), if you know.

For each place, return:
- place_id: copied exactly from the input.
- lat, lon: decimal degrees (WGS84) of the place as it was then, or null if you do not know or it is not a real locatable place.
- confidence: "high" if you know this place's location well (a well-documented building, street, or town), "medium" if you know the area but not the exact spot, "low" if it is an educated guess, "none" if you cannot locate it or it is fictional, generic, or not a place.
- now: one short phrase: what is at that spot now, or what the place is called today (for example "demolished; site is near Borough High Street").
- reason: one short sentence of evidence or reasoning. Say so if the place is fictional, a composite, or uncertain.

The gazetteer's rejected best match is included as "gazetteer_guess" when there was one. It may be right (old names often survive on modern buildings) or wrong. Do not invent precision: a district-level guess should be marked medium or low.`;

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['places'],
  properties: {
    places: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['place_id', 'lat', 'lon', 'confidence', 'now', 'reason'],
        properties: {
          place_id: { type: 'string' },
          lat: { type: ['number', 'null'] },
          lon: { type: ['number', 'null'] },
          confidence: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
          now: { type: 'string' },
          reason: { type: 'string' },
        },
      },
    },
  },
};

async function main() {
  await mkdir(CACHE, { recursive: true });
  const minIdx = process.argv.indexOf('--min');
  const min = minIdx > 0 ? Number(process.argv[minIdx + 1]) : 2;
  const rows = parseCSV(await readFile(join(HERE, '04-places-geocoded.csv'), 'utf8'));
  const mentions = (await readFile(join(DATA, '03-mentions.jsonl'), 'utf8')).split('\n').filter(Boolean).map(JSON.parse);
  const quoteFor = new Map();
  for (const m of mentions) if (!quoteFor.has(m.place_id) && m.quote_verified) quoteFor.set(m.place_id, `${m.title}: "${m.quote}"`);

  const todo = rows.filter((r) => r.geo_source.startsWith('unresolved') && Number(r.mentions) >= min);
  console.log(`${todo.length} unresolved places with at least ${min} mentions; model ${MODEL}`);
  const batches = [];
  for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));

  let requests = 0, cached = 0, pt = 0, ct = 0, cost = 0;
  const answers = new Map();
  await pool(batches, 4, async (batch) => {
    const input = batch.map((r) => ({
      place_id: r.place_id, name: r.name, type: r.type, in_london: r.in_london, as_written: r.variants,
      example: quoteFor.get(r.place_id) || '', gazetteer_guess: r.geo_match || null,
    }));
    const user = JSON.stringify(input, null, 1);
    const file = join(CACHE, createHash('sha1').update(MODEL + PROMPT + user).digest('hex') + '.json');
    let ans;
    try { ans = JSON.parse(await readFile(file, 'utf8')); cached++; }
    catch {
      const r = await chatJSON({ model: MODEL, system: PROMPT, user, schemaName: 'geocodes', schema: SCHEMA, maxTokens: 8000 });
      requests++; pt += r.usage.prompt_tokens || 0; ct += r.usage.completion_tokens || 0; cost += r.usage.cost || 0;
      ans = { model: r.model, places: r.parsed.places };
      await writeFile(file, JSON.stringify(ans, null, 1));
    }
    for (const a of ans.places) answers.set(a.place_id, { ...a, model: ans.model });
  });
  if (requests) await logCost({ step: '04b-geocode-model-help', model: MODEL, requests, cached, prompt_tokens: pt, completion_tokens: ct, cost_usd: cost, note: `min ${min}` });

  let placed = 0;
  for (const r of rows) {
    const a = answers.get(r.place_id);
    if (!a) continue;
    r.model_note = `${a.confidence}: ${a.now}. ${a.reason}`;
    // Only high- and medium-confidence estimates go on the map; low ones stay in the CSV's model_note.
    if (a.lat !== null && a.lon !== null && (a.confidence === 'high' || a.confidence === 'medium')) {
      r.lat = a.lat.toFixed(5); r.lon = a.lon.toFixed(5);
      r.geo_source = `model estimate (${MODEL})`;
      r.geo_confidence = a.confidence;
      placed++;
    }
  }
  for (const r of rows) r.model_note ??= '';
  await writeFile(join(HERE, '04-places-geocoded.csv'), writeCSV(rows));
  await writeFile(join(DATA, '04b-model-geocodes.jsonl'), [...answers.values()].map((a) => JSON.stringify(a)).join('\n') + '\n');
  console.log(`requests ${requests}, cached ${cached}, cost $${cost.toFixed(4)}; model placed ${placed} of ${todo.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
