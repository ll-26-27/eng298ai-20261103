// Step 3 (model judgment, structured output): for every verified rendering in 01-renderings.csv,
// back-translate it, fill the key-word slots with the translator's exact words and a sense from a fixed list,
// and note the connotations those words carry in their language. Code then checks that each copied word
// really occurs in the quoted translation.
// Output: 03-connotations.json. Run from the repo root:
//   node --env-file=.env mk-projects/02-frankenstein-translations/operations/03-connotations.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chat, readJSON, writeJSON, parseCSV, ROOT, OPS } from "./lib/openrouter.mjs";

const MODEL = "anthropic/claude-opus-5.5";
const instructions = readFileSync(join(OPS, "03-connotations-prompt.md"), "utf8").replace(/^---[\s\S]*?---\s*/, "");
const passage = readJSON(join(ROOT, "inputs", "comparison-passage.json"));

// The key words, Shelley's phrase for each, and the senses a rendering can fall into (an interpretive scheme).
export const SLOTS = [
  { key: "creature", shelley: "creature", senses: ["creature", "made thing / work", "child / offspring", "other"] },
  { key: "adam", shelley: "thy Adam", senses: ["Adam, named", "first man / generic", "other"] },
  { key: "fallen_angel", shelley: "the fallen angel", senses: ["fallen angel", "Satan / devil", "outcast", "other"] },
  { key: "drivest", shelley: "whom thou drivest from joy", senses: ["driven from joy / happiness", "driven from paradise", "deprived / excluded", "other"] },
  { key: "misdeed", shelley: "for no misdeed", senses: ["crime (legal)", "sin (religious)", "fault / wrong (moral)", "other"] },
  { key: "benevolent", shelley: "benevolent", senses: ["benevolent / well-wishing", "kind / gentle", "loving / tender", "other"] },
  { key: "misery", shelley: "misery", senses: ["misfortune / bad luck", "unhappiness", "suffering / pain", "wretchedness / abjection", "other"] },
  { key: "fiend", shelley: "a fiend", senses: ["devil / demon", "evil spirit / genius of evil", "monster", "villain / wicked person", "erased by paraphrase", "other"] },
  { key: "virtuous", shelley: "I shall again be virtuous", senses: ["virtuous", "good", "quiet / docile", "other"] },
];
const EXTRA = ["not in quote", "omitted"];

const slotSchema = s => ({
  type: "object", additionalProperties: false, required: ["rendering", "gloss", "sense"],
  properties: {
    rendering: { type: "string", description: "The translator's words, copied exactly; empty string if omitted or not in quote" },
    gloss: { type: "string", description: "Word-by-word literal English" },
    sense: { type: "string", enum: [...s.senses, ...EXTRA] },
  },
});
const schema = {
  type: "object", additionalProperties: false,
  required: ["back_translation", "slots", "connotations", "demonic_pitiable", "biblical_secular", "scales_reason"],
  properties: {
    back_translation: { type: "string" },
    slots: { type: "object", additionalProperties: false, required: SLOTS.map(s => s.key), properties: Object.fromEntries(SLOTS.map(s => [s.key, slotSchema(s)])) },
    connotations: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["word", "kind", "note", "check"],
        properties: {
          word: { type: "string", description: "The translator's word or phrase, exactly" },
          kind: { type: "string", enum: ["religious / biblical", "folkloric", "legal", "moral", "register / tone", "grammatical", "literary echo", "loss", "other"] },
          note: { type: "string", description: "One or two sentences" },
          check: { type: "boolean", description: "True if this is a claim about the word's history or usage that should be checked in a dictionary" },
        },
      },
    },
    demonic_pitiable: { type: "integer", minimum: -2, maximum: 2 },
    biblical_secular: { type: "integer", minimum: -2, maximum: 2 },
    scales_reason: { type: "string" },
  },
};

const rows = parseCSV(readFileSync(join(OPS, "01-renderings.csv"), "utf8"));
const fold = s => s.normalize("NFC").toLowerCase().replace(/[’‘ʼ]/g, "'").replace(/[«»“”„"]/g, '"').replace(/\s+/g, " ");
const out = [];
for (const r of rows) {
  const english = r.follows === "1831" ? passage["en-1831"] : passage["en-1818"];
  const { json } = await chat({
    step: `03-connotations-${r.id}`, model: MODEL, schema, schemaName: "rendering_reading", maxTokens: 6000,
    messages: [
      { role: "system", content: instructions },
      { role: "user", content: `ENGLISH (Shelley):\n"""\n${english}\n"""\n\nTRANSLATION: ${r.language}, ${r.translator}, first published ${r.year}${r.quote_scope === "key sentences" ? " (only the two key sentences are quoted)" : ""}.\n"""\n${r.quote}\n"""\n\nKnown notes on this translation: ${r.notes || "none"}` },
    ],
  });
  // Deterministic check: is every copied rendering really in the quoted text?
  for (const s of SLOTS) {
    const sl = json.slots[s.key];
    sl.found = !sl.rendering || fold(r.quote).includes(fold(sl.rendering));
  }
  for (const c of json.connotations) c.found = fold(r.quote).includes(fold(c.word));
  const bad = SLOTS.filter(s => !json.slots[s.key].found).length;
  console.log(`${r.id}: ${json.connotations.length} notes, demonic/pitiable ${json.demonic_pitiable}, biblical/secular ${json.biblical_secular}${bad ? `, ${bad} slot(s) NOT FOUND in the quote` : ""}`);
  out.push({ id: r.id, model: MODEL, ...json });
}
writeJSON(join(OPS, "03-connotations.json"), { slots: SLOTS, note: "Model readings (interpretation), checked only for whether each copied word occurs in the quote.", readings: out });
console.log("-> operations/03-connotations.json");
