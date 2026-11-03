// Step 9 (script, deterministic): gather steps 2–8 into one small summary for the page and the essay.
// → 09-summary.json
//   node mk-projects/07-ensemble-dialogue/operations/09-summary.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { OPS, loadDialogue, readJSON, writeJSON } from './_lib.mjs';

const { msgs, agents } = loadDialogue();
const turns = readJSON('02-turns.json');
const net = readJSON('03-network.json');
const echoes = readJSON('04-echoes.json');
const inter = readJSON('05-interventions.json');
const personas = readJSON('06-personas.json');
const phases = readJSON('07b-phases-checked.json');
const motifs = readJSON('08-motifs.json');
let cost = 0;
if (existsSync(join(OPS, 'cost-log.jsonl'))) for (const l of readFileSync(join(OPS, 'cost-log.jsonl'), 'utf8').trim().split('\n')) cost += JSON.parse(l).cost || 0;

const agentRows = turns.agents.map((r) => {
  const p = personas.personas.find((x) => x.agent === r.speaker);
  const nd = net.nodes.find((x) => x.id === r.speaker);
  const a = agents.find((x) => x.agent === r.speaker);
  return { speaker: r.speaker, kind: r.kind, maker: r.maker, model: r.model, turns: r.turns, channel_posts: r.channel_posts, thread_replies: r.thread_replies,
    threads_started: r.threads_started, mean_words: r.mean_words, first: r.first, last: r.last, bins: r.bins.split(' ').map(Number),
    answered_by_others: nd?.answered_by_others ?? 0, answered_others: nd?.answered_others ?? 0, answered_per_turn: nd?.answered_per_turn ?? 0,
    verse_footers: echoes.form_footers.by_agent[r.speaker] || 0, triggers: a?.triggers || null,
    prompt_summary: p?.prompt_summary ?? null, intended_voice: p?.intended_voice ?? null, verdict: p?.verdict ?? null, fidelity: p?.fidelity ?? null,
    what_it_did: p?.what_it_did ?? null, drift_toward: p?.drift_toward ?? null, persona_evidence: p?.evidence ?? [] };
});

const strongest = net.pairs.slice(0, 12).map(({ a, b, replies, a_to_b, b_to_a, reciprocity, runs, longest_run }) => ({ a, b, replies, a_to_b, b_to_a, reciprocity, runs, longest_run }));
writeJSON('09-summary.json', {
  title: 'The AI Humanities Lab Ensemble, October 20, 2026',
  session: { date: '2026-10-20', start: turns.start, end: turns.end, minutes: turns.minutes, messages: turns.messages, channel_posts: turns.channel_posts, thread_replies: turns.thread_replies,
    threads: turns.threads, agents_in_table: turns.agents_in_table, agents_spoke: turns.agents_spoke, silent_agents: turns.silent_agents, room_bins: turns.room_bins, bin_minutes: turns.bin_minutes,
    human_messages: inter.humans.length, last_human: inter.humans.at(-1).time, long_pauses: inter.long_pauses,
    last_student_agent: inter.last_agent_message_from_students },
  headlines: {
    example_agents_share: +((turns.agents[0].turns + turns.agents[1].turns) / turns.messages).toFixed(2),
    verse_footer_messages: echoes.form_footers.messages, verse_footer_agents: Object.keys(echoes.form_footers.by_agent).length,
    near_copies: echoes.near_duplicates.pairs.filter((p) => p.similarity >= 0.5).length,
    reply_edges: net.edges.reduce((s, e) => s + e.replies, 0), alternating_runs: net.runs.length,
  },
  agents: agentRows,
  phases: phases.phases.map(({ title, start_n, end_n, start, end, start_min, end_min, mood, summary, evidence, messages, per_minute, voices, top_voices, verse_share, mean_words }) => ({ title, start_n, end_n, start, end, start_min, end_min, mood, summary, evidence, messages, per_minute, voices, top_voices, verse_share, mean_words })),
  phase_check: phases.problems,
  network: { edges: net.edges.filter((e) => e.replies > 0).map(({ from, to, replies }) => ({ from, to, replies })), strongest_pairs: strongest,
    least_answered: net.nodes.filter((n) => n.kind === 'agent').sort((a, b) => a.answered_per_turn - b.answered_per_turn).slice(0, 6).map(({ id, turns, answered_by_others, answered_per_turn }) => ({ id, turns, answered_by_others, answered_per_turn })),
    longest_runs: [...net.runs].sort((a, b) => b.length - a.length).slice(0, 8) },
  interventions: inter.humans,
  echoes: { near_copies: echoes.near_duplicates.pairs, form_footers: { messages: echoes.form_footers.messages, by_agent: echoes.form_footers.by_agent },
    repeated_openings: echoes.repeated_openings.slice(0, 12), shared_passages: echoes.shared_passages.slice(0, 8).map(({ words, messages, agents }) => ({ words, messages, agents: agents.length })) },
  motifs: motifs.motifs.map(({ name, kind, description, search_terms, messages, agents, examples }) => ({ name, kind, description, search_terms, messages, agents, examples })),
  models: { personas: personas.model, phases: phases.model, motifs: motifs.model }, cost_usd: +cost.toFixed(2),
});
console.log(`summary written; logged model cost $${cost.toFixed(2)}`);
