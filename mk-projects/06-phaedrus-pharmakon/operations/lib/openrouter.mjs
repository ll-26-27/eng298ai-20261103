// A small OpenRouter client shared by the numbered operations.
// - Reads OPENROUTER_API_KEY from the environment (run with `node --env-file=.env ...` from the repo root).
// - Caches every response on disk by a hash of the request, so a rerun costs nothing unless the prompt changes.
// - Appends tokens and cost for every live (uncached) call to operations/costs.jsonl.
// - With a JSON schema, asks for structured output and parses it.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const OPS = join(here, "..");
export const ROOT = join(OPS, "..");
const CACHE = join(OPS, "cache");
const COSTS = join(OPS, "costs.jsonl");

export async function chat({ step, model, messages, schema, schemaName = "result", temperature = 0, maxTokens = 4000, reasoning }) {
  const body = { model, messages, temperature, max_tokens: maxTokens, usage: { include: true } };
  if (reasoning) body.reasoning = reasoning; // e.g. { effort: "low" }
  if (schema) {
    body.response_format = { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } };
  }
  const key = createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 16);
  mkdirSync(CACHE, { recursive: true });
  const cacheFile = join(CACHE, `${step}-${key}.json`);

  let data;
  if (existsSync(cacheFile)) {
    data = JSON.parse(readFileSync(cacheFile, "utf8"));
  } else {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set: run from the repo root with node --env-file=.env");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 500)}`);
    data = await res.json();
    // Only cache complete answers: a reply cut off by max_tokens should be retried, not reused.
    if (data.choices?.[0]?.finish_reason !== "length") writeFileSync(cacheFile, JSON.stringify(data, null, 2));
    const u = data.usage || {};
    appendFileSync(COSTS, JSON.stringify({
      time: new Date().toISOString(), step, model: data.model || model,
      prompt_tokens: u.prompt_tokens, completion_tokens: u.completion_tokens, cost_usd: u.cost ?? null,
    }) + "\n");
  }
  const text = data.choices?.[0]?.message?.content ?? "";
  if (data.choices?.[0]?.finish_reason === "length") throw new Error(`${step}: reply cut off at max_tokens (${maxTokens}); raise maxTokens and rerun (the cut reply was not cached)`);
  if (!text.trim()) throw new Error(`${step}: empty reply from ${model}`);
  if (!schema) return { text, data };
  try {
    return { json: JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")), data };
  } catch (e) {
    throw new Error(`Could not parse structured output (${cacheFile}): ${text.slice(0, 300)}`);
  }
}

export function readJSON(p) { return JSON.parse(readFileSync(p, "utf8")); }
export function writeJSON(p, v) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 2) + "\n"); }

// Minimal CSV reader/writer (RFC 4180 quoting) so the scripts need no dependencies.
export function parseCSV(s) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [head, ...rest] = rows.filter(r => r.some(x => x !== ""));
  return rest.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}
export function toCSV(objs, cols) {
  const esc = v => { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  return [cols.join(","), ...objs.map(o => cols.map(c => esc(o[c])).join(","))].join("\n") + "\n";
}
