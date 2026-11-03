// Step 2 (script, deterministic): download every text listed in inputs/texts/manifest.json.
// Originals are saved byte for byte and never edited; later steps read them and write their own files.
// Existing files are kept, so a rerun only fetches what is missing (pass --force to refetch everything).
//
//   node 01-use-cases/06-phaedrus-pharmakon/operations/02-fetch-texts.mjs

import { existsSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT, readJSON, writeJSON } from "./lib/openrouter.mjs";

const TEXTS = join(ROOT, "inputs", "texts");
const manifestPath = join(TEXTS, "manifest.json");
const manifest = readJSON(manifestPath);
const force = process.argv.includes("--force");

for (const t of manifest.texts) {
  const out = join(TEXTS, t.file);
  if (existsSync(out) && !force) { console.log(`have   ${t.file} (${statSync(out).size} bytes)`); continue; }
  let res;
  try { res = await fetch(t.fetch_url, { headers: { "User-Agent": "eng298ai-use-case/1.0 (course example; contact via GitHub)" } }); }
  catch (e) { console.error(`FAILED ${t.id}: ${e.cause?.code || e.message} (rerun to retry)`); continue; }
  if (!res.ok) { console.error(`FAILED ${t.id}: HTTP ${res.status} ${t.fetch_url}`); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(out, buf);
  t.fetched = new Date().toISOString().slice(0, 10);
  t.bytes = buf.length;
  console.log(`got    ${t.file} (${buf.length} bytes)`);
}
writeJSON(manifestPath, manifest);
