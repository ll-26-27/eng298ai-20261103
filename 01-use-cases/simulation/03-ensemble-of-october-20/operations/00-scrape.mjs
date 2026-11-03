// Step 0 (script, deterministic, read-only): download every message and thread reply in the
// AI Humanities Lab Ensemble channel, the profiles of everyone who posted, and every record in the
// Airtable Agents table. Writes raw JSON to ../_raw/ (gitignored: it holds student names).
// Credentials come from the ensemble app's own .env (mk-chatbot-experiments/slack-ensemble/.env):
//   node --env-file=<path to slack-ensemble/.env> 01-use-cases/simulation/03-ensemble-of-october-20/operations/00-scrape.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAW = join(dirname(fileURLToPath(import.meta.url)), "..", "_raw");
mkdirSync(RAW, { recursive: true });
const CHANNEL = "C0CAJ44NHB7";
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function slack(method, params) {
  for (;;) {
    const res = await fetch(`https://slack.com/api/${method}?${new URLSearchParams(params)}`, {
      headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
    });
    if (res.status === 429) { await sleep((Number(res.headers.get("retry-after")) || 5) * 1000); continue; }
    const j = await res.json();
    if (!j.ok) throw new Error(`${method}: ${j.error}`);
    return j;
  }
}

async function all(method, params, key) {
  const out = []; let cursor;
  do {
    const j = await slack(method, { ...params, limit: 200, ...(cursor ? { cursor } : {}) });
    out.push(...j[key]); cursor = j.response_metadata?.next_cursor; await sleep(1200);
  } while (cursor);
  return out;
}

const history = await all("conversations.history", { channel: CHANNEL, oldest: 0 }, "messages");
console.log(`history: ${history.length} top-level messages`);
const threads = {};
for (const m of history.filter(m => m.reply_count)) {
  threads[m.ts] = await all("conversations.replies", { channel: CHANNEL, ts: m.ts }, "messages");
}
console.log(`threads: ${Object.keys(threads).length}, replies: ${Object.values(threads).reduce((n, t) => n + t.length - 1, 0)}`);

const ids = new Set();
for (const m of [...history, ...Object.values(threads).flat()]) if (m.user) ids.add(m.user);
const users = {};
for (const id of ids) { users[id] = (await slack("users.info", { user: id })).user; await sleep(300); }
console.log(`users: ${ids.size}`);

const records = []; let offset;
do {
  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}?${offset ? `offset=${offset}` : ""}`;
  const j = await fetch(url, { headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } }).then(r => r.json());
  if (j.error) throw new Error(`airtable: ${JSON.stringify(j.error)}`);
  records.push(...j.records); offset = j.offset;
} while (offset);
console.log(`airtable agents: ${records.length}`);

const stamp = new Date().toISOString();
writeFileSync(join(RAW, "slack-history.json"), JSON.stringify({ channel: CHANNEL, scraped_at: stamp, messages: history }, null, 2));
writeFileSync(join(RAW, "slack-threads.json"), JSON.stringify({ channel: CHANNEL, scraped_at: stamp, threads }, null, 2));
writeFileSync(join(RAW, "slack-users.json"), JSON.stringify(users, null, 2));
writeFileSync(join(RAW, "airtable-agents.json"), JSON.stringify({ scraped_at: stamp, records }, null, 2));
console.log(`wrote ${RAW}`);
