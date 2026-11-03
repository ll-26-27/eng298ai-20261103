// Step 2a (deterministic code): fetch the evidence for every candidate.
// For each candidate's source_url it fetches what a checker would read first:
//   - Wikipedia: the article's lead section as plain text (MediaWiki API)
//   - arXiv: the paper's title, authors, and v1 submission date (arXiv API)
//   - DOI: the publication record from Crossref
//   - anything else: the page text, trimmed
// Then it runs a crude automatic test: does the candidate's year appear in that text?
// The test only sorts the work. A person (or a research agent) still reads each entry (step 2b).
// No model is called. Writes 02a-source-extracts.json.
//   node 01-use-cases/maps/02-ai-and-literature-timeline/operations/02a-fetch-sources.mjs
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const UA = { "User-Agent": "eng298ai-timeline-teaching-demo/1.0 (classroom use; contact via github.com/ll-26-27)" };
const { events } = JSON.parse(await readFile(join(here, "01-candidates.json"), "utf8"));

async function wikipedia(url) {
  const title = decodeURIComponent(url.split("/wiki/")[1]).replace(/_/g, " ");
  const api = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exintro=1&redirects=1&format=json&titles=${encodeURIComponent(title)}`;
  let j;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(api, { headers: UA });
    const body = await res.text();
    try { j = JSON.parse(body); break; } catch {
      if (attempt >= 5) throw new Error(`Wikipedia kept refusing: ${body.slice(0, 80)}`);
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1))); // rate-limited: wait and retry
    }
  }
  const page = Object.values(j.query.pages)[0];
  if (page.missing !== undefined) return { ok: false, text: `NO SUCH ARTICLE: ${title}` };
  return { ok: true, resolved_title: page.title, text: page.extract };
}

async function arxiv(url) {
  const id = url.match(/abs\/([\d.]+)/)[1];
  const xml = await (await fetch(`https://export.arxiv.org/api/query?id_list=${id}`, { headers: UA })).text();
  const entry = xml.split("<entry>")[1] || "";
  const pick = (tag) => (entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)) || [])[1]?.trim();
  const authors = [...entry.matchAll(/<name>(.*?)<\/name>/g)].map((m) => m[1]);
  return { ok: !!pick("title"), text: `title: ${pick("title")}\nfirst submitted (v1): ${pick("published")}\nauthors: ${authors.slice(0, 6).join(", ")}${authors.length > 6 ? " et al." : ""}\njournal_ref: ${pick("arxiv:journal_ref") || ""}` };
}

async function crossref(doi) {
  const j = await (await fetch(`https://api.crossref.org/works/${doi}`, { headers: UA })).json();
  const m = j.message;
  const d = (k) => m[k]?.["date-parts"]?.[0]?.join("-");
  return { ok: true, text: `title: ${m.title?.[0]}\ncontainer: ${m["container-title"]?.[0]} vol ${m.volume} issue ${m.issue} pages ${m.page}\nauthors: ${(m.author || []).map((a) => `${a.given} ${a.family}`).join(", ")}\nissued: ${d("issued")}\npublished-print: ${d("published-print")}\npublished-online: ${d("published-online")}` };
}

async function page(url) {
  const html = await (await fetch(url, { headers: UA })).text();
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  return { ok: true, text: text.slice(0, 3000) };
}

async function evidence(url) {
  if (/wikipedia\.org\/wiki\//.test(url)) return wikipedia(url);
  if (/arxiv\.org\/abs\//.test(url)) return arxiv(url);
  if (/doi\.org\/|nature\.com\/articles\//.test(url)) {
    const doi = url.includes("nature.com") ? `10.1038/${url.split("/articles/")[1]}` : url.split("doi.org/")[1];
    return crossref(doi);
  }
  return page(url);
}

// Reuse entries already fetched successfully on an earlier run (Wikipedia rate-limits).
const outFile = join(here, "02a-source-extracts.json");
let previous = {};
try { for (const x of JSON.parse(await readFile(outFile, "utf8")).entries) if (x.fetched_ok) previous[x.id + "|" + x.source_url] = x; } catch {}

const out = [];
for (const e of events) {
  const prev = previous[e.id + "|" + e.source_url];
  if (prev) { out.push(prev); process.stdout.write(prev.year_found_in_source ? "." : "?"); continue; }
  let ev;
  try { ev = await evidence(e.source_url); } catch (err) { ev = { ok: false, text: `FETCH FAILED: ${err.message}` }; }
  const yearStr = e.year < 0 ? `${-e.year} BC` : String(e.year);
  const yearFound = ev.ok && (ev.text.includes(yearStr) || (e.year < 0 && ev.text.includes(String(-e.year))));
  out.push({ id: e.id, track: e.track, title: e.title, claimed_date: e.date_display, claimed_year: e.year, source_url: e.source_url, fetched_ok: ev.ok, year_found_in_source: yearFound, evidence: ev.text?.slice(0, 2500) });
  process.stdout.write(yearFound ? "." : "?");
  await new Promise((r) => setTimeout(r, 1000));
}
await writeFile(outFile, JSON.stringify({ fetched: new Date().toISOString(), count: out.length, entries: out }, null, 2));
const found = out.filter((x) => x.year_found_in_source).length;
console.log(`\n${out.length} fetched; claimed year appears in the source text for ${found}; ${out.length - found} need a closer look`);
