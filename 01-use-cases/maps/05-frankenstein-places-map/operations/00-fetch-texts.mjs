// Step 0 (deterministic): download the two texts of Frankenstein from Project Gutenberg, unchanged.
// Run from the repo root:
//   node 01-use-cases/maps/05-frankenstein-places-map/operations/00-fetch-texts.mjs
// Files already on disk are skipped, so rerunning is free and polite.
//
// Each text also says who narrates which chapters. Frankenstein is a frame tale: Walton's letters
// to his sister enclose Victor's narrative, which encloses the Creature's. Step 1 tags every chunk
// with its narrator, so the map can show whose story each place belongs to.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const INPUTS = join(HERE, '..', 'inputs');

// The narrators, in the order the frames open. "preface" is the 1818 Preface (unsigned; written
// by Percy Bysshe Shelley), kept so that every page of the text is read.
export const NARRATORS = [
  { slug: 'preface', label: 'Preface' },
  { slug: 'walton', label: 'Walton' },
  { slug: 'victor', label: 'Victor' },
  { slug: 'creature', label: 'The Creature' },
];

// slug, Gutenberg ebook number, title, year, and where the Creature's tale sits in that text.
// Letters are Walton's; everything after "Walton, in continuation" is Walton's; the rest is Victor's.
export const NOVELS = [
  {
    slug: 'frankenstein-1818', ebook: 41445, title: 'Frankenstein (1818)', year: 1818,
    creature: (c) => c.volume === 2 && c.chapter >= 3 && c.chapter <= 8,
  },
  {
    slug: 'frankenstein-1831', ebook: 84, title: 'Frankenstein (1831)', year: 1831,
    creature: (c) => c.volume === null && c.chapter >= 11 && c.chapter <= 16,
  },
];

export const gutenbergUrl = (n) => `https://www.gutenberg.org/cache/epub/${n}/pg${n}.txt`;

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function main() {
  await mkdir(INPUTS, { recursive: true });
  for (const n of NOVELS) {
    const out = join(INPUTS, `pg${n.ebook}-${n.slug}.txt`);
    if (await exists(out)) { console.log(`have  ${out}`); continue; }
    const res = await fetch(gutenbergUrl(n.ebook), {
      headers: { 'User-Agent': 'ENGLISH-298AI-class-example (Frankenstein places map; educational use)' },
    });
    if (!res.ok) throw new Error(`${n.title}: HTTP ${res.status}`);
    const text = await res.text();
    await writeFile(out, text);
    console.log(`saved ${out} (${text.length.toLocaleString()} chars)`);
    await new Promise((r) => setTimeout(r, 2000)); // be gentle with Gutenberg
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
