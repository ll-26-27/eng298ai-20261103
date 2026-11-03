// Step 8 (deterministic code): assemble everything into one self-contained page,
// outputs/index.html, with all the data embedded inline so it opens by double-click (file://).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { OPS, OUTPUTS, readJSON } from './_lib.mjs';

const maybe = (name) => (existsSync(join(OPS, name)) ? readJSON(name) : null);
const { texts, chunks } = readJSON('01-chunks.json');
const { hits, pattern } = readJSON('02-keyword-hits.json');
const cls = readJSON('03-classifications.json');
const cmp = readJSON('04-comparison.json');
const check = maybe('05-check-results.json');
const close = maybe('06-close-readings.json');
const sim = maybe('07-similarity.json');

// Costs, summed from the log by step and model.
const costs = {};
for (const line of readFileSync(join(OPS, 'cost-log.jsonl'), 'utf8').trim().split('\n')) {
  const e = JSON.parse(line); const k = `${e.step}|${e.model}`;
  costs[k] ||= { step: e.step, model: e.model, calls: 0, prompt: 0, completion: 0, cost: 0 };
  Object.assign(costs[k], { calls: costs[k].calls + 1, prompt: costs[k].prompt + (e.prompt || 0), completion: costs[k].completion + (e.completion || 0), cost: costs[k].cost + (e.cost || 0) });
}

const bad = new Set(cmp.evidence_not_found);
const DATA = {
  texts, pattern, summary: cmp.summary, models: { classify: cls.model, close: close?.model, embed: sim?.model },
  chunks: chunks.map((c) => ({ id: c.id, t: c.text_id, n: c.n, s: c.section, p: c.pos, l: c.len, x: c.text })),
  kw: hits,
  cls: Object.fromEntries(Object.entries(cls.results).map(([id, r]) => [id, { st: r.is_instance ? r.strength : 0, i: r.instructor, l: r.learner, w: r.what_is_taught, e: r.evidence, ok: !bad.has(id), r: r.reason }])),
  close: Object.fromEntries((close?.readings || []).map((r) => [r.id, r])),
  sim: sim ? { seed: sim.seed, top: sim.top.slice(0, 30).map((t) => t.id), scores: sim.scores } : null,
  check, costs: Object.values(costs),
};

const html = readFileSync(join(OPS, '08-page-template.html'), 'utf8')
  .replace('/*__DATA__*/null', JSON.stringify(DATA).replace(/</g, '\\u003c'));
writeFileSync(join(OUTPUTS, 'index.html'), html);
console.log(`outputs/index.html written (${(html.length / 1024).toFixed(0)} KB)`);
