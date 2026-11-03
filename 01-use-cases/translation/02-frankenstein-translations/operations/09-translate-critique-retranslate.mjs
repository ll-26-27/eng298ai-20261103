// Step 9 (model judgment, a chain of three calls): translate -> critique -> revise, for one or two languages.
// The point is to compare a one-shot translation with one that went through a critique,
// and both with the historical translator's choices (step 8 back-translates and compares all of them).
// Run from the repo root: node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/09-translate-critique-retranslate.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chat, readJSON, writeJSON, ROOT, OPS } from "./lib/openrouter.mjs";

const TRANSLATOR = "google/gemini-3.8-flash";
const CRITIC = "anthropic/claude-sonnet-5.5"; // a different model, so the critique isn't the translator grading itself
const LANGUAGES = [{ id: "fr", language: "French" }, { id: "de", language: "German" }];

const md = readFileSync(join(OPS, "09-chain-prompts.md"), "utf8");
const section = name => md.split(`## ${name}`)[1].split("\n## ")[0].trim();
const english = readJSON(join(ROOT, "inputs", "anchor-passage.json"))["en-1818"].text;

const chains = [];
for (const L of LANGUAGES) {
  const fill = s => s.replaceAll("{LANGUAGE}", L.language);
  const t1 = await chat({ step: `09-translate-${L.id}`, model: TRANSLATOR, reasoning: { effort: "low" },
    messages: [{ role: "user", content: `${fill(section("translate"))}\n\n"""\n${english}\n"""` }] });
  const one_shot = t1.text.trim();
  const c = await chat({ step: `09-critique-${L.id}`, model: CRITIC,
    messages: [{ role: "user", content: `${fill(section("critique"))}\n\nENGLISH:\n"""\n${english}\n"""\n\n${L.language.toUpperCase()}:\n"""\n${one_shot}\n"""` }] });
  const critique = c.text.trim();
  const r = await chat({ step: `09-revise-${L.id}`, model: TRANSLATOR, reasoning: { effort: "low" },
    messages: [
      { role: "user", content: `${fill(section("translate"))}\n\n"""\n${english}\n"""` },
      { role: "assistant", content: one_shot },
      { role: "user", content: `${fill(section("revise"))}\n\nCRITIQUE:\n"""\n${critique}\n"""` },
    ] });
  const [revised, responses = ""] = r.text.split(/\n-{3,}\n/);
  chains.push({ id: `model-${L.id}`, language: L.language, translator_model: TRANSLATOR, critic_model: CRITIC, one_shot, critique, revised: revised.trim(), responses_to_critique: responses.trim() });
  console.log(`${L.language}: one-shot ${one_shot.length} chars, revised ${revised.trim().length} chars`);
}
writeJSON(join(OPS, "09-chain.json"), { source: "en-1818 anchor passage", chains });
console.log("-> operations/09-chain.json (now rerun step 8 to back-translate and compare these too)");
