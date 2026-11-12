// Step 1 (deterministic): strip the Project Gutenberg header and licence, split each text into
// its preface, letters, and chapters, tag each with its narrator, and cut each into chunks of
// about 1,000 words on paragraph breaks. Every chunk keeps its edition, volume, chapter, narrator,
// and position, so every place the model finds later can be traced back to where it is in the text.
//
// Why chunk? Asking a model to "list every place in Frankenstein" in one go is brittle and
// impossible to audit. Small chunks guarantee that every page is read. Frankenstein is short
// (about 75,000 words), so the chunks are half the size used for Dickens, which gives a finer count.
//
// Run from the repo root:
//   node 01-use-cases/maps/05-frankenstein-places-map/operations/01-clean-and-chunk.mjs
// Writes operations/data/chunks/<slug>.jsonl (one JSON object per line).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOVELS } from './00-fetch-texts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const INPUTS = join(HERE, '..', 'inputs');
const OUT = join(HERE, 'data', 'chunks');
const TARGET_WORDS = 1000;

// 1818: "LETTER I.", "CHAPTER IV.", "VOL. II.", "PREFACE."   1831: "Letter 1", "Chapter 11"
const HEAD_RE = /^\s*(LETTER|Letter|CHAPTER|Chapter)\s+([IVXLC]+|\d+)\.?\s*$/;
const VOL_RE = /^\s*VOL\.\s+([IVX]+)\.\s*$/;
const PREFACE_RE = /^\s*PREFACE\.\s*$/;
const CONTINUATION_RE = /^\s*WALTON,\s*_in continuation\.?_\.?\s*$/i;

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

export function sectionLabel(c) {
  if (c.kind === 'preface') return 'Preface';
  const base = c.kind === 'letter' ? `Letter ${c.chapter}` : `${c.volume ? `Vol. ${c.volume}, ` : ''}Chapter ${c.chapter}`;
  return c.continuation ? `${base} (Walton, in continuation)` : base;
}

async function chunkNovel(novel) {
  const raw = await readFile(join(INPUTS, `pg${novel.ebook}-${novel.slug}.txt`), 'utf8');
  const lines = stripGutenberg(raw).replace(/\r\n/g, '\n').split('\n');

  // Find the sections. The 1831 file opens with a contents list, which also matches the heading
  // pattern; those entries have no text and are dropped below. The title page, dedication, and
  // epigraph come before the first heading and are not chunked (they name no places).
  const sections = [];
  let volume = null;
  let current = null;
  const open = (s) => { current = { volume, lines: [], ...s }; sections.push(current); };
  for (const line of lines) {
    const v = line.match(VOL_RE);
    if (v) { volume = romanToInt(v[1]); continue; }
    if (PREFACE_RE.test(line)) { open({ kind: 'preface', chapter: 0, heading: 'Preface' }); continue; }
    const m = line.match(HEAD_RE);
    if (m) {
      const kind = /letter/i.test(m[1]) ? 'letter' : 'chapter';
      open({ kind, volume: kind === 'letter' ? null : volume, chapter: romanToInt(m[2]), heading: line.trim() });
      continue;
    }
    if (CONTINUATION_RE.test(line) && current) {
      open({ kind: current.kind, volume: current.volume, chapter: current.chapter, heading: line.trim().replace(/_/g, ''), continuation: true });
      continue;
    }
    if (current) current.lines.push(line);
  }
  const real = sections.filter((c) => words(c.lines.join(' ')) > 150);
  real.forEach((c, i) => {
    c.seq = i + 1;
    c.narrator = c.kind === 'preface' ? 'preface'
      : c.kind === 'letter' || c.continuation ? 'walton'
      : novel.creature(c) ? 'creature' : 'victor';
  });

  const chunks = [];
  for (const c of real) {
    const paras = c.lines.join('\n').split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
    let buf = [], n = 0, part = 0;
    const flush = () => {
      if (!buf.length) return;
      part++;
      chunks.push({
        id: `${novel.slug}-s${String(c.seq).padStart(2, '0')}-p${part}`,
        novel: novel.slug,
        title: novel.title,
        volume: c.volume,
        kind: c.kind,
        chapter: c.chapter,
        chapter_seq: c.seq,
        chapter_label: sectionLabel(c),
        heading: c.heading,
        narrator: c.narrator,
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
  return { sections: real, chunks };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const only = process.argv[2]; // optional: a single slug
  for (const novel of NOVELS) {
    if (only && novel.slug !== only) continue;
    const { sections, chunks } = await chunkNovel(novel);
    const total = chunks.reduce((a, c) => a + c.words, 0);
    await writeFile(join(OUT, `${novel.slug}.jsonl`), chunks.map((c) => JSON.stringify(c)).join('\n') + '\n');
    const byNarrator = {};
    for (const c of chunks) byNarrator[c.narrator] = (byNarrator[c.narrator] || 0) + c.words;
    const kinds = (k) => sections.filter((s) => s.kind === k && !s.continuation).length;
    console.log(`${novel.title.padEnd(20)} ${kinds('preface')} preface, ${kinds('letter')} letters, ${kinds('chapter')} chapters  ${String(chunks.length).padStart(4)} chunks  ${total.toLocaleString()} words`);
    console.log(`  words by narrator: ${Object.entries(byNarrator).map(([k, v]) => `${k} ${v.toLocaleString()}`).join(', ')}`);
    console.log(`  creature's tale: ${sections.filter((s) => s.narrator === 'creature').map(sectionLabel).join('; ')}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
