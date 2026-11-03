// Step 1 (deterministic): strip the Project Gutenberg header and licence, split each novel
// into chapters, and cut each chapter into chunks of about 2,000 words on paragraph breaks.
// Every chunk keeps its novel, book, chapter, and position, so every place the model finds
// later can be traced back to where it is in the text.
//
// Why chunk? Asking a model to "list every place in Bleak House" in one go is brittle and
// impossible to audit. Small chunks guarantee that every page of every novel is read.
//
// Run from the repo root:
//   node mk-projects/01-dickens-places-map/operations/01-clean-and-chunk.mjs
// Writes operations/data/chunks/<slug>.jsonl (one JSON object per line).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOVELS } from './00-fetch-texts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const INPUTS = join(HERE, '..', 'inputs');
const OUT = join(HERE, 'data', 'chunks');
const TARGET_WORDS = 2000;

const CHAPTER_RE = /^\s*(CHAPTER|Chapter|STAVE)\s+([IVXLC]+|\d+)\b\.?\s*:?\s*(.*)$/;
const BOOK_RE = /^BOOK THE (FIRST|SECOND|THIRD|FOURTH)\b/;
const BOOK_NUM = { FIRST: 1, SECOND: 2, THIRD: 3, FOURTH: 4 };

function romanToInt(s) {
  if (/^\d+$/.test(s)) return Number(s);
  const v = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const a = v[s[i]], b = v[s[i + 1]] || 0;
    n += a < b ? -a : a;
  }
  return n;
}

function stripGutenberg(text) {
  const start = text.search(/^\*\*\* START OF THE PROJECT GUTENBERG EBOOK.*$/m);
  const end = text.search(/^\*\*\* END OF THE PROJECT GUTENBERG EBOOK.*$/m);
  if (start < 0 || end < 0) throw new Error('Gutenberg markers not found');
  return text.slice(text.indexOf('\n', start) + 1, end);
}

const words = (s) => (s.match(/\S+/g) || []).length;

export function chapterLabel(c) {
  return c.book ? `Book ${c.book}, Chapter ${c.chapter}` : `Chapter ${c.chapter}`;
}

async function chunkNovel(novel) {
  const raw = await readFile(join(INPUTS, `pg${novel.ebook}-${novel.slug}.txt`), 'utf8');
  const lines = stripGutenberg(raw).replace(/\r\n/g, '\n').split('\n');

  // Find chapter headings. Contents pages also list chapters, so keep only the LAST run of
  // headings: a heading counts only if real prose (a long paragraph) follows before the next one.
  const chapters = [];
  let book = null;
  let current = null;
  for (const line of lines) {
    const b = line.match(BOOK_RE);
    if (b) { book = BOOK_NUM[b[1]]; continue; }
    const m = line.match(CHAPTER_RE);
    if (m) {
      current = { book, chapter: romanToInt(m[2]), heading: line.trim(), lines: [] };
      chapters.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  // Drop contents-page entries: chapters with almost no text.
  const real = chapters.filter((c) => words(c.lines.join(' ')) > 150);
  real.forEach((c, i) => { c.seq = i + 1; });

  const chunks = [];
  for (const c of real) {
    const paras = c.lines.join('\n').split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
    let buf = [], n = 0, part = 0;
    const flush = () => {
      if (!buf.length) return;
      part++;
      chunks.push({
        id: `${novel.slug}-c${String(c.seq).padStart(3, '0')}-p${part}`,
        novel: novel.slug,
        title: novel.title,
        book: c.book,
        chapter: c.chapter,
        chapter_seq: c.seq,
        chapter_label: chapterLabel(c),
        heading: c.heading,
        part,
        words: n,
        text: buf.join('\n\n'),
      });
      buf = []; n = 0;
    };
    for (const p of paras) {
      const w = words(p);
      if (n && n + w > TARGET_WORDS) flush();
      buf.push(p); n += w;
    }
    flush();
  }
  return { chapters: real.length, chunks };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const only = process.argv[2]; // optional: a single slug
  for (const novel of NOVELS) {
    if (only && novel.slug !== only) continue;
    const { chapters, chunks } = await chunkNovel(novel);
    const total = chunks.reduce((a, c) => a + c.words, 0);
    await writeFile(join(OUT, `${novel.slug}.jsonl`), chunks.map((c) => JSON.stringify(c)).join('\n') + '\n');
    console.log(`${novel.title.padEnd(20)} ${String(chapters).padStart(3)} chapters  ${String(chunks.length).padStart(4)} chunks  ${total.toLocaleString()} words`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
