// Step 2 (deterministic code): confirm that every quotation in 01-renderings.csv is really in its source.
// - Rows with a local_file (public-domain texts in inputs/texts/) are checked against that file.
// - Other rows are checked by fetching source_url now and searching the page text. Nothing fetched is saved,
//   so no copyrighted page ends up in the repo; only the result is recorded.
// A quote counts as found if its key sentence (the one with "fiend") occurs after folding case, quotes,
// apostrophes and whitespace. Sources that can't be fetched by a script (Google Books previews, PDFs behind
// scripts) are marked "not checkable by script": for those, the research note in how_verified is all we have.
// Output: 02-quote-check.json. Run from the repo root:
//   node mk-projects/02-frankenstein-translations/operations/02-check-quotes.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCSV, writeJSON, ROOT, OPS } from "./lib/openrouter.mjs";

const rows = parseCSV(readFileSync(join(OPS, "01-renderings.csv"), "utf8"));
// HTML entities: numeric ones, plus the named Latin-1 letters (&ouml;, &szlig;, &eacute;, ...).
const NAMED = { nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", szlig: "ß", laquo: "«", raquo: "»", hellip: "…", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", bdquo: "„" };
const ACC = { acute: "\u0301", grave: "\u0300", circ: "\u0302", uml: "\u0308", tilde: "\u0303", cedil: "\u0327", ring: "\u030a" };
const entities = s => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? (/^([a-z])(acute|grave|circ|uml|tilde|cedil|ring)$/i.test(n) ? (n[0] + ACC[n.slice(1)]).normalize("NFC") : m));
const fold = s => entities(s.replace(/<(rt|rp)>[\s\S]*?<\/\1>/g, "").replace(/<\/?[a-z][^<>]{0,800}>/gi, "")).normalize("NFC").toLowerCase()
  .replace(/<(rt|rp)>[\s\S]*?<\/\1>/g, "") // ruby readings in Japanese pages
  .replace(/<\/?[a-z][^<>]{0,800}>/gi, "").replace(/&nbsp;|&#160;/g, " ").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/[’‘ʼ`]/g, "'").replace(/[«»“”„"]/g, '"').replace(/[­​]/g, "").replace(/\s+/g, " ").trim();

// Check the quote in pieces (split at sentence ends), so a line break or footnote mark in one place doesn't sink the whole quote.
// Quotes made of two separated sentences mark the gap with an ellipsis, so split there too.
function pieces(q) { return q.split(/\s*(?:…+|\.{3})\s*|(?<=[.;!?。！？])\s*/).map(s => s.trim()).filter(s => s.length > 6); }

// Many Japanese and Chinese sites are not UTF-8: read the charset from the header or a <meta> tag and decode with it.
async function decode(res) {
  const buf = Buffer.from(await res.arrayBuffer());
  const head = buf.subarray(0, 4000).toString("latin1");
  const cs = ((res.headers.get("content-type") || "").match(/charset=([\w-]+)/i) || head.match(/charset=["']?([\w-]+)/i) || [])[1] || "utf-8";
  try { return new TextDecoder(cs.toLowerCase()).decode(buf); } catch { return buf.toString("utf8"); }
}

// Archive.org sometimes refuses a burst of requests: retry a couple of times before giving up.
async function get(url, opts = {}) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(45000) }); if (r.ok || r.status === 404) return r; } catch {}
    await new Promise(res => setTimeout(res, 3000 * (i + 1)));
  }
  return fetch(url, { ...opts, signal: AbortSignal.timeout(45000) });
}

const results = [];
for (const r of rows) {
  let text = null, method;
  if (r.script_check && r.script_check.startsWith("skip")) {
    method = r.script_check;
  } else if (r.local_file) {
    text = readFileSync(join(ROOT, "inputs", "texts", r.local_file), "utf8"); method = `local file inputs/texts/${r.local_file}`;
  } else if (r.source_url) {
    let url = r.source_url;
    // An Internet Archive item page doesn't contain the book's text: fetch the item's OCR text file instead.
    const ia = url.match(/archive\.org\/details\/([^/?#]+)/);
    if (ia) {
      try {
        const meta = await (await get(`https://archive.org/metadata/${ia[1]}`)).json();
        // the book's OCR is the largest _djvu.txt in the item (others may be covers or images)
        const f = (meta.files || []).filter(f => f.name.endsWith("_djvu.txt")).sort((a, b) => (+b.size || 0) - (+a.size || 0))[0];
        if (f) url = `https://archive.org/download/${ia[1]}/${encodeURIComponent(f.name)}`;
      } catch {}
    }
    method = `fetched ${url}`;
    try {
      const res = await get(url, { headers: { "User-Agent": "Mozilla/5.0 (research check for a course demo)" } });
      const type = res.headers.get("content-type") || "";
      if (res.ok && /text|html|json|xml/.test(type)) text = await decode(res);
      else method += ` (status ${res.status}, ${type.split(";")[0] || "no type"})`;
    } catch (e) { method += ` (failed: ${e.name})`; }
  }
  // OCR splits words across lines with a hyphen: rejoin them before searching.
  const ps = pieces(r.quote), hay = text ? fold(text.replace(/(\p{L})[-¬]\s*\n\s*(\p{L})/gu, "$1$2")) : "";
  const found = text ? ps.filter(p => hay.includes(fold(p))).length : 0;
  const status = !text ? "not checkable by script" : found === ps.length ? "found" : found ? `partly found (${found} of ${ps.length} sentences)` : "NOT FOUND";
  console.log(`${r.id}: ${status}`);
  results.push({ id: r.id, status, method, sentences: ps.length, sentences_found: found, checked: new Date().toISOString() });
}
writeJSON(join(OPS, "02-quote-check.json"), { note: "A script re-found each quotation in its source. 'not checkable by script' means the source is a preview, PDF, or page a script can't read; rely on the how_verified note.", results });
console.log("-> operations/02-quote-check.json");
