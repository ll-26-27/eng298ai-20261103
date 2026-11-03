// Step 2c (deterministic code): apply the verdicts to the candidates.
// Reads 01-candidates.json and 02b-verdicts.json; writes 02-events-verified.csv (for people)
// and 02-events-verified.json (for step 3). A candidate with no verdict is marked unverified.
// Dropped events are kept in the CSV (so the record shows them) but not passed on.
// Quotations are removed from anything not marked public-domain.
//   node 01-use-cases/03-ai-and-literature-timeline/operations/02c-merge.mjs
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { events: candidates } = JSON.parse(await readFile(join(here, "01-candidates.json"), "utf8"));
const { verdicts, added, checked_on } = JSON.parse(await readFile(join(here, "02b-verdicts.json"), "utf8"));

const merged = [];
for (const c of candidates) {
  const v = verdicts[c.id] || { status: "unverified", checked: "", note: "No verdict recorded." };
  const fixed = { ...c, ...(v.fix || {}) };
  merged.push({
    ...fixed,
    origin: "drafted by model",
    status: v.status,
    checked: v.checked,
    check_note: v.note,
    corrected_fields: Object.keys(v.fix || {}).join(" "),
    drafted_date_display: c.date_display,
  });
}
for (const a of added) merged.push({ ...a, origin: "added at verification", check_note: a.note, corrected_fields: "", drafted_date_display: "" });

for (const e of merged) if (e.copyright !== "public-domain") { e.quote = ""; e.quote_attribution = ""; }

const cols = ["id", "track", "title", "date_display", "year", "precision", "who", "status", "corrected_fields", "drafted_date_display", "source_url", "checked", "check_note", "origin", "copyright", "quote", "quote_attribution"];
const esc = (x) => { const s = String(x ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = [cols.join(","), ...merged.map((e) => cols.map((k) => esc(e[k])).join(","))].join("\n") + "\n";
await writeFile(join(here, "02-events-verified.csv"), csv);

const keep = merged.filter((e) => e.status !== "dropped").sort((a, b) => a.year - b.year);
await writeFile(join(here, "02-events-verified.json"), JSON.stringify({ checked_on, count: keep.length, events: keep }, null, 2));

const tally = merged.reduce((t, e) => ((t[e.status] = (t[e.status] || 0) + 1), t), {});
const missing = candidates.filter((c) => !verdicts[c.id]).map((c) => c.id);
console.log(`${merged.length} rows (${candidates.length} drafted + ${added.length} added):`, tally);
if (missing.length) console.log("no verdict for:", missing.join(", "));
