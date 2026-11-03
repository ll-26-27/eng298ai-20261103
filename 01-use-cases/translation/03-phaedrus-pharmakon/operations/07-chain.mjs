// Step 7 (script, model judgment, optional): translate → critique → revise.
// One model translates the Greek passage into English; a different model critiques the translation as a
// classicist would, with attention to the key words; the first model revises and says which criticisms it
// accepted. The result sits on the page beside the historical translations, as one more version to judge.
//
//   node --env-file=.env 01-use-cases/translation/03-phaedrus-pharmakon/operations/07-chain.mjs

import { join } from "node:path";
import { OPS, chat, readJSON, writeJSON } from "./lib/openrouter.mjs";

const TRANSLATOR = "google/gemini-3.8-flash", CRITIC = "anthropic/claude-sonnet-5.5";
export const PROMPTS = {
  translate: "Translate this passage of Plato's Phaedrus (274c–275b) from Greek into clear modern English prose. Return only the translation.",
  critique: "You are a classicist reviewing a translation of Phaedrus 274c–275b. Assess, in at most eight numbered points, how well it renders φάρμακον (both times: 274e and 275a), μνήμη, ὑπόμνησις, σοφία / σοφίας δόξα, and δοξόσοφοι, and whether it keeps the turn by which Thamus answers Theuth in Theuth's own word. Note any other errors. Be specific and quote the translation.",
  revise: "Revise your translation in light of this critique. Accept only the points you agree with. Return JSON with the revised translation and a one-paragraph note of which points you accepted and which you rejected, and why.",
};
const reviseSchema = { type: "object", additionalProperties: false, required: ["revised", "accepted"], properties: { revised: { type: "string" }, accepted: { type: "string" } } };

const { passages } = readJSON(join(OPS, "03-passages.json"));
const greek = passages.find(p => p.id === "grc-burnet").passage;

const t1 = await chat({ step: "07-translate-en", model: TRANSLATOR, maxTokens: 2000, messages: [{ role: "user", content: `${PROMPTS.translate}\n\n${greek}` }] });
const first = t1.text.trim();
const c = await chat({ step: "07-critique-en", model: CRITIC, maxTokens: 6000, messages: [{ role: "user", content: `${PROMPTS.critique}\n\nGREEK:\n${greek}\n\nTRANSLATION:\n${first}` }] });
const critique = c.text.trim();
const r = await chat({
  step: "07-revise-en", model: TRANSLATOR, schema: reviseSchema, schemaName: "revision", maxTokens: 3000,
  messages: [
    { role: "user", content: `${PROMPTS.translate}\n\n${greek}` },
    { role: "assistant", content: first },
    { role: "user", content: `${PROMPTS.revise}\n\nCRITIQUE:\n${critique}` },
  ],
});
writeJSON(join(OPS, "07-chain.json"), {
  about: "Step 7: a model translation of the Greek passage into English, critiqued by a second model and revised by the first. Model judgment throughout.",
  prompts: PROMPTS,
  runs: [{ label: "Greek → English. Translated and revised by " + TRANSLATOR + "; critiqued by " + CRITIC + ".", translate_model: TRANSLATOR, critique_model: CRITIC, first, critique, revised: r.json.revised, accepted: r.json.accepted }],
});
console.log("first:", first.slice(0, 200), "\n\nrevised:", r.json.revised.slice(0, 200));
