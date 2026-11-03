// Step 7 (model-assisted, then checked by code): find the anchor passage in each translation.
// The model reads the translated text and returns the passage's first and last words VERBATIM.
// Code then searches for those words in the file and cuts out the passage itself, so the text we keep
// is always the translator's, never the model's paraphrase. If the words aren't found, the row fails loudly.
// Run from the repo root: node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/07-locate-passage.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chat, readJSON, writeJSON, ROOT, OPS } from "./lib/openrouter.mjs";

const MODEL = "google/gemini-3.8-flash"; // long context, cheap; it only points, it doesn't write the passage
const MAX_CHARS = 300_000; // longer files are narrowed to the stretch where the passage must fall (see below)

const dir = join(ROOT, "inputs", "texts");
const { texts } = readJSON(join(dir, "manifest.json"));
const anchor = readJSON(join(ROOT, "inputs", "anchor-passage.json"));

const schema = {
  type: "object", additionalProperties: false,
  required: ["found", "chapter_heading", "first_words", "last_words", "comment"],
  properties: {
    found: { type: "boolean" },
    chapter_heading: { type: ["string", "null"], description: "The nearest chapter heading above the passage, verbatim" },
    first_words: { type: "string", description: "The first 8-12 words of the corresponding passage, copied exactly as they appear in the text" },
    last_words: { type: "string", description: "The last 8-12 words of the corresponding passage, copied exactly" },
    comment: { type: "string", description: "One sentence: how sure you are, and anything odd (OCR errors, the passage split or abridged)" },
  },
};

// Whitespace and line breaks differ between OCR and our search strings, so match on a normalized copy
// and map positions back to the original.
function normalize(s) {
  let out = "", map = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (/\s/.test(c)) { if (out && out[out.length - 1] !== " ") { out += " "; map.push(i); } }
    else { out += c; map.push(i); }
  }
  return { out, map };
}

const results = [];
const previous = (() => { try { return readJSON(join(OPS, "07-passages.json")).passages; } catch { return []; } })();

for (const t of texts.filter(t => t.language !== "English")) {
  let raw = readFileSync(join(dir, t.file), "utf8").replace(/\r/g, "");
  let offset = 0, window = "whole file";
  if (raw.length > MAX_CHARS) {
    // The awakening falls about 20% of the way into the novel; send the 5%-50% stretch.
    offset = Math.floor(raw.length * 0.05);
    raw = raw.slice(offset, Math.floor(raw.length * 0.5));
    window = "5%-50% of the file";
  }
  const english = anchor[`en-${t.follows || "1818"}`].text;
  const prompt = `Below is the full text of a ${t.language} translation of Mary Shelley's Frankenstein (${t.edition}).

Find the passage that corresponds to this English passage (the creature's awakening):

"""
${english}
"""

The translation may abridge, reorder, or paraphrase. Return the first and last words of the corresponding passage copied EXACTLY, character for character, from the text below (keep its spelling, accents, punctuation and any OCR errors). If the translation has no corresponding passage, set found to false.

TEXT:
"""
${raw}
"""`;
  const { json } = await chat({ step: `07-locate-${t.id}`, model: MODEL, messages: [{ role: "user", content: prompt }], schema, schemaName: "passage_location", maxTokens: 4000, reasoning: { effort: "low" } });

  const full = readFileSync(join(dir, t.file), "utf8").replace(/\r/g, "");
  const n = normalize(full);
  const a = json.found ? n.out.indexOf(normalize(json.first_words).out) : -1;
  const lastN = normalize(json.last_words).out;
  const b = a >= 0 ? n.out.indexOf(lastN, a) : -1;
  const row = { id: t.id, language: t.language, edition: t.edition, source_page: t.page, copyright: t.copyright, follows: t.follows || "unknown", model: MODEL, window, model_says: json };
  if (a < 0 || b < 0) {
    row.status = json.found ? "model pointed to words that are not in the file: check by hand" : "model found no corresponding passage";
    console.log(`${t.id}: ${row.status}`);
  } else {
    const start = n.map[a], end = n.map[b + lastN.length - 1] + 1;
    row.status = "located and verified by exact match";
    row.line_start = full.slice(0, start).split("\n").length;
    row.line_end = full.slice(0, end).split("\n").length;
    row.text = full.slice(start, end).split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, " ").trim()).join("\n\n");
    console.log(`${t.id}: lines ${row.line_start}-${row.line_end} (${row.text.length} chars)`);
  }
  results.push(row);
}

// Keep any hand-checked passages from earlier runs for texts not processed this time.
for (const p of previous) if (!results.find(r => r.id === p.id)) results.push(p);
writeJSON(join(OPS, "07-passages.json"), { anchor_location: anchor.location, passages: results });
console.log("-> operations/07-passages.json");
