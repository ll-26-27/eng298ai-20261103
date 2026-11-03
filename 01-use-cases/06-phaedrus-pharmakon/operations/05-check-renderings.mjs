// Step 5 (script, deterministic guardrail): confirm that every rendering step 4 extracted occurs verbatim
// in its passage. Exact match first; then ignoring case and whitespace (reported as "loose"); otherwise
// "NOT FOUND", which the page shows in red. It also records whether the translator kept one word for both
// occurrences of pharmakon (compared by the first four letters, so inflected forms count as the same word).
// This proves the words are the translator's; it does not prove they render the Greek slot they are filed under.
// The hand spot-check of that second question is in 05b-spot-check.md.
//
//   node mk-projects/06-phaedrus-pharmakon/operations/05-check-renderings.mjs

import { join } from "node:path";
import { OPS, readJSON, writeJSON } from "./lib/openrouter.mjs";
import { findLoose } from "./lib/text.mjs";

const { passages } = readJSON(join(OPS, "03-passages.json"));
const R = readJSON(join(OPS, "04-renderings.json"));
const byId = Object.fromEntries(passages.map(p => [p.id, p]));
const results = []; let bad = 0, total = 0;

const stem = s => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/^(the|a|an|un|une|le|la|l'|l’|ein|eine|einen|das|der|die|il|lo|el|uno|una)\s+/u, "").replace(/[^\p{L}]/gu, "").slice(0, 4);

for (const v of R.versions) {
  const text = byId[v.id].passage;
  const slots = {};
  for (const { key } of R.slots) {
    const r = v[key].rendering;
    total++;
    if (!r) { slots[key] = "omitted"; continue; }
    const f = findLoose(text, r);
    slots[key] = !f ? "NOT FOUND" : f.exact ? "exact" : "loose";
    if (!f) bad++;
  }
  const a = v.pharmakon_274e.rendering, b = v.pharmakon_275a.rendering;
  results.push({ id: v.id, slots, pharmakon_same_word: !!a && !!b && stem(a) === stem(b) });
}
writeJSON(join(OPS, "05-check.json"), { about: "Step 5: does each extracted rendering occur verbatim in its passage? exact / loose (case or whitespace differs) / NOT FOUND / omitted.", checked: total, not_found: bad, results });
console.log(`${total} renderings checked, ${bad} not found`);
for (const r of results) { const miss = Object.entries(r.slots).filter(([, s]) => s === "NOT FOUND").map(([k]) => k); if (miss.length) console.log(`  ${r.id}: NOT FOUND ${miss.join(", ")}`); }
