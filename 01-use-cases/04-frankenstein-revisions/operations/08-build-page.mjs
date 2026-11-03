// 08 — Build the page (deterministic code, no model).
//
// Reads the outputs of steps 02–07 and writes ../outputs/index.html: one
// self-contained file with the data embedded inline (no fetch, no libraries),
// so it opens by double-click from the file system.
//
// Run from the repo root:
//   node mk-projects/04-frankenstein-revisions/operations/08-build-page.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'outputs');
const read = (f) => JSON.parse(readFileSync(join(HERE, f), 'utf8'));
const cat = read('04-categorized.json');
const check = read('05-check.json');
const known = read('06-known-revisions.json');
const agg = read('07-aggregate.json');
const costLog = readFileSync(join(HERE, 'cost-log.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));

const strong = new Map(check.rows.map((r) => [r.id, r.strong]));
const hand = new Map(agg.hand.rows.map((r) => [r.id, r]));
const noticed = read('05b-hand-check.json').alsoNoticed?.items || [];
for (const n of noticed) hand.set(n.id, { ...n, noticed: true });

const changes = cat.changes.map((c) => ({
  id: c.id,
  l18: c.label1818,
  l31: c.label1831,
  sec: c.loc1831,
  kind: c.kind,
  size: c.size,
  add: c.wordsAdded,
  rem: c.wordsRemoved,
  rw: c.rewrite || false,
  whole: c.wholeSection || false,
  segs: c.segments,
  cat: c.label.category,
  sec2: c.label.secondary,
  sig: c.label.significance,
  conf: c.label.confidence,
  why: c.label.rationale,
  by: c.label.by,
  chk: strong.get(c.id) || null,
  hand: hand.has(c.id) ? { category: hand.get(c.id).category, note: hand.get(c.id).note, noticed: !!hand.get(c.id).noticed } : null,
}));

const cost = {
  runs: costLog,
  total: +costLog.reduce((n, r) => n + r.cost, 0).toFixed(4),
  byStep: costLog.reduce((o, r) => ((o[r.step] = +((o[r.step] || 0) + r.cost).toFixed(4)), o), {}),
  calls: costLog.reduce((n, r) => n + r.calls, 0),
};

const DATA = { changes, noticed: noticed.map((n) => n.id), agg, known, check: check.summary, cost, cheapModel: cat.model, built: new Date().toISOString().slice(0, 10) };
const json = JSON.stringify(DATA).replace(/</g, '\\u003c');

const html = readFileSync(join(HERE, '08-page-template.html'), 'utf8').replace('/*__DATA__*/null', json);
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.html'), html);
console.log(`wrote outputs/index.html (${(html.length / 1024).toFixed(0)} KB), ${changes.length} changes, total model cost $${cost.total}`);
