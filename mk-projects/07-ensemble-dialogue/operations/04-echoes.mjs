// Step 4 (script, deterministic): echoes and loops.
// - near-duplicates: any two agent messages whose word-trigram sets overlap by Jaccard ≥ 0.25 (≥ 0.5 is a near-copy)
//   (same agent: the room repeating itself; different agents: one restating another);
// - shared passages: runs of 8 identical words that appear in messages by 3 or more different agents
//   (mostly quotations of the course texts the bots were given, or of each other).
// → 04-echoes.json
//   node mk-projects/07-ensemble-dialogue/operations/04-echoes.mjs
import { loadDialogue, writeJSON, wordList } from './_lib.mjs';

const { msgs } = loadDialogue();
const A = msgs.filter((m) => m.kind === 'agent').map((m) => {
  const w = wordList(m.text);
  const tri = new Set(); for (let i = 0; i + 2 < w.length; i++) tri.add(w.slice(i, i + 3).join(' '));
  const oct = new Set(); for (let i = 0; i + 7 < w.length; i++) oct.add(w.slice(i, i + 8).join(' '));
  return { m, tri, oct };
});
const jacc = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
const clip = (s, k = 220) => { s = s.replace(/\s+/g, ' ').trim(); return s.length > k ? s.slice(0, k) + ' …' : s; };

const dups = [];
for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) {
  const s = jacc(A[i].tri, A[j].tri);
  if (s >= 0.25) dups.push({ a: A[i].m.n, b: A[j].m.n, a_speaker: A[i].m.speaker, b_speaker: A[j].m.speaker, same_speaker: A[i].m.speaker === A[j].m.speaker,
    similarity: +s.toFixed(2), minutes_apart: +(A[j].m.min - A[i].m.min).toFixed(1), a_time: A[i].m.time, b_time: A[j].m.time,
    a_text: clip(A[i].m.text), b_text: clip(A[j].m.text), same_thread: (A[i].m.thread || A[i].m.ts) === (A[j].m.thread || A[j].m.ts) });
}
dups.sort((x, y) => y.similarity - x.similarity);

// Shared 8-word passages across agents.
const where = new Map();
for (const { m, oct } of A) for (const g of oct) { if (!where.has(g)) where.set(g, []); where.get(g).push(m); }
const shared = [...where.entries()].map(([g, ms]) => ({ g, ms, agents: new Set(ms.map((m) => m.speaker)) })).filter((x) => x.agents.size >= 3);
// Merge overlapping 8-grams that occur in the same set of messages into one passage.
const seen = new Set(); const passages = [];
for (const x of shared.sort((a, b) => b.ms.length - a.ms.length)) {
  const sig = x.ms.map((m) => m.n).join(',');
  if (seen.has(sig)) continue; seen.add(sig);
  passages.push({ words: x.g, messages: x.ms.length, agents: [...x.agents], first_n: x.ms[0].n, first_speaker: x.ms[0].speaker, ns: x.ms.map((m) => m.n) });
}
const passagesTop = passages.slice(0, 40);

// Repeated openings (first five words) and form footers (a closing italic line naming the verse form).
const open = new Map();
for (const { m } of A) { const k = wordList(m.text).slice(0, 5).join(" "); if (!open.has(k)) open.set(k, []); open.get(k).push(m); }
const openings = [...open.entries()].filter(([, ms]) => ms.length >= 3).map(([k, ms]) => ({ opening: k, messages: ms.length, agents: [...new Set(ms.map((m) => m.speaker))], ns: ms.map((m) => m.n) })).sort((a, b) => b.messages - a.messages);
const FORM = /\b(sonnet|haiku|ghazal|villanelle|limerick|tanka|sestina|pantoum|couplet|quatrain|free verse|radif|qafia|abab|iamb)/i;
const footers = A.filter(({ m }) => { const last = m.text.trim().split("\n").filter((l) => !/^_Sources/.test(l)).at(-1) || ""; return /^[_*].*[_*]$/.test(last.trim()) && FORM.test(last); }).map(({ m }) => m);
const footerBy = {}; for (const m of footers) footerBy[m.speaker] = (footerBy[m.speaker] || 0) + 1;

const same = dups.filter((d) => d.same_speaker), cross = dups.filter((d) => !d.same_speaker);
const perAgent = {};
for (const d of same) perAgent[d.a_speaker] = (perAgent[d.a_speaker] || 0) + 1;
writeJSON('04-echoes.json', {
  note: 'Jaccard similarity of word trigrams (Sources lines removed); threshold 0.25 (0.5 and above is a near-copy).  Shared passages: identical 8-word runs in messages by 3+ agents.',
  near_duplicates: { total: dups.length, same_speaker: same.length, cross_speaker: cross.length, same_speaker_by_agent: perAgent, pairs: dups },
  shared_passages: passagesTop,
  repeated_openings: openings.slice(0, 30),
  form_footers: { messages: footers.length, by_agent: footerBy, ns: footers.map((m) => m.n) },
});
console.log(`pairs ≥0.25: ${dups.length} (same agent ${same.length}, across agents ${cross.length}); shared 8-word passages in 3+ agents: ${passages.length}`);
console.log(`form footers: ${footers.length} messages`, footerBy);
for (const o of openings.slice(0, 10)) console.log(` opening "${o.opening}" ${o.messages} msgs, ${o.agents.length} agents`);
console.log('same-agent repeats by agent:', perAgent);
for (const d of dups.slice(0, 8)) console.log(` #${d.a} ${d.a_speaker} / #${d.b} ${d.b_speaker} ${d.similarity} (${d.minutes_apart} min)`);
for (const p of passagesTop.slice(0, 8)) console.log(` "${p.words}" ${p.messages} msgs, ${p.agents.length} agents`);
