// Step 1 (script, deterministic): turn the raw scrape into the two inputs the analysis reads.
// - Drops the morning test (everything before noon ET on October 20; the session opens at 2:15:08 p.m.).
// - Humans become roles (the two who posted during the session are instructors); agents keep their names.
// - Student names in the Airtable table become anonymous maker IDs; Slack file links and store IDs are dropped.
//   node 01-use-cases/simulation/03-ensemble-of-october-20/operations/01-clean.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = f => JSON.parse(readFileSync(join(HERE, "_raw", f), "utf8"));
const { messages: history } = raw("slack-history.json");
const { threads } = raw("slack-threads.json");
const users = raw("slack-users.json");
const { records } = raw("airtable-agents.json");

const CUT = Date.parse("2026-10-20T12:00:00-04:00") / 1000;
// The two instructors who posted during the session, by Slack user ID (IDs, not names, so no names live in this file).
const ROLE = { U02LLKE3QDR: "Convener", U0548P0B5PA: "Instructor" };
const role = id => {
  const u = users[id]; if (!u) return "Unknown";
  if (u.is_bot) return "Ensemble app";
  return ROLE[id] || "Participant";
};
const et = ts => new Date(Number(ts) * 1000).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: false });

const byTs = new Map();
for (const m of history) byTs.set(m.ts, m);
for (const t of Object.values(threads)) for (const m of t) byTs.set(m.ts, m);
const dialogue = [...byTs.values()]
  .filter(m => Number(m.ts) >= CUT)
  .sort((a, b) => Number(a.ts) - Number(b.ts))
  .map((m, i) => ({
    n: i + 1,
    ts: m.ts,
    time: et(m.ts),
    thread: m.thread_ts && m.thread_ts !== m.ts ? m.thread_ts : null,
    starts_thread: Boolean(m.reply_count),
    reply_count: m.reply_count || 0,
    speaker: m.username || role(m.user),
    kind: m.username ? "agent" : (users[m.user]?.is_bot ? "app" : "human"),
    text: (m.text || "").replace(/<@(U[A-Z0-9]+)>/g, (_, id) => `@${role(id)}`),
    reactions: (m.reactions || []).map(r => ({ name: r.name, count: r.count })),
  }));

const makers = new Map();
const agents = records.map(r => {
  const f = r.fields;
  const key = JSON.stringify(f.Student ?? null);
  if (!makers.has(key)) makers.set(key, `maker-${String(makers.size + 1).padStart(2, "0")}`);
  return {
    agent: f["Agent name"] ?? null, slug: f.Slug ?? null, maker: f.Student ? makers.get(key) : null,
    model: f.Model ?? null, triggers: f.Triggers ?? null, framing_prompt: f["Framing prompt"] ?? null,
    knowledge: f.Knowledge ?? null, studio_settings: f["Studio settings"] ?? null, notes: f.Notes ?? null,
    spoke: dialogue.filter(d => f["Agent name"] && d.speaker.toLowerCase() === f["Agent name"].toLowerCase()).length, // Slack shows "DUDU" for the agent named "Dudu"
  };
});

writeFileSync(join(HERE, "inputs", "dialogue.json"), JSON.stringify({
  channel: "C0CAJ44NHB7 (Bok AI Lab workspace)", date: "2026-10-20",
  note: "The AI Humanities Lab Ensemble, as scraped November 3, 2026. The morning test (10:39–11:05 a.m.) is removed; times are Eastern.",
  messages: dialogue }, null, 2));
writeFileSync(join(HERE, "inputs", "agents.json"), JSON.stringify({
  note: "The Airtable Agents table. Student names are replaced by anonymous maker IDs; Slack file links and vector-store IDs are dropped.",
  agents }, null, 2));
const speakers = new Set(dialogue.map(d => d.speaker));
console.log(`dialogue: ${dialogue.length} messages, ${dialogue[0].time}–${dialogue.at(-1).time}, ${speakers.size} speakers; agents: ${agents.length} (${agents.filter(a => a.spoke).length} spoke)`);
