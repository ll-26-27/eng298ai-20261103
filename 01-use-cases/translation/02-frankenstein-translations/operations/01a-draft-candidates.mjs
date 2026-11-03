// Step 1a (model judgment, no web): ask a model to draft the inventory from memory.
// The output, 01a-model-draft.json, is a list of LEADS. Step 1b checks every one against real sources,
// and step 1c compares the two so you can see where model memory was right and wrong.
// Run from the repo root: node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/01a-draft-candidates.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chat, writeJSON, OPS } from "./lib/openrouter.mjs";

// Two models, to show that "what the model remembers" depends on which model you ask.
const MODELS = ["anthropic/claude-sonnet-5.5", "google/gemini-3.8-flash"];
const prompt = readFileSync(join(OPS, "01a-draft-prompt.md"), "utf8").replace(/^---[\s\S]*?---\s*/, "");
const nul = t => ({ type: ["string", "null"] });

const schema = {
  type: "object", additionalProperties: false, required: ["rows"],
  properties: {
    rows: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["language", "year", "translator", "title", "place", "publisher", "source_text", "confidence"],
        properties: {
          language: { type: "string" },
          year: { type: ["integer", "null"] },
          translator: nul(), title: nul(), place: nul(), publisher: nul(),
          source_text: { type: "string", enum: ["1818", "1831", "unknown"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
  },
};

const drafts = [];
for (const model of MODELS) {
  const { json } = await chat({ step: "01a-draft", model, messages: [{ role: "user", content: prompt }], schema, schemaName: "draft_inventory", maxTokens: 6000 });
  drafts.push({ model, rows: json.rows });
  console.log(`${model}: ${json.rows.filter(r => r.year).length} of ${json.rows.length} languages given a year`);
}
writeJSON(join(OPS, "01a-model-draft.json"), { note: "Drafted from model memory with no web access. Leads, not facts.", drafts });
console.log("-> operations/01a-model-draft.json");
