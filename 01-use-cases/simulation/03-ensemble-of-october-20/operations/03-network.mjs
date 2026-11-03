// Step 3 (script, deterministic): who answers whom.
// - reply edges: in each thread, every reply answers the message just before it (the parent, for the first reply);
// - mentions: an agent's name (or short name) in another agent's message; names shared by two agents
//   ("Creature", "Confucian mentor") go to whichever of the two posted most recently;
// - runs: stretches of a thread where two agents alternate (A B A or longer), the room's real conversations.
// → 03-edges.csv, 03-network.json
//   node 01-use-cases/simulation/03-ensemble-of-october-20/operations/03-network.mjs
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OPS, loadDialogue, writeJSON, csv, threadsOf } from './_lib.mjs';

const { msgs } = loadDialogue();
const agentMsgs = msgs.filter((m) => m.kind === 'agent');
const names = [...new Set(agentMsgs.map((m) => m.speaker))];
const threads = threadsOf(msgs);

// Name patterns. Literary names (Socrates, Lysias, the Creature) are also the course's characters, so a
// mention can mean the figure, not the bot; counts are an upper bound.
const ALIAS = [
  [['Socrates, on writing'], /\bSocrates\b/],
  [['The Creature', 'Creature'], /\bCreature\b/],
  [['A Confucian mentor', 'Confucian Mentor'], /\bConfucian [Mm]entor\b/],
  [['Confucius sonnet'], /\bConfucius sonnet\b/i],
  [['Victor Von Doom'], /\b(Von )?Doom\b/],
  [['Lysias'], /\bLysias\b/], [['Psychoanalyst'], /\bPsychoanalyst\b/], [['Corbu'], /\bCorbu\b/], [['Kimia'], /\bKimia\b/],
  [['Nate'], /\bNate\b/], [['Steve'], /\bSteve\b/], [['Philos'], /\bPhilos\b/], [['Dudu'], /\b(Dudu|DUDU)\b/], [['skrunkle'], /\bskrunkle\b/i],
  [['greedy'], /(@greedy\b|\b[Gg]reedy\b(?=[,:—–]))/], [['poet'], /(@poet\b|\bPoet\b(?=[,:—–]))/],
  [['Curious Robot'], /\bCurious Robot\b/i], [['The Lovely Monster'], /\bLovely Monster\b/i], [['Frankenstein Therapist'], /\bFrankenstein Therapist\b|\bTherapist\b/],
  [['Relationship Counsellor'], /\bRelationship Counsel/i], [['Course Readings Bot'], /\bCourse Readings\b/i], [['Famous AI Papers Bot'], /\bAI Papers\b/i],
];

const lastPost = new Map();
const mentions = [];
for (const m of msgs) {
  if (m.kind === 'agent') {
    const text = m.text.replace(/_Sources:[^\n]*/g, '');
    for (const [targets, re] of ALIAS) {
      if (!re.test(text)) continue;
      const cands = targets.filter((t) => t !== m.speaker && names.includes(t));
      if (!cands.length) continue;
      const t = cands.sort((a, b) => (lastPost.get(b) ?? -1) - (lastPost.get(a) ?? -1))[0];
      mentions.push({ n: m.n, from: m.speaker, to: t });
    }
  }
  lastPost.set(m.speaker, m.n);
}

const replies = [];
const runs = [];
for (const t of threads) {
  for (let i = 1; i < t.length; i++) if (t[i].speaker !== t[i - 1].speaker) replies.push({ n: t[i].n, from: t[i].speaker, to: t[i - 1].speaker, parent_n: t[0].n });
  // alternating runs
  let i = 0;
  while (i < t.length - 2) {
    const a = t[i].speaker, b = t[i + 1].speaker;
    let j = i + 1;
    if (a !== b) while (j + 1 < t.length && t[j + 1].speaker === t[j - 1].speaker) j++;
    if (j - i + 1 >= 3) { runs.push({ parent_n: t[0].n, pair: [a, b].sort(), from_n: t[i].n, to_n: t[j].n, length: j - i + 1 }); i = j; } else i++;
  }
}

const key = (a, b) => `${a}→${b}`;
const edges = new Map();
const bump = (from, to, field) => { const k = key(from, to); if (!edges.has(k)) edges.set(k, { from, to, replies: 0, mentions: 0 }); edges.get(k)[field]++; };
for (const r of replies) bump(r.from, r.to, 'replies');
for (const m of mentions) bump(m.from, m.to, 'mentions');
const edgeRows = [...edges.values()].sort((a, b) => b.replies + b.mentions - a.replies - a.mentions);

// Pairs, undirected: total replies both ways, reciprocity, and alternating runs.
const pairs = new Map();
for (const e of edgeRows) {
  const p = [e.from, e.to].sort().join(' ↔ ');
  if (!pairs.has(p)) pairs.set(p, { pair: p, a: [e.from, e.to].sort()[0], b: [e.from, e.to].sort()[1], replies: 0, a_to_b: 0, b_to_a: 0, mentions: 0, runs: 0, longest_run: 0 });
  const q = pairs.get(p);
  q.replies += e.replies; q.mentions += e.mentions;
  if (e.from === q.a) q.a_to_b += e.replies; else q.b_to_a += e.replies;
}
for (const r of runs) { const q = pairs.get(r.pair.join(' ↔ ')); if (q) { q.runs++; q.longest_run = Math.max(q.longest_run, r.length); } }
const pairRows = [...pairs.values()].map((q) => ({ ...q, reciprocity: Math.min(q.a_to_b, q.b_to_a) })).sort((x, y) => y.replies - x.replies);

// Per agent: how often it was answered, and how often it answered.
const speakers = [...new Set(msgs.map((m) => m.speaker))];
const nodes = speakers.map((s) => {
  const turns = msgs.filter((m) => m.speaker === s).length;
  const answered = replies.filter((r) => r.to === s).length;
  const gave = replies.filter((r) => r.from === s).length;
  const channelPosts = msgs.filter((m) => m.speaker === s && !m.thread);
  const unanswered = channelPosts.filter((m) => !m.starts_thread).length;
  return { id: s, kind: msgs.find((m) => m.speaker === s).kind, turns, answered_by_others: answered, answered_others: gave,
    answered_per_turn: +(answered / turns).toFixed(2), channel_posts: channelPosts.length, channel_posts_unanswered: unanswered,
    mentioned_by_others: mentions.filter((m) => m.to === s).length, mentioned_others: mentions.filter((m) => m.from === s).length };
}).sort((a, b) => b.turns - a.turns);

writeFileSync(join(OPS, '03-edges.csv'), csv(edgeRows));
writeJSON('03-network.json', { note: 'Reply edges: a thread reply answers the message before it. Mentions: name patterns, an upper bound (literary names double as bot names).', nodes, edges: edgeRows, pairs: pairRows, runs, mentions });
console.log(`${replies.length} reply edges, ${mentions.length} mentions, ${runs.length} alternating runs`);
console.log('top pairs:', pairRows.slice(0, 8).map((p) => `${p.pair} ${p.replies} (${p.a_to_b}/${p.b_to_a}) runs ${p.runs}`).join('; '));
console.log('least answered:', [...nodes].filter((n) => n.kind === 'agent').sort((a, b) => a.answered_per_turn - b.answered_per_turn).slice(0, 6).map((n) => `${n.id} ${n.answered_per_turn}`).join(', '));
console.log('most mentioned:', [...nodes].sort((a, b) => b.mentioned_by_others - a.mentioned_by_others).slice(0, 6).map((n) => `${n.id} ${n.mentioned_by_others}`).join(', '));
