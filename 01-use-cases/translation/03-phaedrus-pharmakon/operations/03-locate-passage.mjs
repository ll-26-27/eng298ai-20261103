// Step 3 (script: code narrows, a model points, code cuts and checks): find Phaedrus 274c–275b in every text.
//
// 1. Code turns each original into clean plain text (lib/text.mjs) and finds the stretch where the myth's
//    names cluster (Naucratis, Theuth, Thamus in any spelling), so the model reads a few pages, not the book.
// 2. A model is shown the Greek passage and that stretch, and returns the translator's first and last words
//    for the passage, copied exactly. (The Greek itself is cut by fixed anchors, with no model.)
// 3. Code searches for those exact words and cuts the passage out. If the words are not in the text the row
//    fails loudly, so a stored passage is always the translator's text, never a model's paraphrase.
//
//   node --env-file=.env 01-use-cases/translation/03-phaedrus-pharmakon/operations/03-locate-passage.mjs

import { join } from "node:path";
import { existsSync } from "node:fs";
import { ROOT, OPS, chat, readJSON, writeJSON } from "./lib/openrouter.mjs";
import { loadClean, findLoose } from "./lib/text.mjs";

const MODEL = "google/gemini-3.8-flash";
const manifest = readJSON(join(ROOT, "inputs", "texts", "manifest.json"));
const outPath = join(OPS, "03-passages.json");
const only = process.argv[2]; // optionally rerun one id

// The Greek passage: from "ἤκουσα τοίνυν" (274c5) to "ἀντὶ σοφῶν" (275b2), Burnet's text.
const GREEK_START = "ἤκουσα τοίνυν", GREEK_END = "δοξόσοφοι γεγονότες ἀντὶ σοφῶν.";
const NAMES = /naucrat|naukrat|neukrat|navcrat|ναυκρ|наукрат|навкрат|theu?th?|teuth?|thoyth|thoth|θε[υύ]θ|тевт|теут|тот\b|thamu|thamo|tamu[sz]|тамус|тамуз|фамус|θαμ/giu;

function windows(text) {
  const hits = [...text.matchAll(NAMES)].map(m => m.index);
  // rank every hit by how many other hits follow it within 3,000 characters; the densest clusters first
  const ranked = hits.map(h => [h, hits.filter(x => x >= h && x < h + 3000).length]).sort((a, b) => b[1] - a[1]);
  const out = [];
  for (const [h, n] of ranked) {
    if (out.some(w => Math.abs(w.at - h) < 6000)) continue;
    const start = Math.max(0, h - 2000), end = Math.min(text.length, h + 7000);
    out.push({ at: h, start, end, text: text.slice(start, end), hits: n });
    if (out.length === 3) break;
  }
  return out;
}

const prior = (() => { try { return readJSON(outPath); } catch { return { passages: [] }; } })();
const byId = Object.fromEntries(prior.passages.map(p => [p.id, p]));

const greekText = loadClean(join(ROOT, "inputs", "texts", manifest.texts.find(t => t.id === "grc-burnet").file), "tei");
const gs = greekText.indexOf(GREEK_START), ge = greekText.indexOf(GREEK_END, gs);
if (gs < 0 || ge < 0) throw new Error("Greek anchors not found");
const greek = greekText.slice(gs, ge + GREEK_END.length);

for (const t of manifest.texts) {
  if (only && t.id !== only) continue;
  if (t.skip_passage) continue;
  if (!existsSync(join(ROOT, "inputs", "texts", t.file))) { console.error(`MISSING ${t.id}: run step 2 first`); continue; }
  const text = loadClean(join(ROOT, "inputs", "texts", t.file), t.format, t.encoding || "utf8");
  if (t.id === "grc-burnet") {
    byId[t.id] = { id: t.id, method: "fixed anchors (no model)", start_words: GREEK_START, end_words: GREEK_END, offset: gs, passage: greek, ok: true };
    console.log(`ok     ${t.id} (${greek.length} chars, fixed anchors)`);
    continue;
  }
  const ws = windows(text);
  if (!ws.length) { byId[t.id] = { id: t.id, ok: false, error: "none of the myth's names found in the text" }; console.error(`FAILED ${t.id}: no names found`); continue; }
  let json, w;
  for (w of ws) {
    const schema = {
      type: "object", additionalProperties: false,
      required: ["found", "start_words", "end_words", "stephanus_markers_seen", "note"],
      properties: {
        found: { type: "boolean", description: "true if the excerpt contains this translator's version of the Greek passage" },
        start_words: { type: "string", description: "the first 6 to 10 words of the translator's version of the passage, copied character for character from the excerpt" },
        end_words: { type: "string", description: "the last 6 to 10 words of the translator's version of the passage, copied character for character from the excerpt" },
        stephanus_markers_seen: { type: "string", description: "any Stephanus numbers or page markers visible in or near the passage (e.g. '274', 'C', 'p. 275'), or ''" },
        note: { type: "string", description: "anything odd: OCR damage, omissions, a passage split by notes or page headers" },
      },
    };
    ({ json } = await chat({
      step: `03-locate-${t.id}`, model: MODEL, schema, schemaName: "locate", maxTokens: 2000, reasoning: { effort: "low" },
      messages: [
        { role: "system", content: "You locate passages in translations. Copy words exactly as they appear in the excerpt, including spelling, accents, punctuation and OCR errors. Never correct or translate them." },
        { role: "user", content: `Here is a passage of Plato's Phaedrus in Greek (274c–275b, from "I heard, then, that at Naucratis" to "having become wise-seeming instead of wise"):\n\n${greek}\n\nBelow is an excerpt from a ${t.language} translation (${t.translator}, ${t.year}). Find this translator's version of exactly that passage. Return its first words (the start of the sentence about Naucratis; leave out any speaker label such as "SOCRATES:") and its last words (the end of the sentence about seeming wise instead of wise), each copied exactly from the excerpt.\n\nEXCERPT:\n${w.text}` },
      ],
    }));
    if (json.found) break;
  }
  const s = json.found ? findLoose(w.text, json.start_words) : null;
  const e = s ? findLoose(w.text, json.end_words, s.index) : null;
  if (!s || !e) {
    byId[t.id] = { id: t.id, ok: false, model: MODEL, located: json, error: !json.found ? "model says passage not in excerpt" : `${!s ? "start" : "end"} words not found verbatim in the text` };
    console.error(`FAILED ${t.id}: ${byId[t.id].error}`);
    continue;
  }
  const passage = w.text.slice(s.index, e.index + e.length);
  byId[t.id] = {
    id: t.id, ok: true, method: "names cluster → model points to first/last words → code cuts", model: MODEL,
    start_words: json.start_words, end_words: json.end_words, exact_match: s.exact && e.exact,
    offset: w.start + s.index, stephanus_markers_seen: json.stephanus_markers_seen, note: json.note, passage,
  };
  console.log(`ok     ${t.id} (${passage.length} chars${s.exact && e.exact ? "" : ", matched ignoring whitespace/case"})`);
}

const order = manifest.texts.map(t => t.id);
writeJSON(outPath, { about: "Phaedrus 274c–275b as cut from each text by step 3. 'passage' is the clean plain text (markup removed, line-end hyphens rejoined, whitespace collapsed); 'offset' is its position in that clean text.", passages: order.map(id => byId[id]).filter(Boolean) });
