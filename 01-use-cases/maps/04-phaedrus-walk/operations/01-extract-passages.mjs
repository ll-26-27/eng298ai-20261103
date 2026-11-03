// 01-extract-passages.mjs — deterministic code, no model.
//
// Cuts the topographic passages of the Phaedrus out of three texts by
// Stephanus section: the Greek (Burnet 1901, Perseus TEI) and Fowler's
// English (1914, Perseus TEI) by their <milestone unit="section"> markers,
// and Jowett's English (1892, Project Gutenberg #1636, plain text) by anchor
// phrases, because that file carries no Stephanus numbers. Every anchor must
// occur exactly once or the script stops: a stored passage is always the
// translator's text, never a paraphrase.
//
// Run from the repo root:
//   node 01-use-cases/maps/04-phaedrus-walk/operations/01-extract-passages.mjs
// Writes operations/01-passages.json.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const texts = join(here, "..", "inputs", "texts");

// The stops. `range` is inclusive in Stephanus sections. Jowett anchors are
// the first and last words of the same passage in Jowett's text, chosen by
// reading Fowler and Jowett side by side. Where a Stephanus section ends in
// the middle of a speech, the Jowett passage is cut at the nearest sentence
// (see README, "What a scholar must check").
const STOPS = [
  {
    n: 1, id: "from-lysias", range: ["227a", "227b"],
    title: "Where from, where to",
    jowett: { start: "SOCRATES: My dear Phaedrus, whence come you", end: "near the temple of Olympian Zeus." },
  },
  {
    n: 2, id: "walk-to-megara", range: ["227c", "227d"],
    title: "A walk to Megara and back",
    jowett: { start: "PHAEDRUS: Will you go on?", end: "PHAEDRUS: What do you mean, my good Socrates?" },
  },
  {
    n: 3, id: "under-the-cloak", range: ["228d", "228e"],
    title: "The speech under the cloak",
    jowett: { start: "PHAEDRUS: I will do as I say; but believe me", end: "where would you please to sit?" },
  },
  {
    n: 4, id: "turn-to-the-ilissus", range: ["229a", "229a"],
    title: "Turning aside to the Ilissus",
    jowett: { start: "SOCRATES: Let us turn aside and go by the Ilissus", end: "the tallest plane-tree in the distance?\n\nSOCRATES: Yes." },
  },
  {
    n: 5, id: "boreas-and-agra", range: ["229b", "229e"],
    title: "Boreas, Oreithyia, and the crossing to Agra",
    jowett: { start: "PHAEDRUS: There are shade and gentle breezes", end: "will take up a great deal of time." },
  },
  {
    n: 6, id: "the-plane-tree", range: ["230a", "230e"],
    title: "The plane tree",
    jowett: { start: "Now I have no leisure for such enquiries", end: "may be arranged for the advantage of both of us." },
  },
  {
    n: 7, id: "noon", range: ["242a", "242b"],
    title: "Noon: “I will cross the river”",
    jowett: { start: "Leaving the tale to its fate, I will cross the river", end: "as I was about to cross the stream the usual sign was given to me" },
  },
  {
    n: 8, id: "the-cicadas", range: ["258e", "259d"],
    title: "The cicadas overhead",
    jowett: { start: "PHAEDRUS: Need we? For what should a man live", end: "PHAEDRUS: Let us talk." },
  },
  {
    n: 9, id: "theuth-and-thamus", range: ["274c", "275b"],
    title: "Theuth and Thamus: writing as a pharmakon",
    jowett: { start: "SOCRATES: I have heard a tradition of the ancients", end: "PHAEDRUS: Yes, Socrates, you can easily invent tales of Egypt, or of any other country." },
  },
  {
    n: 10, id: "back-to-lysias", range: ["278b", "278b"],
    title: "“Go and tell Lysias”",
    jowett: { start: "secondly, the brethren and descendants and relations of his idea", end: "which leave their writings poor in comparison of them," },
  },
  {
    n: 11, id: "prayer-to-pan", range: ["279b", "279c"],
    title: "The prayer to Pan, and “let us go”",
    jowett: { start: "which will lead him to things higher still.", end: "SOCRATES: Let us go." },
  },
];

