// Step 10 (deterministic code): gather every intermediate file into one data object and write it inline into
// outputs/index.html, so the page opens by double-click (browsers block fetch() of local files under file://).
// Run from the repo root: node mk-projects/02-frankenstein-translations/operations/10-build-page.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readJSON, parseCSV, ROOT, OPS } from "./lib/openrouter.mjs";

const csv = f => parseCSV(readFileSync(join(OPS, f), "utf8"));
const opt = (f, fallback) => (existsSync(join(OPS, f)) ? readJSON(join(OPS, f)) : fallback);

const inventory = csv("06b-translations-inventory.csv").map(r => ({
  ...r,
  year: r.year ? Number(String(r.year).slice(0, 4)) : null,
  lat: r.lat ? Number(r.lat) : null,
  lon: r.lon ? Number(r.lon) : null,
  // sources are stored as "label <url>" entries separated by " || "
  sources: r.sources.split("||").map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^(.*?)\s*<(https?:[^>]+)>$/);
    return m ? { label: m[1], url: m[2] } : { label: s, url: null };
  }),
}));

const costLines = existsSync(join(OPS, "costs.jsonl")) ? readFileSync(join(OPS, "costs.jsonl"), "utf8").trim().split("\n").map(l => JSON.parse(l)) : [];
const byModel = {};
for (const c of costLines) byModel[c.model] = (byModel[c.model] || 0) + (c.cost_usd || 0);

const data = {
  generated: new Date().toISOString().slice(0, 10),
  anchor: readJSON(join(ROOT, "inputs", "anchor-passage.json")),
  inventory,
  passages: opt("07-passages.json", { passages: [] }).passages,
  comparisons: opt("08-comparisons.json", { comparisons: [] }),
  chains: opt("09-chain.json", { chains: [] }).chains,
  draftVsVerified: existsSync(join(OPS, "06c-draft-vs-verified.csv")) ? csv("06c-draft-vs-verified.csv") : [],
  costs: { calls: costLines.length, total: costLines.reduce((s, c) => s + (c.cost_usd || 0), 0), byModel },
};

// ---------- the comparison at the centre (steps 1-5) ----------
// Just enough Markdown for our own prose files: paragraphs, ### headings, **bold**, *italic*, [links](url).
const md = t => t.replace(/^---[\s\S]*?---\s*/, "").trim().split(/\n\s*\n/).map(b => {
  const inline = x => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/\[(.+?)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  if (/^### /.test(b)) return `<h3>${inline(b.slice(4))}</h3>`;
  if (/^> /.test(b)) return `<blockquote class="contrast">${inline(b.replace(/^> ?/gm, ""))}</blockquote>`;
  return `<p>${inline(b)}</p>`;
}).join("\n");
const renderings = existsSync(join(OPS, "01-renderings.csv")) ? csv("01-renderings.csv") : [];
const conn = opt("03-connotations.json", { slots: [], readings: [] });
const checks = opt("02-quote-check.json", { results: [] }).results;
const synth = opt("04-synthesis.json", null);
const edited = existsSync(join(OPS, "04-synthesis-edited.md")) ? readFileSync(join(OPS, "04-synthesis-edited.md"), "utf8") : null;
const dict = opt("05-dictionary-checks.json", { checks: [] }).checks;
data.fiend = {
  why: md(readFileSync(join(OPS, "01-why-this-passage.md"), "utf8")).replace(/^<p>|<\/p>$/g, ""),
  passage: readJSON(join(ROOT, "inputs", "comparison-passage.json")),
  slots: conn.slots,
  // Copies flagged as probable unauthorised uploads are cited by edition only: their URLs stay in the CSV, not on the page.
  renderings: renderings.map(r => ({ ...r, source_url: r.source_flag ? "" : r.source_url, how_verified: r.source_flag ? r.how_verified.replace(/https?:\S+/g, "") : r.how_verified, reading: conn.readings.find(x => x.id === r.id) || null, check: (c => c && r.source_flag ? { ...c, method: "fetched the online copy (URL kept in 02-quote-check.json)" } : c)(checks.find(x => x.id === r.id) || null) })),
  perRendering: synth ? Object.fromEntries(synth.per_rendering.map(p => [p.id, p])) : {},
  synthesisHtml: edited ? md(edited) : synth ? synth.synthesis.map(p => `<p>${p.replace(/</g, "&lt;")}</p>`).join("") : "",
  synthesisNote: edited
    ? `Drafted by ${synth?.model || "a model"} from all ${synth?.renderings ?? ""} readings (step 4, <code>04-synthesis.json</code>), then edited by hand against the quoted texts (<code>04-synthesis-edited.md</code>). The draft's per-translation lines appear on each card above.`
    : "The model's draft (step 4), not yet edited by hand.",
  dictionary: dict,
};

const template = readFileSync(join(OPS, "10-page-template.html"), "utf8");
const json = JSON.stringify(data).replace(/</g, "\\u003c");
writeFileSync(join(ROOT, "outputs", "index.html"), template.replace("/*__DATA__*/null", json));
console.log(`-> outputs/index.html (${renderings.length} renderings of the plea; ${inventory.length} languages, ${data.passages.filter(p => p.text).length} passages, $${data.costs.total.toFixed(2)} spent so far)`);
