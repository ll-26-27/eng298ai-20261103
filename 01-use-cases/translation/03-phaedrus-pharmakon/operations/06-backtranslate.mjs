// Step 6 (script, model judgment): back-translate every non-English passage into plain, literal English,
// so a reader without Latin, German or Russian can set the versions side by side. The Greek gets the same
// treatment, as a reference crib. English translations are not back-translated.
//
//   node --env-file=.env 01-use-cases/translation/03-phaedrus-pharmakon/operations/06-backtranslate.mjs

import { join } from "node:path";
import { ROOT, OPS, chat, readJSON, writeJSON } from "./lib/openrouter.mjs";

const MODEL = "anthropic/claude-sonnet-5.5";
export const PROMPT = `Translate the passage below into plain, literal English. Follow the passage's own wording and sentence order closely, even where that is awkward, so a reader can see what this version says rather than what Plato's Greek says. Keep the translator's choices: if the passage says "remedy", write "remedy"; if it says "means", write "means". Do not correct it toward the Greek, do not add anything, and do not smooth over omissions. If a word is damaged or uncertain (for instance by OCR), translate your best reading and mark it [?]. Return only the translation.`;

const manifest = readJSON(join(ROOT, "inputs", "texts", "manifest.json"));
const meta = Object.fromEntries(manifest.texts.map(t => [t.id, t]));
const { passages } = readJSON(join(OPS, "03-passages.json"));
const out = [];
for (const p of passages) {
  if (!p.ok || meta[p.id].language === "English") continue;
  const t = meta[p.id];
  const { text } = await chat({
    step: `06-back-${p.id}`, model: MODEL, maxTokens: 6000,
    messages: [{ role: "user", content: `${PROMPT}\n\nThe passage (${t.language}, ${t.translator}, ${t.year}):\n\n${p.passage}` }],
  });
  out.push({ id: p.id, model: MODEL, back_translation: text.trim() });
  console.log(`${p.id}: ${text.trim().slice(0, 90)}…`);
}
writeJSON(join(OPS, "06-backtranslations.json"), { about: "Step 6: literal English back-translations by a model (judgment; check against the passage before quoting). The Greek's is a reference crib.", model: MODEL, prompt: PROMPT, versions: out });
