// Step 4 (model judgment, structured output): one call that compares all the renderings at once.
// Input: 01-renderings.csv and 03-connotations.json. Output: 04-synthesis.json, the model's draft.
// A person then edits it into 04-synthesis-edited.md (checking every quotation against the renderings);
// the page shows the edited version and links the draft.
// Run from the repo root: node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/04-synthesize.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chat, readJSON, writeJSON, parseCSV, OPS } from "./lib/openrouter.mjs";

const MODEL = "anthropic/claude-opus-5.5";
const instructions = readFileSync(join(OPS, "04-synthesis-prompt.md"), "utf8").replace(/^---[\s\S]*?---\s*/, "");
const rows = parseCSV(readFileSync(join(OPS, "01-renderings.csv"), "utf8"));
const { readings } = readJSON(join(OPS, "03-connotations.json"));

const evidence = rows.map(r => {
  const x = readings.find(d => d.id === r.id);
  if (!x) return null;
  return {
    id: r.id, language: r.language, translator: r.translator, year: r.year, quote_scope: r.quote_scope, quote: r.quote,
    key_words: Object.fromEntries(Object.entries(x.slots).filter(([, v]) => v.sense !== "not in quote").map(([k, v]) => [k, `${v.rendering || "(omitted)"} = "${v.gloss}" [${v.sense}]`])),
    connotations: x.connotations.map(c => `${c.word}: ${c.note}`),
    demonic_pitiable: x.demonic_pitiable, biblical_secular: x.biblical_secular,
  };
}).filter(Boolean);

const schema = {
  type: "object", additionalProperties: false, required: ["synthesis", "per_rendering", "contrasts"],
  properties: {
    synthesis: { type: "array", items: { type: "string" }, description: "3 to 5 paragraphs" },
    per_rendering: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "highlighted", "muted"], properties: { id: { type: "string" }, highlighted: { type: "string" }, muted: { type: "string" } } } },
    contrasts: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "ids", "text"], properties: { title: { type: "string" }, ids: { type: "array", items: { type: "string" } }, text: { type: "string" } } } },
  },
};

const { json } = await chat({
  step: "04-synthesis", model: MODEL, schema, schemaName: "comparison", maxTokens: 12000,
  messages: [{ role: "system", content: instructions }, { role: "user", content: JSON.stringify(evidence, null, 1) }],
});
writeJSON(join(OPS, "04-synthesis.json"), { model: MODEL, renderings: evidence.length, ...json });
console.log(`-> operations/04-synthesis.json (${json.synthesis.length} paragraphs, ${json.contrasts.length} contrasts)`);
