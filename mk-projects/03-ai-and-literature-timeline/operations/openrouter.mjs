// Shared helper for the model steps (01 and 03): one OpenRouter call, cached to disk,
// with tokens and cost appended to operations/cost-log.csv. Not a step of its own.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, appendFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cacheDir = join(here, "cache");
const costLog = join(here, "cost-log.csv");

export async function chat({ step, model, messages, response_format, max_tokens = 16000, temperature = 0.4, reasoning }) {
  const body = { model, messages, max_tokens, temperature, usage: { include: true } };
  if (reasoning) body.reasoning = reasoning;
  if (response_format) body.response_format = response_format;
  const key = createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 16);
  const cacheFile = join(cacheDir, `${step}-${key}.json`);
  await mkdir(cacheDir, { recursive: true });
  try {
    const cached = JSON.parse(await readFile(cacheFile, "utf8"));
    console.log(`[cache] ${step} ${model} -> ${cacheFile}`);
    return cached;
  } catch {}

  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set (run with node --env-file=.env from the repo root)");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const json = await res.json();
  await writeFile(cacheFile, JSON.stringify(json, null, 2));

  const u = json.usage || {};
  try { await access(costLog); } catch { await writeFile(costLog, "timestamp,step,model,prompt_tokens,completion_tokens,cost_usd\n"); }
  await appendFile(costLog, `${new Date().toISOString()},${step},${json.model || model},${u.prompt_tokens ?? ""},${u.completion_tokens ?? ""},${u.cost ?? ""}\n`);
  console.log(`[api] ${step} ${model}: ${u.prompt_tokens} in, ${u.completion_tokens} out, $${u.cost}`);
  return json;
}

export function content(json) {
  return json.choices?.[0]?.message?.content ?? "";
}

// Pull the first JSON value out of a reply (tolerates ```json fences).
export function parseJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[[{]/);
  return JSON.parse(raw.slice(start));
}
