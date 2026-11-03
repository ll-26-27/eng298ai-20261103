// 01 — Normalize and align (deterministic code, no model).
//
// Reads the two Project Gutenberg files in ../inputs/, strips the Gutenberg
// boilerplate, title pages, illustrations and footnotes, normalizes
// typography (quotes, dashes, italics underscores, whitespace), splits each
// edition into sections (preface, letters, chapters) → paragraphs → sentences,
// and aligns the 1818 sections (three volumes, chapters numbered per volume)
// with the 1831 sections (chapters numbered continuously, plus the author's
// Introduction) by shared five-word sequences.
//
// Writes:
//   01-text-1818.json, 01-text-1831.json   the normalized editions
//   01-alignment.json                      section map with overlap evidence
//
// Run from the repo root:
//   node mk-projects/04-frankenstein-revisions/operations/01-normalize-align.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const INPUTS = join(HERE, '..', 'inputs');

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16, XVII: 17, XVIII: 18, XIX: 19, XX: 20, XXI: 21, XXII: 22, XXIII: 23, XXIV: 24 };

// ---------- typography ----------
export function normalizeText(s) {
  return s
    .replace(/\r/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s*(—+|--+)\s*/g, '—') // every dash run becomes one em dash, no spaces
    .replace(/_([^_]+)_/g, '$1') // italics markers
    .replace(/\[(\d+)\]/g, '') // footnote markers
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- sentence splitting ----------
// abbreviations and initials ("M. Waldman", "R. W.") do not end a sentence
const ABBREV = /(?:\b(?:Mr|Mrs|Dr|St|Messrs|Mme|Mlle|viz|i\.e|e\.g|&c|[A-Z])\.)$/;
export function splitSentences(p) {
  const out = [];
  // candidate boundaries: . ! ? (optionally followed by closing quotes/brackets) then space then an opener
  const re = /[.!?]["')\]]*\s+(?=["'(\[]?[A-Z0-9—])/g;
  let start = 0;
  let m;
  while ((m = re.exec(p))) {
    const end = m.index + m[0].trimEnd().length;
    const piece = p.slice(start, end);
    if (ABBREV.test(piece.replace(/["')\]]+$/, ''))) continue;
    out.push(piece.trim());
    start = m.index + m[0].length;
  }
  if (start < p.length) out.push(p.slice(start).trim());
  return out.filter(Boolean);
}

// ---------- parsing one Gutenberg file ----------
function bodyLines(raw) {
  const lines = raw.replace(/\r/g, '').split('\n');
  const s = lines.findIndex((l) => l.startsWith('*** START OF THE PROJECT GUTENBERG'));
  const e = lines.findIndex((l) => l.startsWith('*** END OF THE PROJECT GUTENBERG'));
  return lines.slice(s + 1, e);
}

function removeBracketBlocks(lines) {
  // [Illustration: ...], [Footnote n: ...], [Transcriber's Note: ...] can span lines
  const out = [];
  let depth = 0;
  for (const line of lines) {
    if (depth === 0 && /^\s*\[(Illustration|Footnote|Transcriber)/.test(line)) {
      depth = 1;
    }
    if (depth > 0) {
      if (/\]\s*$/.test(line)) depth = 0;
      out.push('');
      continue;
    }
    out.push(line);
  }
  return out;
}

const HEADING = /^\s*(INTRODUCTION|PREFACE|LETTER ([IVX]+)|CHAPTER ([IVX]+))\.\s*$/;

function parseEdition(raw, edition) {
  const lines = removeBracketBlocks(bodyLines(raw));
  const sections = [];
  let cur = null;
  let volume = 1;
  let skippingTitlePage = false;
  let buf = [];
  const flush = () => {
    if (cur && buf.length) {
      const para = normalizeText(buf.join(' '));
      if (para) cur.paragraphs.push(para);
    }
    buf = [];
  };
  for (const line of lines) {
    // 1818 volume title pages: from "FRANKENSTEIN;" up to the next heading
    if (/^\s*VOL\. (II|III)\.\s*$/.test(line)) volume = ROMAN[line.trim().slice(5, -1)];
    if (/^\s*FRANKENSTEIN[;:]\s*$/.test(line)) { flush(); skippingTitlePage = true; continue; }
    if (/^\s*END OF VOL\. [IV]+\.\s*$/.test(line)) { flush(); continue; }
    if (/^\s*THE END\.\s*$/.test(line)) { flush(); cur = null; continue; }
    const h = line.match(HEADING);
    if (h) {
      flush();
      skippingTitlePage = false;
      let kind, n, label, id;
      if (h[1] === 'INTRODUCTION') { kind = 'introduction'; id = 'introduction'; label = "Author's Introduction (1831)"; }
      else if (h[1] === 'PREFACE') { kind = 'preface'; id = 'preface'; label = 'Preface'; }
      else if (h[2]) { kind = 'letter'; n = ROMAN[h[2]]; id = `letter-${n}`; label = `Letter ${h[2]}`; }
      else { kind = 'chapter'; n = ROMAN[h[3]]; }
      cur = { kind, n, id, label, volume: edition === 1818 ? volume : null, paragraphs: [] };
      sections.push(cur);
      continue;
    }
    if (skippingTitlePage || !cur) continue;
    if (/^\s*$/.test(line)) { flush(); continue; }
    if (/^\s*\*\s+\*\s+\*/.test(line)) { flush(); continue; } // asterisk rules
    buf.push(line.trim());
  }
  flush();
  // number chapters: 1818 per volume → continuous sequence; 1831 already continuous
  let seq = 0;
  for (const s of sections) {
    if (s.kind !== 'chapter') continue;
    seq += 1;
    s.seq = seq;
    const roman = Object.keys(ROMAN).find((k) => ROMAN[k] === s.n);
    if (edition === 1818) {
      s.id = `v${s.volume}-ch${s.n}`;
      s.label = `Vol. ${['', 'I', 'II', 'III'][s.volume]}, Ch. ${roman}`;
    } else {
      s.id = `ch${s.n}`;
      s.label = `Ch. ${roman}`;
    }
  }
  // sentences, each with a stable id
  for (const s of sections) {
    s.sentences = [];
    s.paragraphs.forEach((p, pi) => {
      splitSentences(p).forEach((t, si) => s.sentences.push({ id: `${edition}:${s.id}:p${pi + 1}:s${si + 1}`, para: pi + 1, text: t }));
    });
    s.words = s.paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
  }
  return sections;
}

// ---------- section alignment by shared 5-word shingles ----------
function shingles(sec) {
  const w = sec.paragraphs.join(' ').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i + 5 <= w.length; i++) set.add(w.slice(i, i + 5).join(' '));
  return set;
}

function align(a, b) {
  const sa = a.map(shingles);
  const sb = b.map(shingles);
  const rows = [];
  b.forEach((secB, j) => {
    const scores = a.map((secA, i) => {
      let shared = 0;
      for (const x of sb[j]) if (sa[i].has(x)) shared++;
      return { i, shared };
    }).filter((x) => x.shared > 0).sort((x, y) => y.shared - x.shared);
    rows.push({
      s1831: secB.id,
      label1831: secB.label,
      words1831: secB.words,
      matches1818: scores.slice(0, 3).map(({ i, shared }) => ({
        s1818: a[i].id,
        label1818: a[i].label,
        sharedShingles: shared,
        shareOf1831: +(shared / Math.max(1, sb[j].size)).toFixed(3),
      })),
    });
  });
  return rows;
}

// ---------- main ----------
const ed1818 = parseEdition(readFileSync(join(INPUTS, 'pg41445.txt'), 'utf8'), 1818);
const ed1831 = parseEdition(readFileSync(join(INPUTS, 'pg42324.txt'), 'utf8'), 1831);

const summary = (secs) => ({
  sections: secs.length,
  chapters: secs.filter((s) => s.kind === 'chapter').length,
  paragraphs: secs.reduce((n, s) => n + s.paragraphs.length, 0),
  sentences: secs.reduce((n, s) => n + s.sentences.length, 0),
  words: secs.reduce((n, s) => n + s.words, 0),
});

const strip = (secs) => secs.map(({ id, kind, label, volume, seq, words, sentences }) => ({ id, kind, label, volume, seq, words, sentences }));
writeFileSync(join(HERE, '01-text-1818.json'), JSON.stringify({ edition: 1818, source: 'inputs/pg41445.txt', ...summary(ed1818), sections: strip(ed1818) }, null, 1));
writeFileSync(join(HERE, '01-text-1831.json'), JSON.stringify({ edition: 1831, source: 'inputs/pg42324.txt', ...summary(ed1831), sections: strip(ed1831) }, null, 1));

const alignment = align(ed1818, ed1831);
const unmatched1818 = ed1818.filter((s) => !alignment.some((r) => r.matches1818[0]?.s1818 === s.id)).map((s) => s.id);
writeFileSync(join(HERE, '01-alignment.json'), JSON.stringify({
  method: 'For each 1831 section, the 1818 sections sharing the most five-word sequences (lowercased, letters only). The top match is the aligned section; shareOf1831 is the fraction of the 1831 section\'s five-word sequences also found in that 1818 section.',
  editions: { 1818: summary(ed1818), 1831: summary(ed1831) },
  unmatched1818,
  sections: alignment,
}, null, 1));

console.log('1818', summary(ed1818));
console.log('1831', summary(ed1831));
for (const r of alignment) {
  const m = r.matches1818.map((x) => `${x.label1818} (${x.shareOf1831})`).join(', ');
  console.log(`${r.label1831.padEnd(30)} ← ${m || '(no match: new in 1831)'}`);
}
if (unmatched1818.length) console.log('1818 sections with no 1831 counterpart as top match:', unmatched1818.join(', '));
