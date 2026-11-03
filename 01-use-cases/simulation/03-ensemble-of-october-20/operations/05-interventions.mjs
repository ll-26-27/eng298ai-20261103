// Step 5 (script, deterministic): the four human messages, what answered them, and what changed after.
// For each: its thread (replies, who, how fast), and whether its key words spread: the share of agent
// messages containing them in the next 30 messages and in the rest of the session. Also the room's
// offstage events, visible only in the timing: when each agent first and last spoke, and the long pauses.
// → 05-interventions.json
//   node 01-use-cases/simulation/03-ensemble-of-october-20/operations/05-interventions.mjs
import { loadDialogue, writeJSON, wordList, threadsOf } from './_lib.mjs';

const { msgs } = loadDialogue();
const threads = threadsOf(msgs);
const STOP = new Set('i me my a an the and or to for of in on is it any some be as what should use need here hey in'.split(' '));
const share = (ms, words) => ms.length ? +(ms.filter((m) => words.some((w) => wordList(m.text).some((x) => x.startsWith(w)))).length / ms.length).toFixed(2) : null;

const humans = msgs.filter((m) => m.kind === 'human').map((h) => {
  const t = threads.find((t) => t[0].n === h.n) || [h];
  const replies = t.slice(1);
  const shown = [...new Set(wordList(h.text).filter((w) => !STOP.has(w) && w.length > 3))];
  const words = shown.map((w) => w.slice(0, 6)); // match by stem: relationship, relationships
  const after = msgs.filter((m) => m.kind === 'agent' && m.n > h.n);
  return {
    n: h.n, time: h.time, speaker: h.speaker, text: h.text, key_words: shown, key_stems: words,
    replies: replies.length, repliers: [...new Set(replies.map((m) => m.speaker))],
    first_reply_seconds: replies.length ? Math.round((replies[0].min - h.min) * 60) : null,
    thread_minutes: replies.length ? +(replies.at(-1).min - h.min).toFixed(1) : 0,
    key_word_share_next_30: share(after.slice(0, 30), words), key_word_share_rest: share(after.slice(30), words),
  };
});

const speakers = [...new Set(msgs.filter((m) => m.kind === 'agent').map((m) => m.speaker))];
const span = speakers.map((s) => { const mine = msgs.filter((m) => m.speaker === s); return { agent: s, first_n: mine[0].n, first: mine[0].time, last_n: mine.at(-1).n, last: mine.at(-1).time }; });
const gaps = [];
for (let i = 1; i < msgs.length; i++) { const g = (msgs[i].min - msgs[i - 1].min) * 60; if (g >= 90) gaps.push({ after_n: msgs[i - 1].n, from: msgs[i - 1].time, to: msgs[i].time, seconds: Math.round(g) }); }
const arrivedBy = (t) => span.filter((s) => s.first <= t).length;

writeJSON('05-interventions.json', {
  note: 'Humans posted four times, all in the first ten minutes; after 14:24:31 every message is an agent. Offstage changes (agents switched on or off in Airtable) show only as arrivals and departures.',
  humans, agent_spans: span.sort((a, b) => a.first_n - b.first_n), long_pauses: gaps,
  arrivals: { by_1420: arrivedBy('14:20:00'), by_1430: arrivedBy('14:30:00'), by_1445: arrivedBy('14:45:00') },
  last_agent_message_from_students: span.filter((s) => !['Socrates, on writing', 'The Creature'].includes(s.agent)).sort((a, b) => b.last_n - a.last_n)[0],
});
for (const h of humans) console.log(`#${h.n} ${h.time} ${h.speaker}: "${h.text}" → ${h.replies} replies from ${h.repliers.length} agents, first in ${h.first_reply_seconds}s; key words ${h.key_words.join('/')} share next 30 ${h.key_word_share_next_30}, rest ${h.key_word_share_rest}`);
console.log('arrivals', arrivedBy('14:20:00'), arrivedBy('14:30:00'), arrivedBy('14:45:00'), 'pauses ≥90s:', gaps.map((g) => `${g.from}–${g.to} (${g.seconds}s)`).join(', '));
