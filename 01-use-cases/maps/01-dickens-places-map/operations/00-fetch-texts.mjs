// Step 0 (deterministic): download the Dickens novels from Project Gutenberg, unchanged.
// Run from the repo root:
//   node 01-use-cases/maps/01-dickens-places-map/operations/00-fetch-texts.mjs
// Files already on disk are skipped, so rerunning is free and polite.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const INPUTS = join(HERE, '..', 'inputs');

// slug, Gutenberg ebook number, title, year of first book publication
export const NOVELS = [
  { slug: 'oliver-twist', ebook: 730, title: 'Oliver Twist', year: 1838 },
  { slug: 'a-christmas-carol', ebook: 46, title: 'A Christmas Carol', year: 1843 },
  { slug: 'dombey-and-son', ebook: 821, title: 'Dombey and Son', year: 1848 },
  { slug: 'david-copperfield', ebook: 766, title: 'David Copperfield', year: 1850 },
  { slug: 'bleak-house', ebook: 1023, title: 'Bleak House', year: 1853 },
  { slug: 'little-dorrit', ebook: 963, title: 'Little Dorrit', year: 1857 },
  { slug: 'great-expectations', ebook: 1400, title: 'Great Expectations', year: 1861 },
  { slug: 'our-mutual-friend', ebook: 883, title: 'Our Mutual Friend', year: 1865 },
];

export const gutenbergUrl = (n) => `https://www.gutenberg.org/cache/epub/${n}/pg${n}.txt`;

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function main() {
  await mkdir(INPUTS, { recursive: true });
  for (const n of NOVELS) {
    const out = join(INPUTS, `pg${n.ebook}-${n.slug}.txt`);
    if (await exists(out)) { console.log(`have  ${out}`); continue; }
    const res = await fetch(gutenbergUrl(n.ebook), {
      headers: { 'User-Agent': 'ENGLISH-298AI-class-example (Dickens places map; educational use)' },
    });
    if (!res.ok) throw new Error(`${n.title}: HTTP ${res.status}`);
    const text = await res.text();
    await writeFile(out, text);
    console.log(`saved ${out} (${text.length.toLocaleString()} chars)`);
    await new Promise((r) => setTimeout(r, 2000)); // be gentle with Gutenberg
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
