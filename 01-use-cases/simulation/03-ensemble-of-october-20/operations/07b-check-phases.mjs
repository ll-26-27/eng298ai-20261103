// Step 7b (check, deterministic): do the model's phases tile the session, does each piece of evidence
// fall inside its phase, and what do the plain numbers say about each phase (pace, voices, verse)?
// → 07b-phases-checked.json
//   node 01-use-cases/simulation/03-ensemble-of-october-20/operations/07b-check-phases.mjs
import { loadDialogue, readJSON, writeJSON, wordList } from './_lib.mjs';

const { msgs } = loadDialogue();
const { phases, model } = readJSON('07-phases.json');
const { form_footers } = readJSON('04-echoes.json');
const footer = new Set(form_footers.ns);
const problems = [];
if (phases[0].start_n !== 1) problems.push('first phase does not start at #1');
if (phases.at(-1).end_n !== msgs.length) problems.push(`last phase does not end at #${msgs.length}`);
const out = phases.map((p, i) => {
  if (i && p.start_n !== phases[i - 1].end_n + 1) problems.push(`gap or overlap before phase ${i + 1}`);
  const ms = msgs.filter((m) => m.n >= p.start_n && m.n <= p.end_n);
  const outside = p.evidence.filter((e) => e.n < p.start_n || e.n > p.end_n).map((e) => e.n);
  if (outside.length) problems.push(`phase ${i + 1}: evidence outside span ${outside.join(', ')}`);
  const count = {}; for (const m of ms) if (m.kind === 'agent') count[m.speaker] = (count[m.speaker] || 0) + 1;
  const agentMs = ms.filter((m) => m.kind === 'agent');
  return { ...p, start: ms[0].time, end: ms.at(-1).time, start_min: +ms[0].min.toFixed(2), end_min: +ms.at(-1).min.toFixed(2),
    messages: ms.length, per_minute: +(ms.length / Math.max(1, ms.at(-1).min - ms[0].min)).toFixed(1), voices: Object.keys(count).length,
    top_voices: Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s, c]) => ({ speaker: s, turns: c })),
    verse_share: +(agentMs.filter((m) => footer.has(m.n)).length / Math.max(1, agentMs.length)).toFixed(2),
    mean_words: Math.round(agentMs.reduce((s, m) => s + wordList(m.text).length, 0) / Math.max(1, agentMs.length)),
    evidence_outside_span: outside };
});
writeJSON('07b-phases-checked.json', { model, problems, phases: out });
console.log(problems.length ? problems : 'phases tile #1–#' + msgs.length + '; all evidence inside its phase');
for (const p of out) console.log(`${p.start}–${p.end} ${p.title}: ${p.messages} msgs, ${p.per_minute}/min, ${p.voices} voices, verse ${p.verse_share}, top ${p.top_voices.map((v) => v.speaker).join(', ')}`);
