// Step 5 (deterministic code): gather every intermediate file into one data object and write it inline into
// outputs/index.html, so the page opens by double-click (browsers block fetch() of local files under file://).
// Run from the repo root: node 01-use-cases/translation/02-frankenstein-translations/operations/05-build-page.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readJSON, parseCSV, ROOT, OPS } from "./lib/openrouter.mjs";

const csv = f => parseCSV(readFileSync(join(OPS, f), "utf8"));
const opt = (f, fallback) => (existsSync(join(OPS, f)) ? readJSON(join(OPS, f)) : fallback);

const inventory = csv("01b-translations-inventory.csv").map(r => ({
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
  passages: opt("02-passages.json", { passages: [] }).passages,
  comparisons: opt("03-comparisons.json", { comparisons: [] }),
  chains: opt("04-chain.json", { chains: [] }).chains,
  draftVsVerified: existsSync(join(OPS, "01c-draft-vs-verified.csv")) ? csv("01c-draft-vs-verified.csv") : [],
  costs: { calls: costLines.length, total: costLines.reduce((s, c) => s + (c.cost_usd || 0), 0), byModel },
};

const template = readFileSync(join(OPS, "05-page-template.html"), "utf8");
const json = JSON.stringify(data).replace(/</g, "\\u003c");
writeFileSync(join(ROOT, "outputs", "index.html"), template.replace("/*__DATA__*/null", json));
console.log(`-> outputs/index.html (${inventory.length} languages, ${data.passages.filter(p => p.text).length} passages, $${data.costs.total.toFixed(2)} spent so far)`);
