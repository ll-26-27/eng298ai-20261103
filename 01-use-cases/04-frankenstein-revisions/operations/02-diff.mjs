// 02 — Diff (deterministic code, no model).
//
// Uses the section alignment from step 01 to pair each 1818 section with its
// 1831 counterpart(s) (1818 Vol. I, Ch. I became 1831 Chs. I and II), then:
//   1. aligns sentences inside each pair by longest common subsequence;
//   2. groups every run of unmatched sentences into one "change";
//   3. inside each change, aligns the words the same way, so the edit itself
//      can be highlighted.
// Every sentence of both editions is accounted for: it is either matched
// exactly or belongs to exactly one change. The script checks this and fails
// loudly if it is not true.
//
// It also sorts each change by size and type with fixed rules, so that the
// changes that are only punctuation, capitalization or hyphenation can skip
// the model in step 04.
//
// Writes 02-changes.json and prints the totals.
//
// Run from the repo root:
//   node 01-use-cases/04-frankenstein-revisions/operations/02-diff.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(readFileSync(join(HERE, f), 'utf8'));
const t1818 = read('01-text-1818.json');
const t1831 = read('01-text-1831.json');
const alignment = read('01-alignment.json');

const sec1818 = new Map(t1818.sections.map((s) => [s.id, s]));
const sec1831 = new Map(t1831.sections.map((s) => [s.id, s]));

// ---------- LCS alignment of two token arrays (returns pairs of matched indices) ----------
function lcsPairs(a, b, eq = (x, y) => x === y) {
  const n = a.length, m = b.length;
  const W = m + 1;
  const dp = new Uint32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * W + j] = eq(a[i], b[j]) ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    }
  }
  const pairs = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (eq(a[i], b[j])) { pairs.push([i, j]); i++; j++; }
    else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) i++;
    else j++;
  }
  return pairs;
}

// ---------- word-level diff inside a change ----------
const tokenize = (s) => s.match(/[\p{L}\p{N}'-]+|[^\s\p{L}\p{N}'-]/gu) || [];
function wordDiff(before, after) {
  const a = tokenize(before), b = tokenize(after);
  const pairs = lcsPairs(a, b);
  const segs = [];
  const push = (op, tok) => {
    const last = segs[segs.length - 1];
    if (last && last[0] === op) last[1].push(tok); else segs.push([op, [tok]]);
  };
  let i = 0, j = 0;
  for (const [pi, pj] of [...pairs, [a.length, b.length]]) {
    while (i < pi) push('-', a[i++]);
    while (j < pj) push('+', b[j++]);
    if (pi < a.length) { push('=', a[i++]); j++; }
  }
  const join = (toks) => toks.join(' ').replace(/ ([,.;:!?)\]—])/g, '$1').replace(/([(\[—]) /g, '$1');
  // When the two versions share less than half their words, a word-by-word
  // alignment is noise ("[-We had resolved not-] {+The voyage came+} to ..."):
  // treat the passage as rewritten and show it whole, before and after.
  const similarity = (2 * pairs.length) / Math.max(1, a.length + b.length);
  if (similarity < 0.5) return { segs: [['-', before], ['+', after]], similarity, rewrite: true };
  return { segs: segs.map(([op, toks]) => [op, join(toks)]), similarity, rewrite: false };
}

const wordsOf = (s) => (s.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu) || []);
const lettersOnly = (s) => s.toLowerCase().replace(/[^a-z]/g, '');

// ---------- rule-based kind and size ----------
function classify(before, after, segs) {
  const removed = segs.filter((s) => s[0] === '-').map((s) => s[1]).join(' ');
  const added = segs.filter((s) => s[0] === '+').map((s) => s[1]).join(' ');
  const wordsRemoved = wordsOf(removed).length;
  const wordsAdded = wordsOf(added).length;
  let kind;
  if (!before) kind = 'insertion';
  else if (!after) kind = 'removal';
  else if (lettersOnly(before) === lettersOnly(after)) kind = 'punctuation'; // punctuation, capitalization, hyphenation only
  else if (wordsRemoved === 0) kind = 'insertion';
  else if (wordsAdded === 0) kind = 'removal';
  else kind = 'substitution';
  const changedWords = Math.max(wordsRemoved, wordsAdded);
  const size = kind === 'punctuation' ? 'trivial' : changedWords <= 3 ? 'small' : changedWords <= 40 ? 'medium' : 'large';
  return { kind, size, wordsRemoved, wordsAdded };
}

// ---------- pair sections ----------
// group 1831 sections by their top-matching 1818 section
const groups = new Map(); // 1818 id -> [1831 ids]
const only1831 = [];
for (const row of alignment.sections) {
  const top = row.matches1818[0];
  if (!top || top.shareOf1831 < 0.05) { only1831.push(row.s1831); continue; }
  if (!groups.has(top.s1818)) groups.set(top.s1818, []);
  groups.get(top.s1818).push(row.s1831);
}