// ---------- TEI (Greek and Fowler) ----------

function loadTei(file, speakers) {
  const xml = readFileSync(join(texts, file), "utf8");
  // Keep only the body; drop the Loeb editorial notes (they are not Plato).
  const body = xml.slice(xml.indexOf("<body"), xml.lastIndexOf("</body>"));
  const noteCount = (body.match(/<note[\s>]/g) || []).length;
  const clean = body.replace(/<note[\s\S]*?<\/note>/g, "");
  // Positions of every section milestone, in document order.
  const marks = [];
  const re = /<milestone[^>]*unit="section"[^>]*n="(\d+[a-e])"[^>]*\/>/g;
  let m;
  while ((m = re.exec(clean))) marks.push({ n: m[1], at: m.index, end: m.index + m[0].length });
  const index = Object.fromEntries(marks.map((x, i) => [x.n, i]));
  return { clean, marks, index, speakers, noteCount };
}

function speakerBefore(tei, pos) {
  const upto = tei.clean.slice(0, pos);
  const m = [...upto.matchAll(/<said who="#([^"]+)"/g)].pop();
  return m ? tei.speakers[m[1]] || m[1] : null;
}

function teiPassage(tei, [from, to]) {
  const i = tei.index[from], j = tei.index[to];
  if (i === undefined) throw new Error(`section ${from} not found`);
  if (j === undefined) throw new Error(`section ${to} not found`);
  if (j < i) throw new Error(`range ${from}-${to} is backwards`);
  const start = tei.marks[i].end;
  const stop = j + 1 < tei.marks.length ? tei.marks[j + 1].at : tei.clean.length;
  const frag = tei.clean.slice(start, stop);
  // Split into speeches on <said>; text before the first <said> continues the
  // speech that was open when the section began.
  const pieces = frag.split(/(?=<said who="#)/);
  const speeches = [];
  pieces.forEach((piece, k) => {
    let who = null;
    const sm = piece.match(/^<said who="#([^"]+)"/);
    // A fragment that opens with the speaker label is the start of a speech
    // whose <said> tag precedes the milestone (so at 227a, the first words of
    // the dialogue), not a continuation.
    const opensSpeech = /^\s*<label>/.test(piece);
    if (sm) who = tei.speakers[sm[1]] || sm[1];
    else if (k === 0) who = speakerBefore(tei, start);
    const text = piece
      .replace(/<label>[^<]*<\/label>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\s+/g, " ").trim();
    if (text) speeches.push({ speaker: who, text, continues: !sm && !opensSpeech });
  });
  return speeches;
}

// ---------- Jowett (plain text) ----------

function loadJowett(file) {
  const raw = readFileSync(join(texts, file), "utf8");
  const a = raw.indexOf("*** START OF THE PROJECT GUTENBERG EBOOK");
  const b = raw.indexOf("*** END OF THE PROJECT GUTENBERG EBOOK");
  const body = raw.slice(raw.indexOf("\n", a) + 1, b);
  // The dialogue proper begins after Jowett's long introduction, at the scene line.
  const scene = body.indexOf("SCENE: Under a plane-tree");
  if (scene < 0) throw new Error("Jowett: scene line not found");
  const paras = body.slice(scene).split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  // Character offsets of each paragraph in the joined text, so an anchor may
  // span a paragraph break ("...distance?\n\nSOCRATES: Yes.").
  const offsets = [];
  let pos = 0;
  for (const p of paras) { offsets.push(pos); pos += p.length + 2; }
  return { paras, offsets, joined: paras.join("\n\n") };
}

function countOccurrences(hay, needle) {
  let n = 0, i = 0;
  while ((i = hay.indexOf(needle, i)) >= 0) { n++; i += needle.length; }
  return n;
}

function paraAt(jw, charPos) {
  let k = 0;
  while (k + 1 < jw.offsets.length && jw.offsets[k + 1] <= charPos) k++;
  return k;
}

function jowettPassage(jw, { start, end }, stop) {
  for (const [label, s] of [["start", start], ["end", end]]) {
    const c = countOccurrences(jw.joined, s);
    if (c !== 1) throw new Error(`stop ${stop.n} (${stop.id}): Jowett ${label} anchor occurs ${c} times: "${s}"`);
  }
  const a = jw.joined.indexOf(start);
  const b = jw.joined.indexOf(end) + end.length;
  if (b <= a) throw new Error(`stop ${stop.n}: Jowett end anchor precedes start anchor`);
  const i = paraAt(jw, a), j = paraAt(jw, b - 1);
  const out = [];
  for (let k = i; k <= j; k++) {
    let p = jw.paras[k];
    const from = k === i ? a - jw.offsets[k] : 0;
    const to = k === j ? b - jw.offsets[k] : p.length;
    p = p.slice(from, to).trim();
    if (!p) continue;
    const m = p.match(/^(SOCRATES|PHAEDRUS):\s*(.*)$/);
    if (m) out.push({ speaker: m[1] === "SOCRATES" ? "Socrates" : "Phaedrus", text: m[2] });
    else {
      // A paragraph cut mid-speech: find whose speech it continues.
      let who = null;
      for (let q = k; q >= 0 && !who; q--) { const lm = jw.paras[q].match(/^(SOCRATES|PHAEDRUS):/); if (lm) who = lm[1] === "SOCRATES" ? "Socrates" : "Phaedrus"; }
      out.push({ speaker: who, text: p, continues: true });
    }
  }
  return out;
}

// ---------- run ----------

const grc = loadTei("phaedrus-grc-burnet-perseus-grc2.xml", { "Σωκράτης": "Socrates", "Φαῖδρος": "Phaedrus" });
const eng = loadTei("phaedrus-en-1914-fowler-perseus-eng2.xml", { Socrates: "Socrates", Phaedrus: "Phaedrus" });
const jw = loadJowett("phaedrus-en-1892-jowett-pg1636.txt");

const out = {
  built: new Date().toISOString().slice(0, 10),
  sources: {
    greek: { file: "inputs/texts/phaedrus-grc-burnet-perseus-grc2.xml", edition: "Plato, Platonis Opera, ed. John Burnet, vol. 2 (Oxford: Clarendon Press, 1901)", encoding: "Perseus Digital Library TEI (canonical-greekLit), CC BY-SA 4.0", notesDropped: grc.noteCount },
    fowler: { file: "inputs/texts/phaedrus-en-1914-fowler-perseus-eng2.xml", edition: "Plato in Twelve Volumes, vol. 1, trans. Harold North Fowler, Loeb Classical Library (Cambridge, MA: Harvard University Press; London: Heinemann, 1914)", encoding: "Perseus Digital Library TEI (canonical-greekLit), CC BY-SA 4.0", notesDropped: eng.noteCount },
    jowett: { file: "inputs/texts/phaedrus-en-1892-jowett-pg1636.txt", edition: "The Dialogues of Plato, trans. Benjamin Jowett, 3rd ed. (Oxford: Clarendon Press, 1892)", encoding: "Project Gutenberg #1636", stephanus: "none in the file; passages located by anchor phrases" },
  },
  stops: STOPS.map((s) => ({
    n: s.n, id: s.id, title: s.title, stephanus: s.range[0] === s.range[1] ? s.range[0] : `${s.range[0]}–${s.range[1]}`,
    greek: teiPassage(grc, s.range),
    fowler: teiPassage(eng, s.range),
    jowett: jowettPassage(jw, s.jowett, s),
    jowettAnchors: s.jowett,
  })),
};

const words = (sp) => sp.reduce((n, x) => n + x.text.split(/\s+/).length, 0);
for (const s of out.stops) {
  console.log(`${String(s.n).padStart(2)}  ${s.stephanus.padEnd(10)} ${s.title}  (greek ${words(s.greek)}w, fowler ${words(s.fowler)}w, jowett ${words(s.jowett)}w)`);
}
writeFileSync(join(here, "01-passages.json"), JSON.stringify(out, null, 2));
console.log(`\nwrote operations/01-passages.json: ${out.stops.length} stops; dropped ${eng.noteCount} Loeb notes from Fowler, ${grc.noteCount} from the Greek`);
