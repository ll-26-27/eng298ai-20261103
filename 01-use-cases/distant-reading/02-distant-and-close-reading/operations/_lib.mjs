// Shared helpers for the operations in this folder: paths, JSON files, and one
// cached, cost-logged call to OpenRouter. No dependencies; Node's built-in fetch.
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const OPS = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(OPS, '..');
export const INPUTS = join(ROOT, 'inputs');
export const OUTPUTS = join(ROOT, 'outputs');
const CACHE = join(OPS, 'cache');
const COST_LOG = join(OPS, 'cost-log.jsonl');

export const readJSON = (name) => JSON.parse(readFileSync(join(OPS, name), 'utf8'));
export const writeJSON = (name, data) => writeFileSync(join(OPS, name), JSON.stringify(data, null, 1) + '\n');

// Call a chat model with a JSON schema for the reply. Responses are cached by a hash
// of (model, messages, schema), so rerunning a step costs nothing unless the prompt changes.
export async function chatJSON({ model, messages, schema, schemaName = 'result', step, maxTokens = 1200, temperature, reasoning }) {
  const key = process.env.OPENROUTER_API_KEY;
  const body = {
    model,
    messages,
    ...(temperature === undefined ? {} : { temperature }),
    ...(reasoning ? { reasoning } : {}),
    max_tokens: maxTokens,
    response_format: { type: 'json_schema', json_schema: { name: schemaName, strict: true, schema } },
    provider: { require_parameters: true },
    usage: { include: true },
  };
  const hash = createHash('sha256').update(JSON.stringify([model, messages, schema])).digest('hex').slice(0, 24);
  const cacheFile = join(CACHE, step, hash + '.json');
  if (existsSync(cacheFile)) return { ...JSON.parse(readFileSync(cacheFile, 'utf8')), cached: true };
  if (!key) throw new Error('OPENROUTER_API_KEY is not set: run with node --env-file=.env from the repo root');

  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'ENG298AI distant and close reading' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json.error || json).slice(0, 300)}`);
      const text = json.choices?.[0]?.message?.content ?? '';
      const u = json.usage || {};
      const usage = { prompt: u.prompt_tokens, completion: u.completion_tokens, cost: u.cost ?? null };
      // Log every paid call, including ones whose reply turns out to be unusable.
      appendFileSync(COST_LOG, JSON.stringify({ at: new Date().toISOString(), step, model: json.model, ...usage }) + '\n');
      let parsed;
      try { parsed = JSON.parse(text.replace(/^```json\s*|```\s*$/g, '')); }
      catch { throw new Error(`unparseable reply (finish_reason ${json.choices?.[0]?.finish_reason}, ${usage.completion} tokens): ${text.slice(0, 120)}`); }
      const out = { result: parsed, model: json.model, usage };
      mkdirSync(dirname(cacheFile), { recursive: true });
      writeFileSync(cacheFile, JSON.stringify(out));
      return out;
    } catch (err) {
      if (attempt >= 4) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

// Run an async function over items with at most `n` running at once.
export async function pool(items, n, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}

// A small seeded random generator, so the human-check sample is reproducible.
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const words = (s) => s.split(/\s+/).filter(Boolean).length;
