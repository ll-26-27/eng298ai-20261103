// Shared helper for steps 04 and 05 (not a step itself): one structured-output
// call to OpenRouter, cached on disk, with token and cost accounting.
//
// The key is read from OPENROUTER_API_KEY (run with `node --env-file=.env ...`
// from the repo root). It is never printed or written anywhere.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// Read the Prompt section and the Schema block from 03-schema-prompt.md.
export function loadPromptAndSchema() {
  const md = readFileSync(join(HERE, '03-schema-prompt.md'), 'utf8');
  const prompt = md.split('## Prompt')[1].split('## Schema')[0].trim();
  const schema = JSON.parse(md.split('## Schema')[1].match(/```json\n([\s\S]*?)```/)[1]);
  return { prompt, schema };
}

// The user message for one change: both texts, the marked-up diff, and context.
export function changeMessage(c) {
  const marked = c.segments.map(([op, t]) => (op === '=' ? t : op === '-' ? `[-${t}-]` : `{+${t}+}`)).join(' ');
  return [
    `Change ${c.id}. Location: 1818 ${c.label1818}; 1831 ${c.label1831}.`,
    c.note ? `Note: ${c.note}` : '',
    `Context before (unchanged): ${c.contextBefore || '(none)'}`,
    `1818 text: ${c.before || '(nothing: this passage is new in 1831)'}`,
    `1831 text: ${c.after || '(nothing: this passage was removed in 1831)'}`,
    c.before && c.after ? `Diff: ${marked}` : '',
    `Context after (unchanged): ${c.contextAfter || '(none)'}`,
  ].filter(Boolean).join('\n\n');
}

export function validate(out, schema) {
  const cats = schema.properties.category.enum;
  const problems = [];
  if (!cats.includes(out.category)) problems.push(`bad category ${out.category}`);
  if (!Array.isArray(out.secondary) || out.secondary.some((s) => !cats.includes(s))) problems.push('bad secondary');
  if (!(Number.isInteger(out.significance) && out.significance >= 1 && out.significance <= 5)) problems.push('bad significance');
  if (!['low', 'medium', 'high'].includes(out.confidence)) problems.push('bad confidence');
  if (typeof out.rationale !== 'string' || !out.rationale.trim()) problems.push('empty rationale');
  return problems;
}

export async function categorize({ model, change, prompt, schema, cacheDir, stats }) {
  const userMsg = changeMessage(change);
  const hash = createHash('sha256').update(JSON.stringify([model, prompt, schema, userMsg])).digest('hex').slice(0, 16);
  const file = join(cacheDir, `${change.id}-${hash}.json`);
  (stats.used ??= new Set()).add(file);
  if (existsSync(file)) {
    stats.cached++;
    return JSON.parse(readFileSync(file, 'utf8')).result;
  }
  mkdirSync(cacheDir, { recursive: true });
  const body = {
    model,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: userMsg },
    ],
    response_format: { type: 'json_schema', json_schema: { name: 'change_category', strict: true, schema } },
    provider: { require_parameters: true },
    usage: { include: true },
    // no temperature: these models do not accept it on OpenRouter, and require_parameters would then find no endpoint
    max_tokens: 600,
  };
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json.error || json).slice(0, 300)}`);
      const u = json.usage || {};
      stats.calls++;
      stats.promptTokens += u.prompt_tokens || 0;
      stats.completionTokens += u.completion_tokens || 0;
      stats.cost += u.cost || 0;
      const text = json.choices[0].message.content;
      const result = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
      const problems = validate(result, schema);
      if (problems.length) throw new Error(`invalid output: ${problems.join('; ')}`);
      result.rationaleWords = result.rationale.split(/\s+/).filter(Boolean).length;
      writeFileSync(file, JSON.stringify({ model: json.model, provider: json.provider, usage: u, request: { system: 'see 03-schema-prompt.md', user: userMsg }, result }, null, 1));
      return result;
    } catch (e) {
      lastErr = e;
      stats.retries++;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  stats.failures++;
  return { error: String(lastErr.message || lastErr) };
}

export async function pool(items, n, fn) {
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const k = i++;
      await fn(items[k], k);
    }
  });
  await Promise.all(workers);
}

// Remove cached responses this run did not use (an older prompt, schema or diff),
// so the cache folder is exactly the audit trail for the current results.
export function pruneCache(cacheDir, stats) {
  if (!existsSync(cacheDir)) return 0;
  let n = 0;
  for (const f of readdirSync(cacheDir)) {
    if (!stats.used?.has(join(cacheDir, f))) { unlinkSync(join(cacheDir, f)); n++; }
  }
  return n;
}

export function newStats() {
  return { calls: 0, cached: 0, retries: 0, failures: 0, promptTokens: 0, completionTokens: 0, cost: 0 };
}

export function logRun(step, model, stats, extra = {}) {
  const { used, ...rest } = stats;
  const line = { at: new Date().toISOString(), step, model, ...rest, cost: +stats.cost.toFixed(5), ...extra };
  appendFileSync(join(HERE, 'cost-log.jsonl'), JSON.stringify(line) + '\n');
  return line;
}
