// Step 2 (deterministic code): the best honest keyword search for "scenes of instruction".
// This is what a careful scholar with Ctrl-F or a concordance would do: list the words that
// name teaching and learning, with their inflections, and mark every passage that contains one.
// Writes operations/02-keyword-hits.json.
import { readJSON, writeJSON } from './_lib.mjs';

// Chosen before seeing any model output. Deliberately left out: "master" (in these texts it is
// mostly the master of a house or of the Robots), "study" (mostly a room), "show", "tell",
// "explain", "influence" (far too common or too vague to count as a search for teaching).
export const KEYWORDS = /\b(teach(es|ing|er|ers)?|taught|learn(s|ed|t|ing)?|lessons?|instruct(s|ed|ing|ion|ions|or|ors|ive)?|tutor(s|ed|ing)?|educat(e|ed|es|ing|ion)|pupils?|disciples?|school(s|ed|ing|master)?|preceptors?)\b/gi;

const { chunks } = readJSON('01-chunks.json');
const hits = {};
let n = 0;
for (const c of chunks) {
  const found = [...c.text.matchAll(KEYWORDS)].map((m) => m[0].toLowerCase());
  if (found.length) { hits[c.id] = found; n++; }
}
writeJSON('02-keyword-hits.json', { pattern: KEYWORDS.source, hits });
console.log(`${n} of ${chunks.length} passages contain a keyword → operations/02-keyword-hits.json`);
