// 05 — Check (guardrail: model judgment checked against model judgment).
//
// Draws a seeded random sample of the model-categorized changes (the same
// sample every run) and sends each one, with exactly the same prompt and
// schema, to a stronger model that has not seen the first model's answer.
// Then compares the two labels with fixed rules and reports agreement.
//
// Agreement does not prove the labels are right (two models can share a
// blind spot); disagreement shows where the categories are unclear or the
// cheap model is unreliable. Step 05b is a human reading of a sample.
//
// Writes 05-check.json; appends tokens and cost to cost-log.jsonl.
//
// Run from the repo root:
//   node --env-file=.env 01-use-cases/04-frankenstein-revisions/operations/05-check-with-stronger-model.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPromptAndSchema, categorize, pool, newStats, logRun, pruneCache } from './_openrouter.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHECK_MODEL = 'anthropic/claude-sonnet-5.5'; // confirmed in the OpenRouter catalog 2026-11-03: supports structured_outputs, $2 / $10 per million tokens in / out
const SAMPLE_SIZE = 100;
const SEED = 1831;

// small seeded PRNG (mulberry32), so the sample is reproducible
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const data = JSON.parse(readFileSync(join(HERE, '04-categorized.json'), 'utf8'));
const pool0 = data.changes.filter((c) => c.label && c.label.by !== 'rule' && !c.label.error);
const rand = rng(SEED);
const shuffled = pool0.map((c) => [rand(), c]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const sample = shuffled.slice(0, SAMPLE_SIZE).sort((a, b) => a.id.localeCompare(b.id));

const { prompt, schema } = loadPromptAndSchema();
const stats = newStats();
const second = new Map();
await pool(sample, 6, async (c) => {
  second.set(c.id, await categorize({ model: CHECK_MODEL, change: c, prompt, schema, cacheDir: join(HERE, '05-cache'), stats }));
});

const rows = sample.map((c) => {
  const a = c.label, b = second.get(c.id);
  return {
    id: c.id,
    label1818: c.label1818,
    size: c.size,
    cheap: { category: a.category, secondary: a.secondary, significance: a.significance, confidence: a.confidence },
    strong: { category: b.category, secondary: b.secondary, significance: b.significance, confidence: b.confidence, rationale: b.rationale },
    sameCategory: a.category === b.category,
    overlapping: a.category === b.category || (b.secondary || []).includes(a.category) || (a.secondary || []).includes(b.category),
    significanceDiff: Math.abs(a.significance - b.significance),
  };
});

const pct = (n) => +(100 * n / rows.length).toFixed(1);
const confusion = {};
for (const r of rows) if (!r.sameCategory) {
  const k = `${r.cheap.category} → ${r.strong.category}`;
  confusion[k] = (confusion[k] || 0) + 1;
}
const byConfidence = {};
for (const r of rows) {
  const k = r.cheap.confidence;
  byConfidence[k] ??= { n: 0, agree: 0 };
  byConfidence[k].n++; if (r.sameCategory) byConfidence[k].agree++;
}
const bySize = {};
for (const r of rows) {
  bySize[r.size] ??= { n: 0, agree: 0 };
  bySize[r.size].n++; if (r.sameCategory) bySize[r.size].agree++;
}
const summary = {
  cheapModel: data.model,
  checkModel: CHECK_MODEL,
  sampleSize: rows.length,
  population: pool0.length,
  seed: SEED,
  sameCategoryPct: pct(rows.filter((r) => r.sameCategory).length),
  overlappingPct: pct(rows.filter((r) => r.overlapping).length),
  significanceWithin1Pct: pct(rows.filter((r) => r.significanceDiff <= 1).length),
  significanceExactPct: pct(rows.filter((r) => r.significanceDiff === 0).length),
  byConfidence,
  bySize,
  disagreements: Object.fromEntries(Object.entries(confusion).sort((a, b) => b[1] - a[1])),
};
const pruned = pruneCache(join(HERE, '05-cache'), stats);
const line = logRun('05-check', CHECK_MODEL, stats, { prunedStaleCache: pruned, sample: rows.length });
writeFileSync(join(HERE, '05-check.json'), JSON.stringify({ summary, run: line, rows }, null, 1));
console.log(line);
console.log(JSON.stringify(summary, null, 2));