const changes = [];
let matchedSentences = 0;
const seen1818 = new Set(), seen1831 = new Set();
let n = 0;
const nextId = () => `c${String(++n).padStart(4, '0')}`;

for (const s of only1831) {
  const sec = sec1831.get(s);
  const after = sec.sentences.map((x) => x.text).join(' ');
  sec.sentences.forEach((x) => seen1831.add(x.id));
  changes.push({
    id: nextId(),
    loc1818: null, label1818: '(not in 1818)', seq: 0,
    loc1831: sec.id, label1831: sec.label,
    sentences1818: [], sentences1831: sec.sentences.map((x) => x.id),
    before: '', after,
    segments: [['+', after]],
    ...classify('', after, [['+', after]]),
    wholeSection: true,
    note: `The whole ${sec.label} is new in 1831 (${sec.words} words).`,
  });
}

for (const s1818 of t1818.sections) {
  const ids1831 = groups.get(s1818.id) || [];
  const A = s1818.sentences;
  const B = ids1831.flatMap((id) => sec1831.get(id).sentences.map((x) => ({ ...x, sec: id })));
  const pairs = lcsPairs(A.map((x) => x.text), B.map((x) => x.text));
  matchedSentences += pairs.length;
  pairs.forEach(([i, j]) => { seen1818.add(A[i].id); seen1831.add(B[j].id); });
  let i = 0, j = 0;
  for (const [pi, pj] of [...pairs, [A.length, B.length]]) {
    if (i < pi || j < pj) {
      const a = A.slice(i, pi), b = B.slice(j, pj);
      a.forEach((x) => seen1818.add(x.id));
      b.forEach((x) => seen1831.add(x.id));
      const before = a.map((x) => x.text).join(' ');
      const after = b.map((x) => x.text).join(' ');
      const wd = before && after ? wordDiff(before, after) : { segs: before ? [['-', before]] : [['+', after]], similarity: 0, rewrite: false };
      const segs = wd.segs;
      // location in 1831 for a pure removal: the section of the next matched sentence (or the previous one)
      const sec31 = b[0]?.sec ?? B[pj]?.sec ?? B[pj - 1]?.sec ?? ids1831[0];
      changes.push({
        id: nextId(),
        loc1818: s1818.id, label1818: s1818.label, seq: s1818.seq ?? 0,
        loc1831: sec31, label1831: sec1831.get(sec31)?.label ?? '',
        sentences1818: a.map((x) => x.id), sentences1831: b.map((x) => x.id),
        // context: the matched sentences either side, for readers and for the model
        contextBefore: A[i - 1]?.text ?? '', contextAfter: A[pi]?.text ?? '',
        before, after,
        segments: segs,
        similarity: +wd.similarity.toFixed(3),
        rewrite: wd.rewrite,
        ...classify(before, after, segs),
      });
    }
    i = pi + 1; j = pj + 1;
  }
}

// ---------- completeness check: every sentence is matched or in a change ----------
const all1818 = t1818.sections.flatMap((s) => s.sentences.map((x) => x.id));
const all1831 = t1831.sections.flatMap((s) => s.sentences.map((x) => x.id));
const missing1818 = all1818.filter((id) => !seen1818.has(id));
const missing1831 = all1831.filter((id) => !seen1831.has(id));
if (missing1818.length || missing1831.length) {
  console.error('Completeness check FAILED', { missing1818: missing1818.slice(0, 10), missing1831: missing1831.slice(0, 10) });
  process.exit(1);
}
// reconstruct 1831 from 1818 + changes, as a second check
const changedSentenceCount1818 = changes.reduce((k, c) => k + c.sentences1818.length, 0);
const changedSentenceCount1831 = changes.reduce((k, c) => k + c.sentences1831.length, 0);
if (changedSentenceCount1818 + matchedSentences !== all1818.length || changedSentenceCount1831 + matchedSentences !== all1831.length) {
  console.error('Sentence accounting FAILED');
  process.exit(1);
}

const count = (key) => changes.reduce((o, c) => ((o[c[key]] = (o[c[key]] || 0) + 1), o), {});
const totals = {
  sentences1818: all1818.length,
  sentences1831: all1831.length,
  sentencesUnchanged: matchedSentences,
  changes: changes.length,
  byKind: count('kind'),
  bySize: count('size'),
  wordsRemoved: changes.reduce((k, c) => k + c.wordsRemoved, 0),
  wordsAdded: changes.reduce((k, c) => k + c.wordsAdded, 0),
  completenessCheck: 'passed: every sentence in both editions is either matched exactly or inside exactly one change',
};
writeFileSync(join(HERE, '02-changes.json'), JSON.stringify({ totals, sectionPairs: Object.fromEntries(groups), only1831, changes }, null, 1));
console.log(JSON.stringify(totals, null, 2));
