// Step 1 (model judgment): ask a model to propose candidate events.
// Reads 01-draft-prompt.md and ../inputs/course-readings.json, writes 01-candidates.json.
// Run from the repo root:
//   node --env-file=.env mk-projects/03-ai-and-literature-timeline/operations/01-draft.mjs
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chat, content, parseJSON } from "./openrouter.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const MODEL = "anthropic/claude-opus-5.5"; // confirmed in https://openrouter.ai/api/v1/models on 2026-11-03

const prompt = (await readFile(join(here, "01-draft-prompt.md"), "utf8")).replace(/^---[\s\S]*?---\s*/, "");
const readings = JSON.parse(await readFile(join(here, "../inputs/course-readings.json"), "utf8"));

// The model gets authors and titles but NOT the years, so the dates it proposes are its own
// and step 2 is a real test of them.
const list = [
  "## Course readings (by seminar)",
  ...readings.seminar_readings.map((r) => `- Seminar ${r.seminar} (${r.role}): ${r.author}, ${r.title}`),
  "",
  "## The course's papers folder (arXiv)",
  ...readings.papers_on_ai_folder.map((p) => `- arXiv ${p.arxiv}: ${p.title}`),
].join("\n");

// One call per track: a single call for all ~105 events ran out of tokens (the model's
// reasoning used two thirds of them) and returned truncated JSON. See the README.
const TRACKS = ["readings", "computing", "made-beings", "dialogue"];
const events = [];
for (const track of TRACKS) {
  const json = await chat({
    step: `01-draft-${track}`,
    model: MODEL,
    messages: [{ role: "user", content: `${prompt}\n\n${list}\n\n**In this reply, give only the events for the \`${track}\` track.**` }],
    response_format: { type: "json_object" },
    max_tokens: 24000,
    temperature: 0.3,
    reasoning: { effort: "low" },
  });
  if (json.choices[0].finish_reason !== "stop") console.warn(`warning: ${track} finished with ${json.choices[0].finish_reason}`);
  const got = parseJSON(content(json)).events.map((e) => ({ ...e, track }));
  console.log(`${track}: ${got.length}`);
  events.push(...got);
}

await writeFile(join(here, "01-candidates.json"), JSON.stringify({ model: MODEL, drafted: new Date().toISOString().slice(0, 10), count: events.length, events }, null, 2));
console.log(`${events.length} candidates`);
