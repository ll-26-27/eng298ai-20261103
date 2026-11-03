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
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'ENG298AI ensemble dialogue' },
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

// ---- The ensemble dialogue: shared loaders ------------------------------------------
// Messages with a canonical speaker name (Slack showed the agent "Dudu" as "DUDU"),
// a minute offset from the start, and the agent table restricted to named rows.
export function loadDialogue() {
  const { messages } = JSON.parse(readFileSync(join(INPUTS, 'dialogue.json'), 'utf8'));
  const { agents } = JSON.parse(readFileSync(join(INPUTS, 'agents.json'), 'utf8'));
  const named = agents.filter((a) => a.agent);
  const canon = new Map(named.map((a) => [a.agent.toLowerCase(), a.agent]));
  const sec = (t) => { const [h, m, s] = t.split(':').map(Number); return h * 3600 + m * 60 + s; };
  const t0 = sec(messages[0].time);
  const msgs = messages.map((m) => ({ ...m, speaker: canon.get(m.speaker.toLowerCase()) || m.speaker, min: (sec(m.time) - t0) / 60 }));
  return { msgs, agents: named, byN: new Map(msgs.map((m) => [m.n, m])) };
}

// One line per message for a model to read: number, time, speaker, where it sits, text (clipped).
export function transcriptLines(msgs, clip = 280) {
  const parentN = new Map(msgs.filter((m) => !m.thread).map((m) => [m.ts, m.n]));
  return msgs.map((m) => {
    const where = m.thread ? `reply in thread of #${parentN.get(m.thread) ?? '?'}` : 'channel';
    let t = m.text.replace(/\s+/g, ' ').trim();
    if (t.length > clip) t = t.slice(0, clip) + ' …';
    return `#${m.n} ${m.time} ${m.speaker} (${where}): ${t}`;
  }).join('\n');
}

export const wordList = (s) => s.toLowerCase().replace(/_sources:[^\n]*/g, '').replace(/[’‘]/g, "'").replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean);
export const csv = (rows) => {
  const cols = Object.keys(rows[0]);
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
};
// Threads in order: the parent message, then its replies in time order.
export function threadsOf(msgs) {
  const byTs = new Map(msgs.map((m) => [m.ts, m]));
  const out = new Map();
  for (const m of msgs) if (m.thread) {
    if (!out.has(m.thread)) out.set(m.thread, [byTs.get(m.thread)].filter(Boolean));
    out.get(m.thread).push(m);
  }
  return [...out.values()].filter((t) => t.length > 1 && !t[0].thread);
}
