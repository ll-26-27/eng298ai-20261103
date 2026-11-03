// Step 4 (script, model judgment with a strict JSON schema): for every located passage, the words the
// translator uses for pharmakon (twice), mnēmē (twice), hypomnēsis, sophia (twice, the second as "the
// seeming of wisdom") and doxosophoi, with a literal gloss and, for pharmakon, a category from a fixed list.
// The instructions are read from 04-extract-prompt.md so the prompt students read is the one that ran.
//
//   node --env-file=.env 01-use-cases/06-phaedrus-pharmakon/operations/04-extract-renderings.mjs

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, OPS, chat, readJSON, writeJSON } from "./lib/openrouter.mjs";

const MODEL = "anthropic/claude-sonnet-5.5";
export const CATEGORIES = ["remedy/medicine", "drug", "poison", "elixir/potion", "recipe/prescription", "specific", "means/aid", "kept the Greek word", "other", "not translated"];
export const SLOTS = [
  ["pharmakon_274e", "φάρμακον in Theuth's claim at 274e: μνήμης τε γὰρ καὶ σοφίας φάρμακον ηὑρέθη"],
  ["mneme_274e", "μνήμης in Theuth's claim at 274e"],
  ["sophia_274e", "σοφίας in Theuth's claim at 274e"],
  ["pharmakon_275a", "φάρμακον in Thamus's reply at 275a: οὔκουν μνήμης ἀλλὰ ὑπομνήσεως φάρμακον ηὗρες"],
  ["mneme_275a", "μνήμης in Thamus's reply at 275a (not of memory …)"],
  ["hypomnesis_275a", "ὑπομνήσεως in Thamus's reply at 275a (… but of reminding)"],
  ["sophia_275a", "σοφίας … δόξαν at 275a: σοφίας δὲ τοῖς μαθηταῖς δόξαν, οὐκ ἀλήθειαν (the seeming of wisdom, not its truth): give the words for the whole idea 'seeming/reputation of wisdom'"],
  ["doxosophoi_275b", "δοξόσοφοι at 275b: δοξόσοφοι γεγονότες ἀντὶ σοφῶν (wise-seeming instead of wise)"],
];

const md = readFileSync(join(OPS, "04-extract-prompt.md"), "utf8");
const SYSTEM = md.split("## The instructions (system message)")[1].split("\n## ")[0].trim()
  + "\n\nThe pharmakon categories:\n" + md.split("## The pharmakon categories")[1].trim();

const slotSchema = (withCategory) => ({
  type: "object", additionalProperties: false,
  required: withCategory ? ["rendering", "gloss", "category", "note"] : ["rendering", "gloss", "note"],
  properties: {
    rendering: { type: "string", description: "the translator's words, copied exactly from the translation; '' if omitted" },
    gloss: { type: "string", description: "literal English gloss of the rendering" },
    ...(withCategory ? { category: { type: "string", enum: CATEGORIES } } : {}),
    note: { type: "string", description: "anything a reader should know; '' if nothing" },
  },
});
const schema = {
  type: "object", additionalProperties: false,
  required: [...SLOTS.map(s => s[0]), "argument"],
  properties: {
    ...Object.fromEntries(SLOTS.map(([k]) => [k, slotSchema(k.startsWith("pharmakon"))])),
    argument: { type: "string", description: "two or three sentences: what these choices do to the argument between Theuth and Thamus" },
  },
};

const manifest = readJSON(join(ROOT, "inputs", "texts", "manifest.json"));
const meta = Object.fromEntries(manifest.texts.map(t => [t.id, t]));
const { passages } = readJSON(join(OPS, "03-passages.json"));
const greek = passages.find(p => p.id === "grc-burnet").passage;
const out = [];

for (const p of passages) {
  if (!p.ok || p.id === "grc-burnet") continue;
  const t = meta[p.id];
  const slotList = SLOTS.map(([k, d]) => `- ${k}: ${d}`).join("\n");
  const { json } = await chat({
    step: `04-extract-${p.id}`, model: MODEL, schema, schemaName: "renderings", maxTokens: 3000,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `GREEK (Burnet), Phaedrus 274c–275b:\n${greek}\n\nTRANSLATION: ${t.language}, ${t.translator} (${t.year}):\n${p.passage}\n\nThe slots:\n${slotList}` },
    ],
  });
  out.push({ id: p.id, model: MODEL, ...json });
  console.log(`${p.id}: pharmakon = "${json.pharmakon_274e.rendering}" / "${json.pharmakon_275a.rendering}" (${json.pharmakon_274e.category}, ${json.pharmakon_275a.category})`);
}

writeJSON(join(OPS, "04-renderings.json"), { about: "Step 4 output: each translator's renderings of the key words, extracted by a model (judgment, not fact). Step 5 checks every rendering against its passage.", model: MODEL, categories: CATEGORIES, slots: SLOTS.map(([key, describe]) => ({ key, describe })), versions: out });
