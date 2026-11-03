// Step 0 (deterministic code): download every text listed in inputs/texts/manifest.json,
// then cut the English anchor passage out of the 1818 and 1831 editions by its first and last words.
// Run from the repo root: node 01-use-cases/translation/02-frankenstein-translations/operations/00-fetch-texts.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, readJSON, writeJSON } from "./lib/openrouter.mjs";

const dir = join(ROOT, "inputs", "texts");
const { texts } = readJSON(join(dir, "manifest.json"));

for (const t of texts) {
  const out = join(dir, t.file);
  if (existsSync(out)) { console.log(`have ${t.file}`); continue; }
  const res = await fetch(t.url);
  if (!res.ok) { console.log(`FAILED ${t.id}: ${res.status}`); continue; }
  if (t.format === "html-paragraphs") {
    // Keep only the book's own paragraphs (<p> with no class), as plain text, one blank line between them.
    const html = await res.text();
    const paras = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => m[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&#8222;/g, "„").replace(/&#8220;/g, "“").replace(/&amp;/g, "&").trim()).filter(Boolean);
    writeFileSync(out, paras.join("\n\n") + "\n");
  } else {
    writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  }
  console.log(`fetched ${t.file}`);
}

// The anchor: the first two paragraphs of the creature's awakening (1818: vol. I, ch. IV; 1831: ch. 5).
const START = "It was on a dreary night of November";
const END = "straight black lips.";
const anchor = {};
for (const id of ["en-1818", "en-1831"]) {
  const t = texts.find(x => x.id === id);
  const s = readFileSync(join(dir, t.file), "utf8").replace(/\r/g, "");
  const a = s.indexOf(START), b = s.indexOf(END, a);
  if (a < 0 || b < 0) throw new Error(`anchor not found in ${id}`);
  const passage = s.slice(a, b + END.length);
  anchor[id] = {
    line: s.slice(0, a).split("\n").length,
    text: passage.split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, " ").trim()).join("\n\n"),
  };
}
writeJSON(join(ROOT, "inputs", "anchor-passage.json"), {
  note: "Shelley's English, cut deterministically from the Project Gutenberg texts by 00-fetch-texts.mjs.",
  location: { "en-1818": "Volume I, Chapter IV", "en-1831": "Chapter 5" },
  ...anchor,
});
console.log("wrote inputs/anchor-passage.json");
