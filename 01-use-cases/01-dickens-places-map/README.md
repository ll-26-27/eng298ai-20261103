---
title: Dickens's places — a Moretti-style map
description: Eight Dickens novels from Project Gutenberg → every named place found chunk by chunk with a model, counted, and geocoded → an interactive map of where the novels live.
author: claude
created: 2026-11-03
---

# Dickens's places: a Moretti-style map

This folder takes eight London novels by Charles Dickens, has a language model find every named place in them passage by passage, counts and locates those places, and draws them on an interactive map you can open by double-clicking `outputs/index.html`.

The model is Franco Moretti's *Atlas of the European Novel, 1800–1900* (London: Verso, 1998), which maps where nineteenth-century novels take place; its publisher describes it as revealing "the secret structure of Dickens's and Conan Doyle's London" ([Verso](https://www.versobooks.com/products/1630-atlas-of-the-european-novel); see also Christopher Prendergast's review in the [*London Review of Books*](https://www.lrb.co.uk/v20/n21/christopher-prendergast/by-the-width-of-a-street)). This version was made in a morning by a model and a few scripts. It is much rougher than Moretti's maps, but its shape (inputs, operations, outputs, each step checkable) is one you can copy for your own project.

## The pipeline

Run in order. Each step says what kind of thing it is and whether it is **deterministic code** (same input, same output, every time) or **model judgment** (a language model reading and deciding).

0. **`operations/00-fetch-texts.mjs`** (script, deterministic). Downloads the eight novels from Project Gutenberg into `inputs/`, unchanged.
1. **`operations/01-clean-and-chunk.mjs`** (script, deterministic). Strips Gutenberg's header and licence, finds the chapter headings, and cuts each chapter into chunks of about 2,000 words at paragraph breaks, each labelled with novel, book, chapter, and part. Writes `operations/data/chunks/<novel>.jsonl`. Chunking is what guarantees that every page is read: a single request to "list every place in *Bleak House*" is brittle and can't be checked.
2. **`operations/02-extract-places.prompt.md`** (prompt, model judgment) and **`operations/02-extract-places.mjs`** (script that sends it). For every chunk, the model returns every place named in it, as structured JSON: the name as written, a normalized name, a type (street, building, district, town, fictional…), whether the scene is *set* there or the place is only *mentioned*, whether it is in London, and a quotation of no more than 25 words. The answer must match a JSON schema, so it can't wander into prose. Writes `operations/data/02-places-raw.jsonl`.
3. **`operations/03-inventory.mjs`** (script, deterministic). Checks every quotation against the chunk it came from, merges spelling variants of the same place, and counts mentions per place, per novel, and per chapter. Writes **`operations/03-places-inventory.csv`** (one row per place: open it in a spreadsheet) and `operations/data/03-mentions.jsonl` (one row per mention).
    - **3b. `operations/03b-recall-check.mjs`** (script, deterministic audit). A crude pattern finds names like "Cursitor Street" or "Golden Square" in every chunk and checks whether the model listed them, as a spot check on what the model missed. Writes `operations/data/03b-recall-misses.csv`.
4. **`operations/04-geocode.mjs`** (script, deterministic lookup). Looks each real place up in OpenStreetMap's Nominatim gazetteer (London places searched inside London), at most one request a second, caching every answer to disk. A result is accepted only if its name contains the words of the place's name and it is the right kind of feature (a street for a street, a town for a town); otherwise the place is left unresolved rather than guessed. Writes **`operations/04-places-geocoded.csv`**.
    - **4b. `operations/04b-geocode-model-help.mjs`** (script with an inline prompt, model judgment). For unresolved places mentioned at least twice, asks a stronger model where they were in Dickens's day, with a confidence and its reasoning. High- and medium-confidence answers are labelled `model estimate` in the CSV and drawn with dashed circles on the map; low-confidence answers are kept in the CSV only.
5. **`operations/05-map-design.prompt.md`** (prompt, a design conversation). The short brief for what the map should make visible: which parts of London each novel lives in, setting versus passing mention, how sure we are, and the evidence behind each circle.
6. **`operations/06-build-map.mjs`** with **`operations/06-map-template.html`** (script, deterministic). Embeds the data in the page and writes `outputs/index.html`.

`operations/openrouter.mjs` is the small helper the model steps share: one call to OpenRouter with a JSON schema, retries, and the cost log.

Output: **`outputs/index.html`**, a Leaflet 1.9.4 map on Esri's light gray base map, with Esri's street map and OpenStreetMap in the layer switcher. (OpenStreetMap's own tile servers can refuse a page opened by double-clicking, showing "403 Access blocked", and CARTO's base maps now need an API key, so Esri's keyless tiles are the default.) Filter by novel, count only settings, hide model estimates, set a minimum number of mentions, jump to London, the City, Britain, or abroad, search for a place, and click any circle to read every passage that names it. A link such as `index.html#place=marshalsea%20prison` opens one place directly (the ids are the `place_id` column of the CSVs). It needs an internet connection for the map tiles and Leaflet; the data is inside the page. If the tiles ever show "access blocked" when the file is opened from disk, switch to the CARTO layer or serve the folder (`python3 -m http.server`).

## Rerun it

From the repo root (the folder with `.env`), with Node 22 or later and an OpenRouter key in `.env` as `OPENROUTER_API_KEY`:

```
node mk-projects/01-dickens-places-map/operations/00-fetch-texts.mjs
node mk-projects/01-dickens-places-map/operations/01-clean-and-chunk.mjs
node --env-file=.env mk-projects/01-dickens-places-map/operations/02-extract-places.mjs
node mk-projects/01-dickens-places-map/operations/03-inventory.mjs
node mk-projects/01-dickens-places-map/operations/03b-recall-check.mjs
node mk-projects/01-dickens-places-map/operations/04-geocode.mjs
node --env-file=.env mk-projects/01-dickens-places-map/operations/04b-geocode-model-help.mjs
node mk-projects/01-dickens-places-map/operations/06-build-map.mjs
```

Model answers and gazetteer lookups are cached in `operations/data/cache/`, so a rerun with the same prompt and model costs nothing and sends nothing. Change the prompt in `02-extract-places.prompt.md` and step 2 starts fresh (the cache is keyed by a hash of the prompt and model). To try one novel, pass its slug: `02-extract-places.mjs great-expectations`. Every model run appends its token counts and cost to `operations/cost-log.csv`.

To adapt it: swap the texts in `00-fetch-texts.mjs`, adjust the chapter-heading pattern in `01-clean-and-chunk.mjs`, and rewrite the prompt for your author and your question (a Paris novel, a travel narrative, a body of letters).

## What a scholar must check

The numbers from this run: 1,290 chunks; 3,644 place mentions (counted once per passage); 1,116 distinct places; 586 of them on the map (496 located by the gazetteer, 90 estimated by the model), covering 2,705 of the 3,644 mentions. The other 530 places are listed beside the map, not dropped.

- **A "mention" is a passage, not an occurrence.** The prompt asks for each place once per ~2,000-word chunk, so fifty uses of "the Marshalsea" in one chapter-section count once. That is a choice; it measures how widely a place is spread through a novel, not how often its name recurs.
- **Recall (did the model miss places?).** `03b-recall-check.mjs` finds capitalized names ending in Street, Square, Court, Bridge, Inn, and so on with a plain pattern, and checks whether the model listed them: it did for 500 of 531 (94%). Most of the 31 misses are courts as legal bodies, which the prompt told it to skip, or pattern false alarms; a few are real misses ("Marshalsea Gate", "Stepney Fields"). Recall for single-word places (towns, districts) was not measured.
- **Quotations.** 99% of quotations (3,606 of 3,644) were found verbatim in their chunk after normalizing curly quotes; the map flags the rest. A verified quotation proves the passage exists, not that it names the place: the model sometimes counts "the prison" or "the College" as the Marshalsea, which is a reasonable reading but an interpretation.
- **Setting versus mentioned** is model judgment, and so is `in_london`. Spot-check before arguing from the "only scenes set there" view.
- **Merging.** Places are merged on the part of the normalized name before the first comma. This joins "Cook's Court" with "Cook's Court, Cursitor Street", which is right, and also the London and Plymouth Custom Houses or the Covent Garden and Brighton Theatres Royal, which is wrong. The `variants` column of `03-places-inventory.csv` shows what was merged.
- **Gazetteer matches are modern.** Nominatim knows today's map. A match is accepted only if the result's name contains the place's name and it is the right kind of feature, which rejects most namesakes (Brighton, New Jersey; a "West Indies" suburb in Kenya), but some slip through: "Custom House" resolves to the modern Custom House district in east London, not the building on Lower Thames Street; "Norwood" lands on Upper Norwood. Demolished and renamed places (Newgate, the King's Bench, Barnard's Inn) mostly fail in the gazetteer; the model step rescues the best known of them, but hundreds of single-mention streets, courts, and inns stay unresolved, so **the map under-represents the London that no longer exists**, much of it the poorer London Dickens wrote about. Check what each match actually is: Temple Bar resolves to "Temple Bar, Fleet Street", which happens to be the original site (the gate itself was moved away in 1878), but a gazetteer could as easily have returned the relocated gate.
- **Model estimates (dashed circles)** come from `anthropic/claude-sonnet-5.5` with a confidence and a one-line reason (in the `model_note` column). Only high- and medium-confidence estimates are mapped; low ones, including guesses at where fictional houses stood, are recorded but not drawn. They are plausible and unverified. Some are informed identifications rather than locations (Miss Havisham's house as Restoration House, Rochester).
- **The texts** are Project Gutenberg's transcriptions, which follow various later printings; chapter numbering is detected by pattern and was checked against each novel's known chapter count (53, 5, 62, 64, 67, 70, 59, 67).

## Models and cost

| step | model (OpenRouter ID) | requests | tokens in / out | cost |
| --- | --- | --- | --- | --- |
| 2, extraction | `anthropic/claude-haiku-5.5` ($0.10 / $0.50 per million tokens) | 1,290 | 5.86M / 1.07M | $1.12 |
| 4b, geocoding help | `anthropic/claude-sonnet-5.5` ($2 / $10 per million tokens) | 7 batches of up to 25 places (+1 test) | 31K / 36K | $0.43 |
| **total** | | | | **about $1.55** |

Prices and IDs were checked against OpenRouter's model list on 2026-11-03. Every call used temperature 0 and a strict JSON schema (`response_format`); answers are cached, so the figures above are the whole bill, logged line by line in `operations/cost-log.csv`. The extraction took about ten minutes at twelve requests in flight; the gazetteer lookups about twenty minutes at one a second.

## Sources and copyright

| novel | first published in book form | Project Gutenberg ebook | file in `inputs/` |
| --- | --- | --- | --- |
| *Oliver Twist* | 1838 | [#730](https://www.gutenberg.org/ebooks/730) · [text](https://www.gutenberg.org/cache/epub/730/pg730.txt) | `pg730-oliver-twist.txt` |
| *A Christmas Carol* | 1843 | [#46](https://www.gutenberg.org/ebooks/46) · [text](https://www.gutenberg.org/cache/epub/46/pg46.txt) | `pg46-a-christmas-carol.txt` |
| *Dombey and Son* | 1848 | [#821](https://www.gutenberg.org/ebooks/821) · [text](https://www.gutenberg.org/cache/epub/821/pg821.txt) | `pg821-dombey-and-son.txt` |
| *David Copperfield* | 1850 | [#766](https://www.gutenberg.org/ebooks/766) · [text](https://www.gutenberg.org/cache/epub/766/pg766.txt) | `pg766-david-copperfield.txt` |
| *Bleak House* | 1853 | [#1023](https://www.gutenberg.org/ebooks/1023) · [text](https://www.gutenberg.org/cache/epub/1023/pg1023.txt) | `pg1023-bleak-house.txt` |
| *Little Dorrit* | 1857 | [#963](https://www.gutenberg.org/ebooks/963) · [text](https://www.gutenberg.org/cache/epub/963/pg963.txt) | `pg963-little-dorrit.txt` |
| *Great Expectations* | 1861 | [#1400](https://www.gutenberg.org/ebooks/1400) · [text](https://www.gutenberg.org/cache/epub/1400/pg1400.txt) | `pg1400-great-expectations.txt` |
| *Our Mutual Friend* | 1865 | [#883](https://www.gutenberg.org/ebooks/883) · [text](https://www.gutenberg.org/cache/epub/883/pg883.txt) | `pg883-our-mutual-friend.txt` |

- **The novels** were all published in the 1830s–60s and are in the public domain in the United States. The files are kept exactly as downloaded on 2026-11-03, including Project Gutenberg's header and licence. (Gutenberg's transcriptions follow various later printings; don't make edition-level textual claims from them.)
- **Map tiles and gazetteer results** are © OpenStreetMap contributors, available under the Open Database Licence; the map shows the required attribution. Nominatim's [usage policy](https://operations.osmfoundation.org/policies/nominatim/) allows at most one request a second, requires an identifying User-Agent, and asks for caching, all of which `04-geocode.mjs` does. The base maps are Esri's (light gray canvas with labels, and the street map), shown with Esri's attribution; the OpenStreetMap layer is optional and may be blocked when the page is opened from the file system.
- **Historical base map:** a nineteenth-century Ordnance Survey layer from the National Library of Scotland would be the obvious addition, but its tile URLs and terms of use could not be confirmed while building this, so it is left out.
- **Moretti's *Atlas*** is in copyright and is cited, not quoted beyond the publisher's description.
