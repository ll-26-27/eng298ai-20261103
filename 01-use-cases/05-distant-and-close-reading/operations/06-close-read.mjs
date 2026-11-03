// Step 6 (model judgment, stronger model): choose the strongest passages from step 3 and ask for a
// short close reading of each, then verify in code that every quotation occurs in the passage.
// Selection (deterministic): strength-3 passages first, then strength 2, at most PER_TEXT per text,
// never two within 3 passages of each other (so we read different scenes, not one scene twice).
// Writes operations/06-close-readings.json.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OPS, readJSON, writeJSON, chatJSON, pool } from './_lib.mjs';

export const MODEL = 'anthropic/claude-opus-5.5';
const PER_TEXT = 4;

const md = readFileSync(join(OPS, '06-close-read-prompt.md'), 'utf8');
const SYSTEM = md.match(/```text\n([\s\S]*?)\n```/)[1];
const SCHEMA = JSON.parse(md.match(/## The schema\s+```json\n([\s\S]*?)\n```/)[1]);

const { texts, chunks } = readJSON('01-chunks.json');
const { results } = readJSON('03-classifications.json');
const index = Object.fromEntries(chunks.map((c, i) => [c.id, i]));

const picked = [];
for (const t of texts) {
  const cands = chunks.filter((c) => c.text_id === t.id && results[c.id]?.is_instance && results[c.id].strength >= 2)
    .sort((a, b) => results[b.id].strength - results[a.id].strength || a.n - b.n);
  const mine = [];
  for (const c of cands) {
    if (mine.length >= PER_TEXT) break;
    if (mine.some((m) => Math.abs(m.n - c.n) <= 3)) continue;
    mine.push(c);
  }
  picked.push(...mine.sort((a, b) => a.n - b.n).map((c) => ({ c, t })));
}

const norm = (s) => s.toLowerCase().replace(/[“”"]/g, '"').replace(/[‘’']/g, "'").replace(/[—–-]+/g, '-').replace(/_/g, '').replace(/\s+/g, ' ').replace(/^[\s".,;:…]+|[\s".,;:…]+$/g, '').trim();
let spent = 0;
const readings = await pool(picked, 4, async ({ c, t }) => {
  const i = index[c.id];
  const before = chunks[i - 1]?.text_id === c.text_id ? chunks[i - 1].text : '(start of text)';
  const after = chunks[i + 1]?.text_id === c.text_id ? chunks[i + 1].text : '(end of text)';
  const user = `Work: ${t.title} (${t.author}, ${t.year})\nLocation: ${c.section}\n\n[CONTEXT: the passage before]\n${before}\n\n[THE PASSAGE TO READ CLOSELY]\n${c.text}\n\n[CONTEXT: the passage after]\n${after}`;
  const r = await chatJSON({ model: MODEL, step: '06-close-read', schema: SCHEMA, schemaName: 'close_reading', maxTokens: 4000,
    messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }] });
  if (!r.cached) spent += r.usage.cost || 0;
  const checked = r.result.quotations.map((q) => ({ q, found: norm(c.text).includes(norm(q)) }));
  console.log(`${c.id}  ${r.result.heading}  quotes ${checked.filter((x) => x.found).length}/${checked.length}`);
  return { id: c.id, model: r.model, ...r.result, quotations: checked };
});
writeJSON('06-close-readings.json', { model: MODEL, readings });
console.log(`${readings.length} close readings, $${spent.toFixed(4)} new spend → operations/06-close-readings.json`);
