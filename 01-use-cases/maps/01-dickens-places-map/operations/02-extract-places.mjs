// Step 2 (model judgment): send every chunk to a model with the prompt in
// 02-extract-places.prompt.md and a strict JSON schema; save each answer to disk.
//
// Run from the repo root:
//   node --env-file=.env 01-use-cases/maps/01-dickens-places-map/operations/02-extract-places.mjs [slug ...]
// With no slugs it processes every novel. Answers are cached in data/cache/extract/, keyed by
// model and a hash of the prompt, so rerunning costs nothing unless you change the prompt or model.
// Writes data/02-places-raw.jsonl: one line per place mention, with its chunk's novel and chapter.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { chatJSON, logCost, pool } from './openrouter.mjs';
import { NOVELS } from './00-fetch-texts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, 'data');
export const MODEL = process.env.EXTRACT_MODEL || 'anthropic/claude-haiku-5.5';
const CONCURRENCY = 12;

async function loadPrompt() {
  const md = await readFile(join(HERE, '02-extract-places.prompt.md'), 'utf8');
  const prompt = md.split('<!-- PROMPT START -->')[1].split('<!-- PROMPT END -->')[0].trim();
  const schema = JSON.parse(md.split('```json')[1].split('```')[0]);
  return { prompt, schema };
}

async function main() {
  const { prompt, schema } = await loadPrompt();
  const hash = createHash('sha256').update(MODEL + prompt + JSON.stringify(schema)).digest('hex').slice(0, 10);
  const cacheDir = join(DATA, 'cache', 'extract', `${MODEL.replace(/[^\w.-]+/g, '_')}-${hash}`);
  await mkdir(cacheDir, { recursive: true });

  const wanted = process.argv.slice(2);
  const files = (await readdir(join(DATA, 'chunks'))).filter((f) => f.endsWith('.jsonl'));
  const chunks = [];
  for (const f of files) {
    const slug = f.replace('.jsonl', '');
    if (wanted.length && !wanted.includes(slug)) continue;
    for (const line of (await readFile(join(DATA, 'chunks', f), 'utf8')).split('\n').filter(Boolean)) chunks.push(JSON.parse(line));
  }
  console.log(`${chunks.length} chunks, model ${MODEL}, cache ${cacheDir}`);

  let requests = 0, cached = 0, pt = 0, ct = 0, cost = 0, failed = 0;
  await pool(chunks, CONCURRENCY, async (c) => {
    const path = join(cacheDir, `${c.id}.json`);
    try { JSON.parse(await readFile(path, 'utf8')); cached++; return; } catch {}
    const user = `Novel: ${c.title} (Charles Dickens)\n${c.chapter_label} (${c.heading}), part ${c.part}\n\nPASSAGE:\n${c.text}`;
    try {
      const r = await chatJSON({ model: MODEL, system: prompt, user, schemaName: 'places', schema });
      requests++;
      pt += r.usage.prompt_tokens || 0; ct += r.usage.completion_tokens || 0; cost += r.usage.cost || 0;
      await writeFile(path, JSON.stringify({ chunk: c.id, model: r.model, provider: r.provider, usage: r.usage, places: r.parsed.places }, null, 1));
      if ((requests + failed) % 25 === 0) console.log(`  ${requests} done, $${cost.toFixed(3)} so far`);
    } catch (e) {
      failed++;
      console.error(`  FAILED ${c.id}: ${e.message}`);
    }
  });
  if (requests) await logCost({ step: '02-extract-places', model: MODEL, requests, cached, prompt_tokens: pt, completion_tokens: ct, cost_usd: cost, note: wanted.join(' ') || 'all novels' });
  console.log(`requests ${requests}, cached ${cached}, failed ${failed}, tokens ${pt}+${ct}, cost $${cost.toFixed(4)}`);

  // Gather every cached answer (for every novel chunked so far) into one file for step 3.
  const all = [];
  for (const f of files) {
    for (const line of (await readFile(join(DATA, 'chunks', f), 'utf8')).split('\n').filter(Boolean)) {
      const c = JSON.parse(line);
      let ans;
      try { ans = JSON.parse(await readFile(join(cacheDir, `${c.id}.json`), 'utf8')); } catch { continue; }
      for (const p of ans.places) {
        all.push({ novel: c.novel, title: c.title, chunk: c.id, book: c.book, chapter: c.chapter, chapter_seq: c.chapter_seq, chapter_label: c.chapter_label, ...p });
      }
    }
  }
  await writeFile(join(DATA, '02-places-raw.jsonl'), all.map((r) => JSON.stringify(r)).join('\n') + '\n');
  console.log(`wrote ${all.length} place mentions to data/02-places-raw.jsonl`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
