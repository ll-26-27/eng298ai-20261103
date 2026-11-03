// 04 — Categorize (model judgment, structured output).
//
// Sends every non-trivial change from 02-changes.json, one per call, to a
// cheap model with the prompt and JSON schema in 03-schema-prompt.md
// (OpenRouter `response_format: json_schema`, strict). The output is checked
// against the schema again here; a call that fails is retried, then recorded
// as a failure rather than guessed.
//
// Punctuation-only changes are NOT sent: they get the category `punctuation`
// by rule (deterministic), significance 1.
//
// Responses are cached in 04-cache/ (one file per change, holding the exact
// request and response), so rerunning costs nothing unless the prompt, the
// schema, the model or the change itself has changed.
//
// Writes 04-categorized.json; appends tokens and cost to cost-log.jsonl.
//
// Run from the repo root:
//   node --env-file=.env 01-use-cases/04-frankenstein-revisions/operations/04-categorize.mjs [--limit N]

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPromptAndSchema, categorize, pool, newStats, logRun, pruneCache } from './_openrouter.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const MODEL = 'anthropic/claude-haiku-5.5'; // confirmed in the OpenRouter catalog 2026-11-03: supports structured_outputs, $0.10 / $0.50 per million tokens in / out
const CONCURRENCY = 8;

const args = process.argv.slice(2);
const limit = args.includes('--limit') ? +args[args.indexOf('--limit') + 1] : Infinity;

const { changes, totals } = JSON.parse(readFileSync(join(HERE, '02-changes.json'), 'utf8'));
const { prompt, schema } = loadPromptAndSchema();
const stats = newStats();

const toModel = changes.filter((c) => c.kind !== 'punctuation').slice(0, limit);
const results = new Map();
let done = 0;
await pool(toModel, CONCURRENCY, async (c) => {
  results.set(c.id, await categorize({ model: MODEL, change: c, prompt, schema, cacheDir: join(HERE, '04-cache'), stats }));
  if (++done % 25 === 0) process.stdout.write(`  ${done}/${toModel.length}\n`);
});

const out = changes.map((c) => {
  if (c.kind === 'punctuation') {
    return { ...c, label: { category: 'punctuation', secondary: [], significance: 1, rationale: 'Assigned by rule: the two versions contain the same letters once punctuation, capitalization and hyphens are removed.', confidence: 'high', by: 'rule' } };
  }
  const r = results.get(c.id);
  return r ? { ...c, label: { ...r, by: MODEL } } : { ...c, label: null };
});

const labelled = out.filter((c) => c.label && !c.label.error);
const byCat = labelled.reduce((o, c) => ((o[c.label.category] = (o[c.label.category] || 0) + 1), o), {});
const pruned = Number.isFinite(limit) ? 0 : pruneCache(join(HERE, '04-cache'), stats);
const line = logRun('04-categorize', MODEL, stats, { prunedStaleCache: pruned, sent: toModel.length, byRule: changes.length - changes.filter((c) => c.kind !== 'punctuation').length });
writeFileSync(join(HERE, '04-categorized.json'), JSON.stringify({ model: MODEL, totals, run: line, changes: out }, null, 1));
console.log(line);
console.log('by category', byCat);
console.log('rationales over 40 words:', labelled.filter((c) => c.label.rationaleWords > 40).length);
