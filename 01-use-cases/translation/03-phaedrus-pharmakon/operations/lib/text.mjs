// Shared text helpers: turn a downloaded original (TEI XML, HTML, plain text) into clean plain text.
// "Clean" means: markup and editorial notes removed, entities decoded, words broken by a line-end hyphen
// rejoined, and all whitespace collapsed to single spaces. The original file is never changed.

import { readFileSync } from "node:fs";

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", laquo: "«", raquo: "»", hellip: "…" };
// accented letters: &aacute; &Ntilde; &uuml; &ccedil; … built from a base letter plus a combining mark
const MARKS = { acute: "\u0301", grave: "\u0300", circ: "\u0302", uml: "\u0308", tilde: "\u0303", cedil: "\u0327", ring: "\u030A" };
for (const [name, mark] of Object.entries(MARKS)) for (const c of "aeiouycnAEIOUYCN") ENT[c + name] = (c + mark).normalize("NFC");
Object.assign(ENT, { szlig: "ß", aelig: "æ", AElig: "Æ", oelig: "œ", OElig: "Œ", oslash: "ø", Oslash: "Ø", iexcl: "¡", iquest: "¿", ordf: "ª", ordm: "º", middot: "·", sect: "§", deg: "°", thinsp: " ", shy: "\u00ad" });
export function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? ENT[n.toLowerCase()] ?? m);
}

export function toPlain(raw, format) {
  let s = raw;
  if (format === "tei") {
    s = s.replace(/<teiHeader[\s\S]*?<\/teiHeader>/, "")
      .replace(/<note\b[\s\S]*?<\/note>/g, " ")       // Loeb footnotes and apparatus
      .replace(/<label\b[^>]*>[\s\S]*?<\/label>/g, " ") // speaker labels (ΣΩ., Socrates.)
      .replace(/<milestone\b[^>]*n="(\d+[a-e])"[^>]*\/>/g, " ") // Stephanus markers are dropped from the text
      .replace(/<[^>]+>/g, "");
  } else if (format === "html") {
    s = s.replace(/<(script|style|head)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, "");
  }
  s = decodeEntities(s);
  return s;
}

export function clean(s) {
  return s
    .normalize("NFC")
    .replace(/­/g, "")                               // soft hyphens
    .replace(/(\p{Ll})[-¬]\s*\n\s*(\p{Ll})/gu, "$1$2")    // re-join words hyphenated at a line end
    .replace(/\s+/g, " ")
    .trim();
}

export function loadClean(path, format, encoding = "utf8") {
  const raw = encoding === "utf8" ? readFileSync(path, "utf8") : new TextDecoder(encoding).decode(readFileSync(path));
  return clean(toPlain(raw, format));
}

// Find `needle` in `hay` exactly; failing that, ignoring differences in whitespace and case.
// Typographic apostrophes and quotes are folded to plain ones for the loose search (same length, so
// positions found in the folded text are positions in the original).
const fold = s => s.replace(/[’‘ʼ]/g, "'").replace(/[“”]/g, '"');
export function findLoose(hay, needle, from = 0) {
  const i = hay.indexOf(needle, from);
  if (i >= 0) return { index: i, length: needle.length, exact: true };
  hay = fold(hay); needle = fold(needle);
  const esc = needle.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s*");
  const re = new RegExp(esc, "giu");
  re.lastIndex = from;
  const m = re.exec(hay);
  return m ? { index: m.index, length: m[0].length, exact: false } : null;
}
