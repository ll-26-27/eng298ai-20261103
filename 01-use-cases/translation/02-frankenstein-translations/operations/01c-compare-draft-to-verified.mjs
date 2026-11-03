// Step 1c (deterministic code): line up what each model "remembered" in step 1a against the verified inventory from step 1b.
// A year counts as a match only if it is exactly the verified year; a translator matches if the verified surname appears in the guess.
// Output: 01c-draft-vs-verified.csv. Rows the research could not verify are compared but flagged, since there is no settled answer.
// Run from the repo root: node 01-use-cases/translation/02-frankenstein-translations/operations/01c-compare-draft-to-verified.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readJSON, parseCSV, toCSV, OPS } from "./lib/openrouter.mjs";

const inventory = parseCSV(readFileSync(join(OPS, "01b-translations-inventory.csv"), "utf8"));
const { drafts } = readJSON(join(OPS, "01a-model-draft.json"));
const fold = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const short = m => m.split("/")[1];

const rows = inventory.map(v => {
  const row = { language: v.language, verified_year: v.year, verified_translator: v.translator, status: v.status };
  for (const d of drafts) {
    const g = d.rows.find(r => fold(r.language).startsWith(fold(v.language).split(/[ /(]/)[0])) || {};
    const k = short(d.model);
    row[`${k}_year`] = g.year ?? "";
    row[`${k}_translator`] = g.translator ?? "";
    row[`${k}_confidence`] = g.confidence ?? "";
    const surname = fold(v.translator).replace(/\(.*?\)/g, "").trim().split(/[ ,]+/).filter(w => w.length > 2).pop() || "";
    row[`${k}_year_match`] = !g.year ? "no answer" : !v.year ? "nothing verified to compare" : String(g.year) === String(v.year).slice(0, 4) ? "yes" : "no";
    row[`${k}_translator_match`] = !g.translator ? "no answer" : !surname || /anonym|unknown|uncredited/.test(fold(v.translator)) ? "n/a" : fold(g.translator).includes(surname) ? "yes" : "no";
  }
  return row;
});
const cols = Object.keys(rows[0]);
writeFileSync(join(OPS, "01c-draft-vs-verified.csv"), toCSV(rows, cols));
for (const d of drafts) {
  const k = short(d.model);
  const answered = rows.filter(r => r[`${k}_year_match`] === "yes" || r[`${k}_year_match`] === "no");
  console.log(`${k}: ${answered.filter(r => r[`${k}_year_match`] === "yes").length} of ${answered.length} comparable years right; ${rows.filter(r => r[`${k}_year_match`] === "no answer").length} declined`);
}
console.log("-> operations/01c-draft-vs-verified.csv");
