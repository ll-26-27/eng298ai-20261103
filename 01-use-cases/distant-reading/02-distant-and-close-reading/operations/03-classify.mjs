// Step 3 (model judgment): ask a cheap model, for every passage, whether it is a scene of
// instruction. The prompt and schema are read from 03-classify-prompt.md. Responses are cached
// in operations/cache/03-classify/, and tokens and cost are appended to operations/cost-log.jsonl.
// Usage (from the repo root):
//   node --env-file=.env 01-use-cases/distant-reading/02-distant-and-close-reading/operations/03-classify.mjs [text_id] [limit]
// Writes operations/03-classifications.json.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { OPS, readJSON, writeJSON, chatJSON, pool } from './_lib.mjs';

export const MODEL = 'anthropic/claude-haiku-5.5';
const CONCURRENCY = 8;

const md = readFileSync(join(OPS, '03-classify-prompt.md'), 'utf8');
const SYSTEM = md.match(/```text\n([\s\S]*?)\n```/)[1];
const SCHEMA = JSON.parse(md.match(/## The schema\s+```json\n([\s\S]*?)\n```/)[1]);

const [onlyText, limit] = process.argv.slice(2);
const { texts, chunks } = readJSON('01-chunks.json');
const byId = Object.fromEntries(texts.map((t) => [t.id, t]));
let todo = chunks.filter((c) => !onlyText || onlyText === 'all' || c.text_id === onlyText);
if (limit) todo = todo.slice(0, +limit);

const previous = existsSync(join(OPS, '03-classifications.json')) ? readJSON('03-classifications.json').results : {};
let spent = 0, done = 0, fresh = 0;
const results = await pool(todo, CONCURRENCY, async (c) => {
  const t = byId[c.text_id];
  const user = `Work: ${t.title} (${t.author}, ${t.year})\nLocation: ${c.section}\n\n${c.text}`;
  try {
    const r = await chatJSON({ model: MODEL, step: '03-classify', schema: SCHEMA, schemaName: 'instruction', maxTokens: 1500,
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }] });
    if (!r.cached) { fresh++; spent += r.usage.cost || 0; }
    if (++done % 50 === 0) console.log(`${done}/${todo.length}  new calls: ${fresh}  cost so far: $${spent.toFixed(4)}`);
    return [c.id, r.result];
  } catch (err) {
    console.error(`${c.id}: ${err.message}`);
    return [c.id, null];
  }
});

const merged = { ...previous };
for (const [id, r] of results) if (r) merged[id] = r;
writeJSON('03-classifications.json', { model: MODEL, results: merged });
const failed = results.filter(([, r]) => !r).length;
console.log(`classified ${results.length - failed} (${fresh} new calls, $${spent.toFixed(4)}), failed ${failed} → operations/03-classifications.json`);
