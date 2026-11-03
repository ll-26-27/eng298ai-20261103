// Step 7 (optional; model arithmetic, not judgment): a third method. Turn every passage into an
// embedding (a long list of numbers standing for its meaning) and rank passages by how similar
// they are to one SEED passage: the creature learning words from the cottagers in Frankenstein.
// Nothing here reads the definition of a scene of instruction; similarity is all it knows.
// Uses OpenRouter's embeddings endpoint (POST /api/v1/embeddings). Vectors are cached in
// operations/cache/07-embed/ (gitignore-worthy: large); the scores go to operations/07-similarity.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { OPS, readJSON, writeJSON } from './_lib.mjs';

export const MODEL = 'google/gemini-embedding-2';
const SEED_ID = process.argv[2] || 'frankenstein-0158';
const BATCH = 64;

const { chunks } = readJSON('01-chunks.json');
const cacheFile = join(OPS, 'cache', '07-embed', MODEL.replace('/', '_') + '.json');
const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};

const todo = chunks.filter((c) => !cache[c.id]);
let cost = 0;
for (let i = 0; i < todo.length; i += BATCH) {
  const batch = todo.slice(i, i + BATCH);
  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, input: batch.map((c) => c.text) }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(JSON.stringify(json.error || json).slice(0, 300));
  json.data.forEach((d, k) => { cache[batch[k].id] = d.embedding.map((x) => +x.toFixed(5)); });
  cost += json.usage?.cost || 0;
  appendFileSync(join(OPS, 'cost-log.jsonl'), JSON.stringify({ at: new Date().toISOString(), step: '07-embed', model: MODEL, prompt: json.usage?.prompt_tokens, completion: 0, cost: json.usage?.cost ?? null }) + '\n');
  console.log(`embedded ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
}
mkdirSync(join(OPS, 'cache', '07-embed'), { recursive: true });
writeFileSync(cacheFile, JSON.stringify(cache));

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const unit = (v) => { const n = Math.sqrt(dot(v, v)); return v.map((x) => x / n); };
const seed = unit(cache[SEED_ID]);
const scores = Object.fromEntries(chunks.map((c) => [c.id, +dot(seed, unit(cache[c.id])).toFixed(4)]));
const ranked = Object.entries(scores).filter(([id]) => id !== SEED_ID).sort((a, b) => b[1] - a[1]);
writeJSON('07-similarity.json', { model: MODEL, seed: SEED_ID, scores, top: ranked.slice(0, 40).map(([id, s]) => ({ id, s })) });
console.log(`seed ${SEED_ID}; new spend $${cost.toFixed(5)}; top 10:`, ranked.slice(0, 10));
