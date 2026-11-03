// Step 4 (deterministic code): build the page.
// Reads 03-events-categorized.json, ../inputs/course-readings.json, and 04-template.html;
// writes ../outputs/index.html with the data embedded inline, so the page opens by
// double-click (a page opened from the file system can't fetch a separate data file).
// No model is called.
//   node 01-use-cases/03-ai-and-literature-timeline/operations/04-build.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cat = JSON.parse(await readFile(join(here, "03-events-categorized.json"), "utf8"));
const draft = JSON.parse(await readFile(join(here, "01-candidates.json"), "utf8"));
const readings = JSON.parse(await readFile(join(here, "../inputs/course-readings.json"), "utf8"));
const verified = JSON.parse(await readFile(join(here, "02-events-verified.json"), "utf8"));
const template = await readFile(join(here, "04-template.html"), "utf8");

const papers = readings.papers_on_ai_folder.map((p) => p.arxiv);
const keep = ["id", "track", "title", "date_display", "drafted_date_display", "year", "precision", "who", "description", "quote", "quote_attribution", "copyright", "source_url", "status", "checked", "check_note", "origin", "themes", "why_it_matters"];
const events = cat.events
  .map((e) => ({ ...Object.fromEntries(keep.map((k) => [k, e[k] ?? ""])), in_papers_folder: e.track !== "readings" && papers.some((id) => (e.source_url || "").includes(id)) }))
  .sort((a, b) => a.year - b.year);

const data = { built: new Date().toISOString().slice(0, 10), checked_on: verified.checked_on, models: { draft: draft.model, categorize: cat.model }, events };
const json = JSON.stringify(data).replace(/</g, "\\u003c");
if (!template.includes("/*__DATA__*/null")) throw new Error("template is missing the /*__DATA__*/null placeholder");
await mkdir(join(here, "../outputs"), { recursive: true });
await writeFile(join(here, "../outputs/index.html"), template.replace("/*__DATA__*/null", () => json));
const by = events.reduce((t, e) => ((t[e.track] = (t[e.track] || 0) + 1), t), {});
console.log(`outputs/index.html: ${events.length} events`, by, `${events.filter((e) => e.in_papers_folder).length} from the papers folder`);
