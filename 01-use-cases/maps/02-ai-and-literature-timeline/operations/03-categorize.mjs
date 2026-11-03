// Step 3 (model judgment, structured output): tag each verified event with a track,
// themes from a fixed list, and one sentence on why it matters for the course.
// The reply is constrained by a JSON schema, so it can't invent a theme or skip a field.
// Reads 03-categorize-prompt.md and 02-events-verified.json; writes 03-events-categorized.json.
//   node --env-file=.env 01-use-cases/maps/02-ai-and-literature-timeline/operations/03-categorize.mjs
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chat, content } from "./openrouter.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const MODEL = "anthropic/claude-sonnet-5.5"; // confirmed in https://openrouter.ai/api/v1/models on 2026-11-03
const THEMES = ["making-minds", "conversation", "imitation-and-testing", "persona-and-role", "meaning-and-understanding", "writing-and-authorship", "servants-and-labor", "learning-and-training"];
const TRACKS = ["readings", "computing", "made-beings", "dialogue"];

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["events"],
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "track", "themes", "why_it_matters"],
        properties: {
          id: { type: "string" },
          track: { type: "string", enum: TRACKS },
          themes: { type: "array", items: { type: "string", enum: THEMES } },
          why_it_matters: { type: "string" },
        },
      },
    },
  },
};

const prompt = (await readFile(join(here, "03-categorize-prompt.md"), "utf8")).replace(/^---[\s\S]*?---\s*/, "");
const { events } = JSON.parse(await readFile(join(here, "02-events-verified.json"), "utf8"));

const BATCH = 20;
const tags = {};
for (let i = 0; i < events.length; i += BATCH) {
  const batch = events.slice(i, i + BATCH).map(({ id, title, date_display, who, description, track }) => ({ id, title, date_display, who, description, drafted_track: track }));
  const json = await chat({
    step: `03-categorize-${String(i / BATCH + 1).padStart(2, "0")}`,
    model: MODEL,
    messages: [{ role: "system", content: prompt }, { role: "user", content: JSON.stringify(batch, null, 1) }],
    response_format: { type: "json_schema", json_schema: { name: "timeline_tags", strict: true, schema } },
    max_tokens: 8000,
    temperature: 0.2,
  });
  for (const t of JSON.parse(content(json)).events) tags[t.id] = t;
}

const out = [];
const disagreements = [];
for (const e of events) {
  const t = tags[e.id];
  if (!t) { console.warn(`no tags for ${e.id}`); continue; }
  // Rule (deterministic): the course list decides what is a reading, not the model.
  const track = e.track === "readings" ? "readings" : t.track === "readings" ? e.track : t.track;
  if (t.track !== e.track) disagreements.push(`${e.id}: drafted ${e.track}, model said ${t.track}, kept ${track}`);
  out.push({ ...e, track, themes: [...new Set(t.themes)].filter((x) => THEMES.includes(x)).slice(0, 3), why_it_matters: t.why_it_matters });
}
await writeFile(join(here, "03-events-categorized.json"), JSON.stringify({ model: MODEL, themes: THEMES, tracks: TRACKS, track_disagreements: disagreements, count: out.length, events: out }, null, 2));
console.log(`${out.length} events tagged; ${disagreements.length} track disagreements`);
disagreements.forEach((d) => console.log("  " + d));
