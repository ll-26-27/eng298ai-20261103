// Step 2 (script, deterministic): who spoke, how much, when, and the shape of the threads.
// → 02-agents.csv (one row per speaker), 02-threads.csv (one row per thread), 02-turns.json (both, plus 10-minute bins).
//   node 01-use-cases/simulation/03-ensemble-of-october-20/operations/02-turns.mjs
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OPS, loadDialogue, writeJSON, wordList, csv, threadsOf } from './_lib.mjs';

const { msgs, agents } = loadDialogue();
const BIN = 10, nBins = Math.ceil((msgs.at(-1).min + 0.01) / BIN);
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const threads = threadsOf(msgs);
const threadRows = threads.map((t) => ({
  parent_n: t[0].n, started_by: t[0].speaker, starter_kind: t[0].kind, start: t[0].time, end: t.at(-1).time,
  replies: t.length - 1, speakers: new Set(t.map((m) => m.speaker)).size, closed_by: t.at(-1).speaker,
  minutes: +(t.at(-1).min - t[0].min).toFixed(1),
}));

const speakers = [...new Set(msgs.map((m) => m.speaker))];
const agentRows = speakers.map((s) => {
  const mine = msgs.filter((m) => m.speaker === s);
  const w = mine.map((m) => wordList(m.text).length);
  const bins = Array(nBins).fill(0);
  for (const m of mine) bins[Math.floor(m.min / BIN)]++;
  const a = agents.find((x) => x.agent === s);
  return {
    speaker: s, kind: mine[0].kind, maker: a?.maker ?? '', model: a ? (a.model || 'room default') : '',
    turns: mine.length, channel_posts: mine.filter((m) => !m.thread).length, thread_replies: mine.filter((m) => m.thread).length,
    threads_started: threadRows.filter((t) => t.started_by === s).length, threads_closed: threadRows.filter((t) => t.closed_by === s).length,
    mean_words: Math.round(w.reduce((x, y) => x + y, 0) / w.length), median_words: median(w), max_words: Math.max(...w),
    first: mine[0].time, last: mine.at(-1).time, bins: bins.join(' '),
  };
}).sort((x, y) => y.turns - x.turns);

writeFileSync(join(OPS, '02-agents.csv'), csv(agentRows));
writeFileSync(join(OPS, '02-threads.csv'), csv(threadRows));
const roomBins = Array(nBins).fill(0); for (const m of msgs) roomBins[Math.floor(m.min / BIN)]++;
const tl = threadRows.map((t) => t.replies);
writeJSON('02-turns.json', {
  messages: msgs.length, start: msgs[0].time, end: msgs.at(-1).time, minutes: +msgs.at(-1).min.toFixed(1), bin_minutes: BIN, room_bins: roomBins,
  agents_in_table: agents.length, agents_spoke: agentRows.filter((r) => r.kind === 'agent').length,
  silent_agents: agents.filter((a) => !speakers.includes(a.agent)).map((a) => a.agent),
  channel_posts: msgs.filter((m) => !m.thread).length, thread_replies: msgs.filter((m) => m.thread).length,
  threads: { count: threads.length, median_replies: median(tl), max_replies: Math.max(...tl), started_by_humans: threadRows.filter((t) => t.starter_kind === 'human').length },
  agents: agentRows, thread_rows: threadRows,
});
console.log(`${msgs.length} messages, ${threads.length} threads (median ${median(tl)} replies, max ${Math.max(...tl)}); top speakers: ${agentRows.slice(0, 5).map((r) => `${r.speaker} ${r.turns}`).join(', ')}`);
