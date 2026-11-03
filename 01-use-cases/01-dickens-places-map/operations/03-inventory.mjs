// Step 3 (deterministic): turn the model's raw extractions into an inventory.
//  - checks every quotation against the chunk it came from (did the model copy it exactly?)
//  - merges spelling variants of the same place under one key
//  - counts mentions per place, per novel, and per chapter
// Run from the repo root:
//   node 01-use-cases/01-dickens-places-map/operations/03-inventory.mjs
// Reads  data/02-places-raw.jsonl and data/chunks/*.jsonl
// Writes 03-places-inventory.csv (one row per place) and data/03-mentions.jsonl (one row per mention)

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOVELS } from './00-fetch-texts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, 'data');

// Normalize text for quotation matching: curly quotes, dashes, whitespace, case.
const flat = (s) => s
  .replace(/[‘’‛′]/g, "'")
  .replace(/[“”‟″]/g, '"')
  .replace(/[–—]/g, '-')
  .replace(/\s+/g, ' ')
  .toLowerCase()
  .trim();

// The merge key for a place: what counts as "the same place". We keep only the part before the
// first comma, so "Cook's Court", "Cook's Court, Cursitor Street", and "Cooks Court, Chancery Lane"
// become one place. The cost: two different places with the same name merge too (the Custom House
// in London and the one in Plymouth). Check the variants column of the inventory.
export function placeKey(normalized) {
  return normalized
    .replace(/\(.*?\)/g, '')
    .split(',')[0]
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’']/g, '')
    .replace(/\bsaint\b/g, 'st').replace(/\bst\./g, 'st')
    .replace(/^the /, '')
    .replace(/\(.*?\)/g, '')
    .replace(/,\s*(london|england|uk|united kingdom)\b/g, '')
    .replace(/[^a-z0-9, ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[ ,]+$/, '')
    .trim();
}

const mode = (arr) => {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
};

export const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function main() {
  const chunkText = new Map();
  for (const f of (await readdir(join(DATA, 'chunks'))).filter((f) => f.endsWith('.jsonl'))) {
    for (const line of (await readFile(join(DATA, 'chunks', f), 'utf8')).split('\n').filter(Boolean)) {
      const c = JSON.parse(line);
      chunkText.set(c.id, flat(c.text));
    }
  }

  const raw = (await readFile(join(DATA, '02-places-raw.jsonl'), 'utf8')).split('\n').filter(Boolean).map(JSON.parse);
  const mentions = [];
  let verified = 0;
  const seen = new Set(); // count each place once per chunk, as the prompt asks
  for (const r of raw) {
    const key = placeKey(r.normalized);
    if (!key || seen.has(`${key}|${r.chunk}`)) continue;
    seen.add(`${key}|${r.chunk}`);
    const ok = chunkText.get(r.chunk)?.includes(flat(r.quote).replace(/^["']|["']$/g, '')) ?? false;
    if (ok) verified++;
    mentions.push({ place_id: key, ...r, quote_verified: ok });
  }

  const places = new Map();
  for (const m of mentions) {
    if (!places.has(m.place_id)) places.set(m.place_id, []);
    places.get(m.place_id).push(m);
  }

  const slugs = NOVELS.map((n) => n.slug);
  const rows = [];
  for (const [id, ms] of places) {
    const perNovel = Object.fromEntries(slugs.map((s) => [s, 0]));
    for (const m of ms) perNovel[m.novel]++;
    const lon = ms.map((m) => m.in_london).filter((x) => x !== null);
    rows.push({
      place_id: id,
      name: mode(ms.map((m) => m.normalized)),
      type: mode(ms.map((m) => m.type)),
      in_london: lon.length ? lon.filter(Boolean).length >= lon.length / 2 : '',
      mentions: ms.length,
      setting_mentions: ms.filter((m) => m.role === 'setting').length,
      novels: slugs.filter((s) => perNovel[s]).length,
      ...perNovel,
      chapters: new Set(ms.map((m) => `${m.novel}:${m.chapter_seq}`)).size,
      unverified_quotes: ms.filter((m) => !m.quote_verified).length,
      variants: [...new Set(ms.map((m) => m.as_written))].join(' | '),
      notes: [...new Set(ms.map((m) => m.note).filter(Boolean))].slice(0, 3).join(' | '),
    });
  }
  rows.sort((a, b) => b.mentions - a.mentions || a.place_id.localeCompare(b.place_id));

  const cols = Object.keys(rows[0]);
  await writeFile(join(HERE, '03-places-inventory.csv'), [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n');
  await writeFile(join(DATA, '03-mentions.jsonl'), mentions.map((m) => JSON.stringify(m)).join('\n') + '\n');

  console.log(`${raw.length} raw mentions → ${mentions.length} after merging repeats within a passage → ${places.size} distinct places`);
  console.log(`quotations found verbatim in their chunk: ${verified}/${mentions.length} (${((100 * verified) / mentions.length).toFixed(1)}%)`);
  console.log('top 15:', rows.slice(0, 15).map((r) => `${r.name} (${r.mentions})`).join('; '));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
