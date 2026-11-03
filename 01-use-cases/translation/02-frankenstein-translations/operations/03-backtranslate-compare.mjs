// Step 3 (model judgment, structured output): back-translate each located passage and categorize the changes.
// Input: 02-passages.json (and 04-chain.json if it exists, so the model-made translations get the same treatment).
// Output: 03-comparisons.json. Every "change" quotes both sides; a scholar should check the quotes against the texts.
// Run from the repo root: node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/03-backtranslate-compare.mjs
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { chat, readJSON, writeJSON, ROOT, OPS } from "./lib/openrouter.mjs";

const MODEL = "anthropic/claude-sonnet-5.5";
const CATEGORIES = ["omission", "addition", "intensification", "softening", "domestication", "shift in meaning"];
const instructions = readFileSync(join(OPS, "03-compare-prompt.md"), "utf8").replace(/^---[\s\S]*?---\s*/, "");
const anchor = readJSON(join(ROOT, "inputs", "anchor-passage.json"));

const schema = {
  type: "object", additionalProperties: false, required: ["back_translation", "changes", "note"],
  properties: {
    back_translation: { type: "string" },
    changes: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["shelley", "translation", "back_translation", "category", "rationale"],
        properties: {
          shelley: { type: "string", description: "Shelley's words, quoted exactly (empty string for an addition)" },
          translation: { type: "string", description: "The translator's words, quoted exactly (empty string for an omission)" },
          back_translation: { type: "string", description: "Your literal English for the translator's words" },
          category: { type: "string", enum: CATEGORIES },
          rationale: { type: "string", description: "One sentence" },
        },
      },
    },
    note: { type: "string" },
  },
};

const items = readJSON(join(OPS, "02-passages.json")).passages.filter(p => p.text);
if (existsSync(join(OPS, "04-chain.json"))) {
  for (const c of readJSON(join(OPS, "04-chain.json")).chains) {
    items.push({ id: `${c.id}-oneshot`, language: c.language, follows: "1818", text: c.one_shot });
    items.push({ id: `${c.id}-revised`, language: c.language, follows: "1818", text: c.revised });
  }
}

const out = [];
for (const p of items) {
  const english = anchor[`en-${p.follows === "1831" ? "1831" : "1818"}`].text;
  const { json } = await chat({
    step: `03-compare-${p.id}`, model: MODEL, schema, schemaName: "translation_comparison", maxTokens: 8000,
    messages: [
      { role: "system", content: instructions },
      { role: "user", content: `ENGLISH (Shelley, ${p.follows === "1831" ? "1831" : "1818"} text):\n"""\n${english}\n"""\n\n${p.language.toUpperCase()} TRANSLATION:\n"""\n${p.text}\n"""` },
    ],
  });
  // Deterministic check: does each quoted phrase actually occur in its text?
  const squash = s => s.replace(/\s+/g, " ").replace(/[’‘]/g, "'").toLowerCase();
  for (const ch of json.changes) {
    ch.shelley_quote_found = !ch.shelley || squash(english).includes(squash(ch.shelley));
    ch.translation_quote_found = !ch.translation || squash(p.text).includes(squash(ch.translation));
  }
  const bad = json.changes.filter(c => !c.shelley_quote_found || !c.translation_quote_found).length;
  console.log(`${p.id}: ${json.changes.length} changes${bad ? `, ${bad} with a quote not found verbatim` : ""}`);
  out.push({ id: p.id, language: p.language, model: MODEL, ...json });
}
writeJSON(join(OPS, "03-comparisons.json"), { categories: CATEGORIES, note: "Categories are an interpretive choice made for this exercise.", comparisons: out });
console.log("-> operations/03-comparisons.json");
