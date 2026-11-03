// Shared helper: one call to OpenRouter's chat completions endpoint with a JSON schema,
// plus a cost log. The key comes from the environment (node --env-file=.env ...) and is never printed.

import { appendFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const COST_LOG = join(HERE, 'cost-log.csv');

export async function chatJSON({ model, system, user, schemaName, schema, maxTokens = 4000, retries = 4 }) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY is not set. Run with: node --env-file=.env <script>');
  const body = {
    model,
    temperature: 0,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_schema', json_schema: { name: schemaName, strict: true, schema } },
    usage: { include: true },
  };
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'X-Title': 'ENGLISH 298AI Dickens places map',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data.error || data).slice(0, 300)}`);
      const content = data.choices?.[0]?.message?.content ?? '';
      const parsed = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, ''));
      return { parsed, usage: data.usage || {}, model: data.model, provider: data.provider };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt));
    }
  }
  throw lastErr;
}

export async function logCost(row) {
  let header = '';
  try { await access(COST_LOG); } catch { header = 'timestamp,step,model,requests,cached,prompt_tokens,completion_tokens,cost_usd,note\n'; }
  const line = [new Date().toISOString(), row.step, row.model, row.requests, row.cached, row.prompt_tokens, row.completion_tokens, row.cost_usd.toFixed(4), JSON.stringify(row.note || '')].join(',');
  await appendFile(COST_LOG, header + line + '\n');
}

// Run async tasks with a fixed number in flight at once.
export async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return results;
}
