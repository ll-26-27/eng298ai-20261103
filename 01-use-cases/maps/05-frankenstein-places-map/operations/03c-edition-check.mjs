// Step 3c (deterministic audit): is a place named in only one edition because Shelley revised the
// text, or because the model listed it in one edition and missed it in the other? For each place
// the model found in only one text, search the other text for the words the model quoted as its
// name ("Villa Lavenza", "Holyhead"). If they are there, the difference is the model's, not Shelley's.
// Run from the repo root:
//   node 01-use-cases/maps/05-frankenstein-places-map/operations/03c-edition-check.mjs
// Writes data/03c-edition-only.csv, which step 6 uses to mark the "Between the editions" list.

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOVELS } from './00-fetch-texts.mjs';
import { csvCell } from './03-inventory.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, 'data');
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function main() {
  const text = {};
  for (const n of NOVELS) {
    text[n.slug] = (await readFile(join(DATA, 'chunks', `${n.slug}.jsonl`), 'utf8')).split('\n').filter(Boolean).map((l) => JSON.parse(l).text).join('\n\n');
  }
  const byPlace = new Map();
  for (const m of (await readFile(join(DATA, '03-mentions.jsonl'), 'utf8')).split('\n').filter(Boolean).map(JSON.parse)) {
    if (!byPlace.has(m.place_id)) byPlace.set(m.place_id, []);
    byPlace.get(m.place_id).push(m);
  }
  const rows = [];
  for (const [id, ms] of byPlace) {
    const eds = new Set(ms.map((m) => m.novel));
    if (eds.size !== 1) continue;
    const [ed] = eds;
    const names = [...new Set(ms.map((m) => m.as_written.replace(/^the\s+/i, '')))];
    for (const other of NOVELS.filter((n) => n.slug !== ed)) {
      const found = names.filter((n) => new RegExp(`(?<!\\p{L})${escRe(n)}(?!\\p{L})`, 'u').test(text[other.slug]));
      rows.push({
        place_id: id, only_in: ed, other: other.slug, as_written: names.join(' | '),
        verdict: found.length ? 'model difference (the name is in both texts)' : 'text difference (the name is not in the other text)',
        found_in_other: found.join(' | '),
      });
    }
  }
  rows.sort((a, b) => a.only_in.localeCompare(b.only_in) || a.verdict.localeCompare(b.verdict) || a.place_id.localeCompare(b.place_id));
  const cols = ['place_id', 'only_in', 'other', 'as_written', 'verdict', 'found_in_other'];
  await writeFile(join(DATA, '03c-edition-only.csv'), [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n');
  const text_ = rows.filter((r) => r.verdict.startsWith('text'));
  console.log(`places found in one edition only: ${rows.length}; the name is absent from the other text for ${text_.length}, present for ${rows.length - text_.length}`);
  for (const n of NOVELS) console.log(`  only in ${n.title}, text difference: ${text_.filter((r) => r.only_in === n.slug).map((r) => r.as_written).join('; ')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
