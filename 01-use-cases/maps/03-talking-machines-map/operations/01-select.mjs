// Step 1 (deterministic code): select the candidates.
// Reads the timeline (maps/02-ai-and-literature-timeline)'s verified timeline (copied to ../inputs/03-events-verified.csv), its categorized
// events (copied to ../inputs/03-events-categorized.json, for the one-paragraph descriptions), and the
// 22 papers in context/LL-readings/papers-on-ai-md/ (their YAML front matter and the course's notes on
// each paper in papers-on-ai-notes.md). Writes 01-candidates.json. No model is called.
//
// Run from the repo root:
//   node 01-use-cases/maps/03-talking-machines-map/operations/01-select.mjs
//
// Which rows go in which layer is a choice, written down here so it can be argued with:
//   imagined  every event in 03's "made-beings" lane
//   readings  the course readings that are literary works (not the theory papers)
//   built     the conversational or speech machines in 03's "computing" lane (see EXCLUDED in 02-places.json)
//   trained   the 22 papers in the course's AI-papers folder

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const PAPERS_DIR = join(REPO, 'context', 'LL-readings', 'papers-on-ai-md');
const NOTES = join(REPO, 'context', 'LL-readings', 'papers-on-ai-notes.md');

const READINGS_LITERARY = ['plato-phaedrus', 'confucius-analects', 'shelley-frankenstein-1818', 'wilde-dorian-gray',
  'wilde-critic-as-artist', 'bergson-laughter', 'capek-rur', 'whale-frankenstein-film'];
const BUILT = ['eliza', 'shrdlu', 'parry', 'loebner-prize', 'siri', 'gpt-2', 'chatgpt', 'claude-release', 'gpt-4', 'claude-code'];

export function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// Minimal YAML front matter reader: scalars and simple lists, which is all these files use.
function frontMatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {}; let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) { key = kv[1]; const v = kv[2].trim(); out[key] = v === '' ? [] : v.replace(/^"|"$/g, ''); continue; }
    const li = line.match(/^\s+-\s+"?(.*?)"?\s*$/);
    if (li && key) { if (!Array.isArray(out[key])) out[key] = []; out[key].push(li[1]); }
  }
  return out;
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

async function main() {
  const events = parseCSV(await readFile(join(HERE, '..', 'inputs', '03-events-verified.csv'), 'utf8'));
  const cat = JSON.parse(await readFile(join(HERE, '..', 'inputs', '03-events-categorized.json'), 'utf8'));
  const desc = new Map(cat.events.map((e) => [e.id, e]));
  const base = (e, layer) => ({
    id: e.id, layer, title: e.title, date_display: e.date_display, year: Number(e.year), precision: e.precision,
    who: e.who, description: desc.get(e.id)?.description || '', why_it_matters: desc.get(e.id)?.why_it_matters || '',
    source_url: e.source_url, status: e.status, check_note: e.check_note, copyright: e.copyright,
    quote: e.quote, quote_attribution: e.quote_attribution, origin: 'the timeline (maps/02-ai-and-literature-timeline)',
  });

  const imagined = events.filter((e) => e.track === 'made-beings').map((e) => base(e, 'imagined'));
  const readings = events.filter((e) => READINGS_LITERARY.includes(e.id)).map((e) => base(e, 'readings'));
  const built = events.filter((e) => BUILT.includes(e.id)).map((e) => base(e, 'built'));

  // Papers: front matter from each Markdown file, plus the course's note on it.
  const notes = (await readFile(NOTES, 'utf8')).split('\n').filter((l) => l.startsWith('- **') && l.includes('“'));
  const trained = [];
  for (const f of (await readdir(PAPERS_DIR)).filter((f) => f.endsWith('.md')).sort()) {
    const fm = frontMatter(await readFile(join(PAPERS_DIR, f), 'utf8'));
    const want = norm(fm.title);
    const note = notes.find((l) => { const t = l.match(/“(.+?)”/); return t && norm(t[1]) === want; })
      || notes.find((l) => { const t = l.match(/“(.+?)”/); return t && norm(t[1]).startsWith(want.slice(0, 40)); });
    const ev = events.find((e) => (e.source_url || '').includes(fm.arxiv_id));
    trained.push({
      id: `paper-${fm.arxiv_id}`, layer: 'trained', arxiv: fm.arxiv_id, title: fm.title,
      authors: fm.authors, first_author: fm.authors?.[0] || '',
      who: `${fm.authors?.[0] || ''}${fm.authors?.length > 1 ? ' et al.' : ''}`,
      date_display: ev ? ev.date_display : `${fm.published.slice(0, 10)} (arXiv v1)`,
      year: Number(fm.year), precision: ev ? ev.precision : 'day',
      arxiv_published: fm.published,
      description: note ? note.replace(/^- \*\*.*?\*\*\s*/, '').trim() : '',
      why_it_matters: '',
      source_url: `https://arxiv.org/abs/${fm.arxiv_id}`, status: ev ? ev.status : 'from the papers folder',
      check_note: ev ? ev.check_note : '', copyright: 'in-copyright', quote: '', quote_attribution: '',
      origin: ev ? 'the timeline (maps/02-ai-and-literature-timeline) + papers folder' : 'papers folder', file: f,
    });
  }

  const out = { built_on: new Date().toISOString().slice(0, 10), source: 'the timeline (maps/02-ai-and-literature-timeline), 02-events-verified.csv (checked_on 2026-11-03); context/LL-readings/papers-on-ai-md',
    rules: { readings: READINGS_LITERARY, built: BUILT }, counts: { imagined: imagined.length, readings: readings.length, built: built.length, trained: trained.length },
    candidates: [...imagined, ...readings, ...built, ...trained] };
  await writeFile(join(HERE, '01-candidates.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('01-candidates.json:', out.counts, `${trained.filter((t) => !t.description).length} papers without a course note`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
