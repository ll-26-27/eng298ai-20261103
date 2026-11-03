// Step 3b (deterministic audit): how much did the model miss?
// A crude pattern finds capitalized names ending in a place word ("Cursitor Street", "Golden
// Square", "Blackfriars Bridge", "Lincoln's Inn") in every chunk, then checks whether the model
// listed each one for that chunk. The pattern misses most places (towns, districts, single words),
// so this measures recall only for this easy, checkable kind of name. It is a spot check, not a score.
// Run from the repo root:
//   node mk-projects/01-dickens-places-map/operations/03b-recall-check.mjs
// Writes data/03b-recall-misses.csv: names the pattern found that the model did not list.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvCell } from './03-inventory.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, 'data');
const PLACE_WORDS = 'Street|Square|Lane|Court|Bridge|Hill|Road|Row|Place|Inn|Yard|Gardens|Fields|Market|Abbey|Cathedral|Terrace|Alley|Buildings|Wharf|Stairs|Gate|Common|Heath';
const RE = new RegExp(`\\b((?:[A-Z][a-z’']+\\s){1,3}(?:${PLACE_WORDS}))\\b`, 'g');
const SKIP = /^(The|A|An|In|At|Of|To|And|But|Mr|Mrs|Miss|Sir|Lady|My|Our|His|Her|This|That|When|Then|Old|Young|Little|Great)\s/;
const flat = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ');

async function main() {
  const listed = new Map();
  for (const r of (await readFile(join(DATA, '02-places-raw.jsonl'), 'utf8')).split('\n').filter(Boolean).map(JSON.parse)) {
    if (!listed.has(r.chunk)) listed.set(r.chunk, []);
    listed.get(r.chunk).push(flat(`${r.as_written} | ${r.normalized}`));
  }
  let found = 0, hit = 0;
  const misses = [];
  for (const f of (await readdir(join(DATA, 'chunks'))).filter((f) => f.endsWith('.jsonl'))) {
    for (const line of (await readFile(join(DATA, 'chunks', f), 'utf8')).split('\n').filter(Boolean)) {
      const c = JSON.parse(line);
      const names = new Set();
      for (const m of c.text.matchAll(RE)) {
        let name = m[1].replace(/\s+/g, ' ');
        while (SKIP.test(name)) name = name.replace(SKIP, '');
        if (name.split(' ').length >= 2) names.add(name);
      }
      const have = listed.get(c.id) || [];
      for (const name of names) {
        found++;
        if (have.some((h) => h.includes(flat(name)))) hit++;
        else misses.push({ novel: c.novel, chapter: c.chapter_label, chunk: c.id, name });
      }
    }
  }
  const cols = ['novel', 'chapter', 'chunk', 'name'];
  await writeFile(join(DATA, '03b-recall-misses.csv'), [cols.join(','), ...misses.map((m) => cols.map((k) => csvCell(m[k])).join(','))].join('\n') + '\n');
  console.log(`pattern-matched names: ${found}; listed by the model: ${hit} (${((100 * hit) / found).toFixed(1)}%)`);
  console.log(`not listed (some are false alarms, e.g. people called "Hill", "Common Pleas"): ${misses.length}, written to data/03b-recall-misses.csv`);
  const tally = new Map();
  for (const m of misses) tally.set(m.name, (tally.get(m.name) || 0) + 1);
  console.log('most frequent misses:', [...tally].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([n, k]) => `${n} (${k})`).join('; '));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
