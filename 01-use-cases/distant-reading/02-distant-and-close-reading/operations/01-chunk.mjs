// Step 1 (deterministic code): cut each text into passages of roughly 150–300 words.
// Reads the untouched Project Gutenberg files in ../inputs, keeps only the work itself
// (no Gutenberg header or license, no Jowett introduction, no R.U.R. property list),
// tracks the chapter / act it is in, and records each passage's position (0 = start, 1 = end).
// Writes operations/01-chunks.json.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INPUTS, writeJSON, words } from './_lib.mjs';

const TEXTS = [
  {
    id: 'frankenstein', title: 'Frankenstein', author: 'Mary Shelley', year: 1818,
    file: 'frankenstein-1818-pg41445.txt',
    start: /^PREFACE\.$/m, end: /^\*\*\* END OF THE PROJECT GUTENBERG/m,
    // Chapters restart in each of the three volumes, so we track the volume too.
    heading: (line, st) => {
      const m = line.match(/^(PREFACE|LETTER [IVX]+|CHAPTER [IVXL]+)\.$/);
      if (m) return (/CHAPTER/.test(m[1]) ? (st.vol || 'VOL. I') + ', ' : '') + cap(m[1]);
      return null;
    },
    // The volume title pages and epigraphs repeat inside the text; drop them.
    drop: /^(_?MODERN PROMETHEUS\._?|VOL\. I+\.|FRANKENSTEIN;|OR,|THE MODERN PROMETHEUS\.|IN THREE VOLUMES\.|London:|_PRINTED FOR_|LACKINGTON|FINSBURY SQUARE\.|1818\.|Did I request thee|To mould me man|From darkness to promote|Paradise Lost\.|\*\s+\*)/,
  },
  {
    id: 'rur', title: 'R.U.R.', author: 'Karel Čapek (tr. Paul Selver and Nigel Playfair)', year: 1923,
    file: 'rur-selver-playfair-1923-pg59112.txt',
    start: /^ACT ONE$/m, end: /^PROPERTY LIST$/m,
    heading: (line) => (/^(ACT ONE|ACT TWO|ACT THREE|EPILOGUE)$/.test(line) ? cap(line) : null),
    drop: /^(CURTAIN|R\. U\. R\.)$/,
  },
  {
    id: 'dorian', title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', year: 1891,
    file: 'dorian-gray-1891-pg174.txt',
    start: /^THE PREFACE$/m, end: /^\*\*\* END OF THE PROJECT GUTENBERG/m,
    heading: (line) => { const m = line.match(/^(THE PREFACE|CHAPTER [IVXL]+)\.?$/); return m ? cap(m[1]) : null; },
  },
  {
    id: 'phaedrus', title: 'Phaedrus', author: 'Plato (tr. Benjamin Jowett)', year: 1871,
    file: 'phaedrus-jowett-pg1636.txt',
    // Skip Jowett's long introduction: we want Plato's dialogue, not the translator's essay.
    start: /^PERSONS OF THE DIALOGUE/m, end: /^\*\*\* END OF THE PROJECT GUTENBERG/m,
    heading: () => null,
  },
];

function cap(s) { return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\b(Vol\.|Ii|Iii|Iv|Vi|Vii|Viii|Ix|Xi|Xii|Xiii|Xiv|Xv|Xvi|Xvii|Xviii|Xix|Xx)\b/g, (r) => r.toUpperCase()); }

const MIN = 150, MAX = 300;
const chunks = [];

for (const t of TEXTS) {
  const raw = readFileSync(join(INPUTS, t.file), 'utf8').replace(/\r/g, '');
  const s = raw.search(t.start), e = raw.search(t.end);
  const body = raw.slice(s, e);
  const st = {};
  let section = t.id === 'phaedrus' ? 'Dialogue' : '';
  // Paragraphs are separated by blank lines; wrapped lines inside a paragraph are joined.
  const paras = [];
  for (const block of body.split(/\n\s*\n/)) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const vol = lines.find((l) => /^VOL\. (II|III)\.$/.test(l));
    if (vol) st.vol = vol.replace(/\.$/, '');
    if (lines.length === 1) {
      const h = t.heading(lines[0], st);
      if (h === 'skip') continue;
      if (h) { section = h; continue; }
    }
    if (t.drop && lines.every((l) => t.drop.test(l))) continue;
    const text = lines.join(' ').replace(/\s+/g, ' ').trim();
    if (/^\[Illustration/.test(text)) continue;
    paras.push({ text, section });
  }
  // Split very long paragraphs at sentence ends, then merge short ones (dialogue) up to MIN words.
  const pieces = [];
  for (const p of paras) {
    if (words(p.text) <= MAX) { pieces.push(p); continue; }
    const sentences = p.text.match(/[^.!?]+[.!?]+["”’)_]*\s*|[^.!?]+$/g) || [p.text];
    let buf = '';
    for (const sen of sentences) {
      if (buf && words(buf + sen) > 220) { pieces.push({ text: buf.trim(), section: p.section }); buf = ''; }
      buf += sen;
    }
    if (buf.trim()) pieces.push({ text: buf.trim(), section: p.section });
  }
  const textChunks = [];
  let cur = null;
  for (const p of pieces) {
    const fits = cur && cur.section === p.section && words(cur.text) < MIN && words(cur.text) + words(p.text) <= MAX + 60;
    if (fits) cur.text += '\n\n' + p.text;
    else { if (cur) textChunks.push(cur); cur = { section: p.section, text: p.text }; }
  }
  if (cur) textChunks.push(cur);
  const total = textChunks.reduce((n, c) => n + words(c.text), 0);
  let seen = 0;
  textChunks.forEach((c, i) => {
    const w = words(c.text);
    chunks.push({ id: `${t.id}-${String(i + 1).padStart(4, '0')}`, text_id: t.id, n: i + 1, section: c.section, pos: +(seen / total).toFixed(5), len: +(w / total).toFixed(5), words: w, text: c.text });
    seen += w;
  });
  console.log(`${t.title}: ${textChunks.length} passages, ${total} words`);
}

writeJSON('01-chunks.json', { texts: TEXTS.map(({ id, title, author, year, file }) => ({ id, title, author, year, file })), chunks });
console.log(`total: ${chunks.length} passages → operations/01-chunks.json`);
