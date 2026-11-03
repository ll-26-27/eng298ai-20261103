// Step 8 (script, deterministic): merge the inventory and every step's data into the page template,
// inline, so outputs/index.html opens by double-click (fetch() of local files fails under file://).
//
//   node 01-use-cases/translation/03-phaedrus-pharmakon/operations/08-build-page.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, OPS, readJSON, parseCSV } from "./lib/openrouter.mjs";

const opt = (f, d) => existsSync(join(OPS, f)) ? readJSON(join(OPS, f)) : d;
const inventory = parseCSV(readFileSync(join(OPS, "01-inventory.csv"), "utf8"));
const { passages } = readJSON(join(OPS, "03-passages.json"));
const R = readJSON(join(OPS, "04-renderings.json"));
const C = opt("05-check.json", { results: [] });
const spot = opt("05b-spot-check.json", { checks: {} }).checks;
const B = opt("06-backtranslations.json", { versions: [] });
const chain = opt("07-chain.json", { runs: [] }).runs;

const pass = Object.fromEntries(passages.map(p => [p.id, p]));
const rend = Object.fromEntries(R.versions.map(v => [v.id, v]));
const chk = Object.fromEntries(C.results.map(v => [v.id, v]));
const back = Object.fromEntries(B.versions.map(v => [v.id, v]));

const versions = inventory.filter(r => r.id !== "grc-burnet").map(r => {
  const p = pass[r.id], v = rend[r.id];
  const ok = p?.ok && v;
  return {
    id: r.id, language: r.language, lang_code: r.lang_code, translator: r.translator, title: r.title, imprint: r.imprint,
    year: r.year ? Number(r.year) : null, edition_used: r.edition_used, copyright: r.copyright, digital_license: r.digital_license,
    status: r.status, why_not: r.why_not, notes: r.notes, source_url: r.source_url, catalogue_urls: r.catalogue_urls,
    pharmakon_word: r.pharmakon_word, pharmakon_category: r.pharmakon_category, pharmakon_source: r.pharmakon_source,
    ...(ok ? {
      passage: p.passage, locate_note: p.note, renderings: v, check: chk[r.id]?.slots, same_word: chk[r.id]?.pharmakon_same_word,
      back_translation: back[r.id]?.back_translation, spot_check: spot[r.id],
    } : {}),
  };
});

const withText = versions.filter(v => v.renderings);
const notFound = C.not_found ?? 0;
const status = `Built ${new Date().toISOString().slice(0, 10)}: ${withText.length} translations with their passage text, ${versions.length - withText.length} more in the inventory as metadata only. ${C.checked ?? 0} extracted renderings checked against their passages by code, ${notFound} not found verbatim.`;

const method_html = `
<ol>
<li><strong>Inventory</strong> (verified research): <code>operations/01-inventory.csv</code>. Agents with web search, briefed by <code>01-inventory-prompt.md</code>, proposed candidates; each row's facts were then checked against the catalogue or scholarly URLs it cites.</li>
<li><strong>Fetch</strong> (deterministic script): <code>02-fetch-texts.mjs</code> downloads each public-domain text, unchanged, into <code>inputs/texts/</code>.</li>
<li><strong>Locate</strong> (code narrows, a model points, code cuts): <code>03-locate-passage.mjs</code>. The stored passage is always cut from the translator's own text by exact first and last words; a model never writes it.</li>
<li><strong>Extract</strong> (model judgment, strict JSON schema): <code>04-extract-prompt.md</code> + <code>04-extract-renderings.mjs</code> pull each rendering, a literal gloss, and a pharmakon category from a fixed list.</li>
<li><strong>Check</strong> (deterministic guardrail + hand spot-check): <code>05-check-renderings.mjs</code> confirms every rendering occurs verbatim in its passage; <code>05b-spot-check.json</code> records a person-style reading of a sample against the Greek.</li>
<li><strong>Back-translate</strong> (model judgment): <code>06-backtranslate.mjs</code>, literal English, for comparison only.</li>
<li><strong>Translate, critique, revise</strong> (model judgment, optional): <code>07-chain.mjs</code>.</li>
<li><strong>Build this page</strong> (deterministic): <code>08-build-page.mjs</code> inlines all the data into <code>08-page-template.html</code>.</li>
</ol>
<p><strong>Distrust:</strong> the categories (an interpretive scheme made for this page); the glosses, back-translations and "what these choices do" notes (a model's readings, which can smooth over what is strange); OCR'd texts (check a word against the page image before quoting it); and any row not marked verified. A ✓ proves the words are the translator's; it does not prove they render the Greek word they are filed under. In-copyright translations appear only as one cited word.</p>
<p class="small sans">Models: ${[...new Set([R.model, B.model, ...passages.filter(p => p.model).map(p => p.model)].filter(Boolean))].join(", ")} via OpenRouter. Full chain, costs and sources: <code>01-use-cases/translation/03-phaedrus-pharmakon/README.md</code>.</p>`;

const data = {
  status, greek: pass["grc-burnet"].passage, greek_crib: back["grc-burnet"]?.back_translation,
  slots: R.slots, categories: R.categories, versions, chain, method_html,
};
const tpl = readFileSync(join(OPS, "08-page-template.html"), "utf8");
const json = JSON.stringify(data).replace(/</g, "\\u003c");
writeFileSync(join(ROOT, "outputs", "index.html"), tpl.replace("/*DATA*/null", () => json));
console.log(status);
