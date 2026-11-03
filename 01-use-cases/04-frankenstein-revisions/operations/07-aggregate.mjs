// 07 — Aggregate (deterministic code, no model).
//
// Counts the categorized changes by category and by section (in 1831 reading
// order, with each section's 1818 counterpart), by significance, and by
// confidence; computes agreement for the hand check (05b) against both models.
//
// Writes 07-aggregate.json.
//
// Run from the repo root:
//   node 01-use-cases/04-frankenstein-revisions/operations/07-aggregate.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(readFileSync(join(HERE, f), 'utf8'));
const cat = read('04-categorized.json');
const check = read('05-check.json');
const hand = read('05b-hand-check.json');
const alignment = read('01-alignment.json');
const t1831 = read('01-text-1831.json');

export const CATEGORIES = ['characterization', 'plot', 'expansion', 'cut', 'moral-religious', 'fate-agency', 'framing', 'wording', 'spelling', 'punctuation', 'other'];
const changes = cat.changes.filter((c) => c.label && !c.label.error);
const words = (c) => Math.max(c.wordsAdded, c.wordsRemoved);

const zero = () => Object.fromEntries(CATEGORIES.map((k) => [k, 0]));
const sections = t1831.sections.map((s) => {
  const row = alignment.sections.find((r) => r.s1831 === s.id);
  const top = row?.matches1818[0];
  return { id: s.id, label: s.label, sectionWords: s.words, from1818: top && top.shareOf1831 >= 0.05 ? top.label1818 : '(new)', count: zero(), wordsChanged: zero() };
});
const secById = new Map(sections.map((s) => [s.id, s]));
for (const c of changes) {
  const s = secById.get(c.loc1831);
  s.count[c.label.category]++;
  s.wordsChanged[c.label.category] += words(c);
}

const byCategory = Object.fromEntries(CATEGORIES.map((k) => {
  const prim = changes.filter((c) => c.label.category === k);
  const any = changes.filter((c) => c.label.category === k || (c.label.secondary || []).includes(k));
  return [k, { primary: prim.length, anyLabel: any.length, words: prim.reduce((n, c) => n + words(c), 0) }];
}));

const tally = (f) => changes.reduce((o, c) => ((o[f(c)] = (o[f(c)] || 0) + 1), o), {});

// hand check agreement
const byId = new Map(changes.map((c) => [c.id, c]));
const strongById = new Map(check.rows.map((r) => [r.id, r.strong]));
const handRows = hand.items.map((h) => ({
  ...h,
  cheap: byId.get(h.id).label.category,
  strong: strongById.get(h.id)?.category,
}));
const pct = (n, d) => +(100 * n / d).toFixed(1);
const handSummary = {
  n: handRows.length,
  agreeCheapPct: pct(handRows.filter((r) => r.category === r.cheap).length, handRows.length),
  agreeStrongPct: pct(handRows.filter((r) => r.category === r.strong).length, handRows.length),
  disagreeCheap: handRows.filter((r) => r.category !== r.cheap).map((r) => r.id),
  disagreeStrong: handRows.filter((r) => r.category !== r.strong).map((r) => r.id),
};

const out = {
  categories: CATEGORIES,
  totals: cat.totals,
  labelled: changes.length,
  byRule: changes.filter((c) => c.label.by === 'rule').length,
  byModel: changes.filter((c) => c.label.by !== 'rule').length,
  failures: cat.changes.filter((c) => !c.label || c.label.error).length,
  rationalesOver40Words: changes.filter((c) => c.label.rationaleWords > 40).length,
  byCategory,
  bySignificance: tally((c) => c.label.significance),
  byConfidence: tally((c) => c.label.confidence),
  sections,
  check: check.summary,
  hand: { reader: hand.reader, ...handSummary, rows: handRows },
};
writeFileSync(join(HERE, '07-aggregate.json'), JSON.stringify(out, null, 1));
console.log({ labelled: out.labelled, byRule: out.byRule, byModel: out.byModel, failures: out.failures, rationalesOver40Words: out.rationalesOver40Words });
console.table(Object.fromEntries(Object.entries(byCategory)));
console.log('significance', out.bySignificance, 'confidence', out.byConfidence);
console.log('hand check', handSummary);
