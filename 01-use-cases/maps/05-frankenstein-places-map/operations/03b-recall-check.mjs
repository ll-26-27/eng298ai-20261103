// Step 3b (deterministic audit): how much did the model miss? Two spot checks, neither a score.
//
//  1. Pattern check. Crude patterns find capitalized names ending in a place word ("Orkney
//     Islands", "Tintern Abbey") or starting with one ("Lake of Geneva", "Mont Blânc", "Valley of
//     Servox") in every chunk, and check whether the model listed each one for that chunk.
//     Frankenstein has few such names, so this check is small.
//  2. Cross-passage check. Every capitalized name the model listed anywhere ("Geneva", "Archangel",
//     "Leghorn") is searched for, as a whole word, in every chunk; each chunk that contains it but
//     where the model listed no place under that name is a possible miss. This measures recall for
//     single-word names, but only for names the model found at least once somewhere.
//
// Run from the repo root:
//   node 01-use-cases/maps/05-frankenstein-places-map/operations/03b-recall-check.mjs
// Writes data/03b-recall-misses.csv: the names each check found that the model did not list.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvCell } from './03-inventory.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, 'data');
const PLACE_WORDS = 'Street|Square|Lane|Bridge|Hill|Road|Place|Inn|Gardens|Fields|Abbey|Cathedral|Castle|Mountains|Islands|Island|Sea|Ocean|Lake|Valley|Bay|Forest|Glacier';
const RE = new RegExp(`\\b((?:[A-Z][a-zà-ÿ’']+\\s){1,3}(?:${PLACE_WORDS}))\\b`, 'g');
const PREFIX_RE = /\b((?:Lake|Mont|Mount|Isle|River|Sea|Valley|Vale|Gulf|Bay|Straits|Cape) (?:of (?:the )?)?[A-Z][a-zà-ÿ’']+)/g;
const SKIP = /^(The|A|An|In|At|Of|To|And|But|Mr|Mrs|Miss|Sir|Lady|My|Our|His|Her|This|That|When|Then|Old|Young|Little|Great)\s/;
const flat = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ');
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function main() {
  const raw = (await readFile(join(DATA, '02-places-raw.jsonl'), 'utf8')).split('\n').filter(Boolean).map(JSON.parse);
  const listed = new Map();
  for (const r of raw) {
    if (!listed.has(r.chunk)) listed.set(r.chunk, []);
    listed.get(r.chunk).push(flat(`${r.as_written} | ${r.normalized}`));
  }
  // Names for the cross-passage check: what the model wrote, minus a leading "the", if capitalized.
  const known = new Set();
  for (const r of raw) {
    const n = r.as_written.replace(/^the\s+/i, '').trim();
    if (n.length >= 4 && /^\p{Lu}/u.test(n)) known.add(n);
  }
  const knownRe = [...known].map((n) => [n, new RegExp(`(?<!\\p{L})${escRe(n)}(?!\\p{L})`, 'u')]);

  const tallies = { pattern: [0, 0], cross: [0, 0] };
  const misses = [];
  for (const f of (await readdir(join(DATA, 'chunks'))).filter((f) => f.endsWith('.jsonl'))) {
    for (const line of (await readFile(join(DATA, 'chunks', f), 'utf8')).split('\n').filter(Boolean)) {
      const c = JSON.parse(line);
      const have = listed.get(c.id) || [];
      const test = (check, name) => {
        tallies[check][0]++;
        if (have.some((h) => h.includes(flat(name)))) tallies[check][1]++;
        else misses.push({ check, novel: c.novel, chapter: c.chapter_label, chunk: c.id, name });
      };
      const names = new Set();
      for (const m of [...c.text.matchAll(RE), ...c.text.matchAll(PREFIX_RE)]) {
        let name = m[1].replace(/\s+/g, ' ');
        while (SKIP.test(name)) name = name.replace(SKIP, '');
        if (name.split(' ').length >= 2) names.add(name);
      }
      for (const name of names) test('pattern', name);
      // A name inside a longer known name ("Geneva" in "Lake of Geneva") is tested on its own too.
      for (const [name, re] of knownRe) if (re.test(c.text)) test('cross', name);
    }
  }
  const cols = ['check', 'novel', 'chapter', 'chunk', 'name'];
  await writeFile(join(DATA, '03b-recall-misses.csv'), [cols.join(','), ...misses.map((m) => cols.map((k) => csvCell(m[k])).join(','))].join('\n') + '\n');
  for (const [check, [found, hit]] of Object.entries(tallies)) {
    console.log(`${check} check: ${found} names found in passages; listed by the model for that passage: ${hit} (${((100 * hit) / found).toFixed(1)}%)`);
  }
  console.log(`not listed (some are false alarms: a nationality, a person named after a place, a book title): ${misses.length}, written to data/03b-recall-misses.csv`);
  const tally = new Map();
  for (const m of misses) tally.set(m.name, (tally.get(m.name) || 0) + 1);
  console.log('most frequent misses:', [...tally].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([n, k]) => `${n} (${k})`).join('; '));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
