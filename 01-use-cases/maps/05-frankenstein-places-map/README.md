---
title: Frankenstein's places — a fork of the Dickens map
description: The 1818 and 1831 texts of Frankenstein from Project Gutenberg → every named place found passage by passage with a model, tagged by narrator, counted, and geocoded → an interactive map of whose story each place belongs to and what the 1831 revision changed.
author: claude
created: 2026-11-03
---

# Frankenstein's places: a fork of the Dickens map

This folder is a fork of [Dickens's places](../01-dickens-places-map/). It runs the same pipeline (chunk the text, have a model list every place in each chunk, check the quotations, count, geocode, map) on Mary Shelley's *Frankenstein* instead of eight Dickens novels. Open the result by double-clicking `outputs/index.html`.

Three things changed in the fork, because the book asks different questions:

- **Two texts instead of eight novels.** The 1818 first edition and the 1831 revised edition are the two "novels", so the map can show what Shelley's revision did to the book's geography.
- **A narrator for every passage.** *Frankenstein* is a frame tale: Walton's letters to his sister hold Victor's narrative, which holds the Creature's. Each chunk is tagged with its narrator, from the chapter structure (step 1), and the map colours by narrator by default.
- **A continent and an ocean instead of a city.** The views are Europe, Geneva and the Alps, the Rhine, Britain, the Arctic, and the world, not London and the City. Chunks are about 1,000 words, not 2,000, because the book is short.

## The pipeline

Run in order. Each step says whether it is **deterministic code** (same input, same output, every time) or **model judgment** (a language model reading and deciding). Steps 3c and the narrator tagging are new; the rest are the Dickens scripts adapted.

0. **`operations/00-fetch-texts.mjs`** (script, deterministic). Downloads the two texts from Project Gutenberg into `inputs/`, unchanged. It also records, for each text, which chapters are the Creature's tale.
1. **`operations/01-clean-and-chunk.mjs`** (script, deterministic). Strips Gutenberg's header and licence, finds the Preface, letters, volumes, and chapters, splits off "Walton, *in continuation*" in the last chapter, tags each section with its narrator, and cuts each section into chunks of about 1,000 words at paragraph breaks. Writes `operations/data/chunks/<text>.jsonl`.
2. **`operations/02-extract-places.prompt.md`** (prompt, model judgment) and **`operations/02-extract-places.mjs`** (script that sends it). For every chunk, the model returns every place named in it as structured JSON: the name as written, a normalized modern name, a type (town, mountain or glacier, water, island, region, country, building, fictional…), whether the scene is *set* there or the place is only *mentioned*, and a quotation of no more than 25 words. The chunk's narrator is given to the model and copied onto every mention. Writes `operations/data/02-places-raw.jsonl`.
3. **`operations/03-inventory.mjs`** (script, deterministic). Checks every quotation against the chunk it came from, merges spelling variants, and counts mentions per place, per edition, per narrator, and per chapter. A short, commented `ALIASES` table merges ten names the model gave to the same place in different passages (Belrive and Bellerive, the Salève and Mont Salève, three forms of the Arve). Writes **`operations/03-places-inventory.csv`** and `operations/data/03-mentions.jsonl`.
    - **3b. `operations/03b-recall-check.mjs`** (script, deterministic audit). Two spot checks on what the model missed: a pattern for names like "Orkney Islands" or "Lake of Geneva", and a cross-passage check that looks for every capitalized name the model found anywhere ("Geneva", "Leghorn") in every chunk where it wasn't listed. Writes `operations/data/03b-recall-misses.csv`.
    - **3c. `operations/03c-edition-check.mjs`** (script, deterministic audit). For each place found in only one edition, searches the other text for the same words, separating Shelley's revisions from places the model listed in one text and missed in the other. Writes `operations/data/03c-edition-only.csv`; the map uses it.
4. **`operations/04-geocode.mjs`** (script, deterministic lookup). Looks each real place up in OpenStreetMap's Nominatim gazetteer, at most one request a second, caching every answer. The Dickens version searched London places inside a London box; this one searches inside the country named in the normalized name ("Lake Geneva, Switzerland" only in Switzerland), prefers a town to the province named after it, never lets a sea, range, or region match a settlement, and retries a mountain or river by its bare name. A result is accepted only if its name contains the place's name and it is the right kind of feature. Writes **`operations/04-places-geocoded.csv`**.
    - **4b. `operations/04b-geocode-model-help.mjs`** (script with an inline prompt, model judgment). For every place the gazetteer could not resolve, asks a stronger model where it is, with a confidence and its reasoning. High- and medium-confidence answers are labelled `model estimate` and drawn with dashed circles; low-confidence answers are kept in the CSV only.
5. **`operations/05-map-design.prompt.md`** (prompt, a design conversation). The brief for what the map should make visible, adapted from the Dickens brief.
6. **`operations/06-build-map.mjs`** with **`operations/06-map-template.html`** (script, deterministic). Embeds the data in the page and writes `outputs/index.html`.

`operations/openrouter.mjs` is the Dickens project's helper, unchanged except for its request title.

Output: **`outputs/index.html`**, a Leaflet 1.9.4 map on Esri's light gray base map, with Esri's shaded relief (for the Alps), Esri's street map, and OpenStreetMap in the layer switcher. Colour by narrator or by edition; filter by either; count only settings; hide model estimates or the countries, continents, and seas; set a minimum number of mentions; search; and click any circle to read every passage that names it, tagged with edition, chapter, narrator, and role. Beside the map: a table of who names which places, the places found in only one edition, and the places not on the map. A link such as `index.html#place=mer%20de%20glace` opens one place directly (the ids are the `place_id` column of the CSVs). It needs an internet connection for the map tiles and Leaflet; the data is inside the page.

## Rerun it

From the repo root (the folder with `.env`), with Node 20.6 or later and an OpenRouter key in `.env` as `OPENROUTER_API_KEY`:

```
node 01-use-cases/maps/05-frankenstein-places-map/operations/00-fetch-texts.mjs
node 01-use-cases/maps/05-frankenstein-places-map/operations/01-clean-and-chunk.mjs
node --env-file=.env 01-use-cases/maps/05-frankenstein-places-map/operations/02-extract-places.mjs
node 01-use-cases/maps/05-frankenstein-places-map/operations/03-inventory.mjs
node 01-use-cases/maps/05-frankenstein-places-map/operations/03b-recall-check.mjs
node 01-use-cases/maps/05-frankenstein-places-map/operations/03c-edition-check.mjs
node 01-use-cases/maps/05-frankenstein-places-map/operations/04-geocode.mjs
node --env-file=.env 01-use-cases/maps/05-frankenstein-places-map/operations/04b-geocode-model-help.mjs
node 01-use-cases/maps/05-frankenstein-places-map/operations/06-build-map.mjs
```

Model answers and gazetteer lookups are cached in `operations/data/cache/`, so a rerun with the same prompt and model costs nothing and sends nothing. Change the prompt in `02-extract-places.prompt.md` and step 2 starts fresh. Every model run appends its token counts and cost to `operations/cost-log.csv`.

To fork it again: change the texts in `00-fetch-texts.mjs` (and the rule that says which chapters belong to which narrator), the heading patterns in `01-clean-and-chunk.mjs`, the prompt, and the views in the template.

## Methods and findings

The numbers from this run: 187 chunks (93 from the 1818 text, 94 from the 1831); 494 place mentions, counted once per passage; 133 distinct places. Of these, 118 are on the map (101 located by the gazetteer, 17 estimated by the model), covering 470 of the 494 mentions. The other 15 are listed beside the map: unnamed or invented places, places outside the world's maps (Paradise, Pandæmonium), and six real places nobody could locate.

**Completeness of the reading.** The chunks hold 72,551 of the 72,699 words between Gutenberg's markers in #41445 and 74,916 of 75,042 in #84. What is not chunked is the title pages, dedication, epigraph, volume headings, and the 1831 file's contents list, none of which names a place outside a book title. The 1818 Preface is read and has its own narrator, "Preface". #84 does not include Shelley's 1831 Introduction (the account of the summer of 1816 near Geneva), so its places are not in the data; the 1831 Preface is also absent from that file.

**Who names the places.** The narrators' shares of the words and of the place mentions differ, and the pattern is the same in both texts:

| narrator | words, 1818 | share | mentions, 1818 | share | mentions, 1831 | of which "setting", both texts |
| --- | --- | --- | --- | --- | --- | --- |
| Preface | 574 | 1% | 4 | 2% | — | 1 |
| Walton | 10,120 | 14% | 22 | 9% | 23 | 9 |
| Victor | 46,928 | 65% | 199 | 81% | 200 | 199 |
| The Creature | 14,929 | 21% | 22 | 9% | 24 | 27 |

Victor's narrative is the book's itinerary: Geneva, Ingolstadt, Chamonix and the Mer de Glace, the Rhine, London, Oxford, Cumberland, Edinburgh, Perth, the Orkneys, Ireland, and the chase to the Arctic. The Creature tells a fifth of the book and names a tenth of its places. Most of his named places belong to the De Lacey and Safie story he overhears (Paris, Leghorn, Constantinople), not to his own scenes, which take place in unnamed woods and a hovel by a cottage "in Germany". Walton's places are a sailor's: Archangel, St Petersburg, the pole.

**What the 1831 revision changed.** The model found 29 places in one edition only; step 3c checked each against the other text. Sixteen are differences in the text:
- **Only in 1831** (10): Lake Como, Milan, Naples, and the Villa Lavenza, from the rewritten account of Elizabeth's Italian origins; Austria; Roncesvalles; India; the Holy Sepulchre; the "Frozen Ocean"; and the university at Ingolstadt under a new phrase.
- **Only in 1818** (6): Dublin, Holyhead, and Portsmouth, from Victor's return from Ireland; Cologny; and two unnamed places in Ireland (a county town and an inn).

The other 13 are in both texts, and the model listed them in only one (Africa, the Arveiron, Uri, Pandæmonium, the "land of mist and snow"…); the map shows those in grey. For every change between the editions, not just places, see [*Frankenstein* revisions](../../distant-reading/01-frankenstein-revisions/).

**Recall.** The pattern check found 27 names; the model listed 26 (96%; the miss is "Tintern Abbey", the title of Wordsworth's poem in an 1831 note, rightly skipped). The cross-passage check found 477 passages containing a name the model had listed elsewhere; the model listed the name in 461 of them (97%). Of the 16 misses, most are not places on a map: "Paradise" in *Paradise Lost* (7), the nationality "Irish" (2), *The Vicar of Wakefield*, Pandæmonium, Fairy-land, "Genevan". The real misses are London (twice) and the "Juras". Recall for names the model never found anywhere was not measured.

**Quotations.** 486 of 494 quotations (98.4%) were found verbatim in their chunk after normalizing curly quotes; the map flags the other eight. A verified quotation proves the passage exists, not that it names the place: the model sometimes lists a place that the passage only implies ("the town" as Geneva, "the Irish" as Ireland).

**Narrator tagging** is by chapter, not by model. Walton has the four letters and everything after "Walton, *in continuation*"; the Creature has Vol. II, Chapters 3–8 (1818) and Chapters 11–16 (1831); Victor has the rest. Two edges are approximate. The Creature's first words ("Listen to my tale") close a chapter tagged as Victor's. And Victor's narrative is technically Walton's transcription, which the tagging does not represent.

**Setting versus mentioned** is model judgment, and in a frame tale it is a subtle one. The De Lacey family's Paris is marked a setting of the Creature's narrative because the story he tells happens there. Spot-check before arguing from the "only scenes set there" view.

**Gazetteer matches are modern.** The first geocoding run accepted Lake Geneva in Indiana, Lake Andes in South Dakota, the centre of Arkhangelsk Oblast for Archangel, and the town of North Pole, Alaska. The country restriction and the settlement rule in step 4 fixed these; the cached first-run lookups are still in `data/cache/nominatim/`. Known remaining errors:
- **"The river Drance"**, passed on the lake between Geneva and Évian, is the Dranse in Chablais. The model normalized it as "Drance, Switzerland", and the gazetteer found the Nant de Drance in Valais.
- **The University of Ingolstadt** resolves to a building of the modern Catholic University of Eichstätt-Ingolstadt. The university Victor attended moved to Landshut in 1800. The point is in the right town.
- **Large features are points.** London is Greater London's centroid, Edinburgh the council area's, and the Rhône is wherever Nominatim puts the river's label.

**Model estimates (dashed circles)** come from `anthropic/claude-sonnet-5.5`, with a confidence and a one-line reason (the `model_note` column). For ranges and rivers it gives a representative point and says which one: the Alps and the "Alps of Savoy" at Mont Blanc, the Rhine at Koblenz on the stretch Victor and Clerval sail, the Andes at Aconcagua. The North Pole is at 90°N, beyond Web Mercator; the map draws it at 84.5°N and says so. Low-confidence estimates are recorded but not drawn: the Scottish Highlands, Tartary, the church and forest at Ingolstadt, and Villa Lavenza, which the model identifies as Shelley's invention.

**Not on the map, and why that matters.** The places the novel's plot turns on are often unnamed: the hovel, the De Laceys' cottage, the Orkney island of the second creature, the Irish town of Victor's arrest. Moretti's method maps names, so this map shows the itinerary of *Frankenstein*'s travels better than the sites of its events.

## Models and cost

| step | model (OpenRouter ID) | requests | tokens in / out | cost |
| --- | --- | --- | --- | --- |
| 2, extraction | `anthropic/claude-haiku-5.5` | 187 | 544K / 121K | $0.115 |
| 4b, geocoding help | `anthropic/claude-sonnet-5.5` | 2 batches of up to 12 places | 5.7K / 5.0K | $0.061 |
| **total** | | | | **about $0.18** |

The model IDs are the Dickens run's, from the same day. Every call used temperature 0 and a strict JSON schema; answers are cached, and the figures above are the whole bill, logged in `operations/cost-log.csv`. The extraction took about two minutes at twelve requests in flight; the gazetteer lookups about four minutes at one a second across both runs.

## Sources and copyright

| text | Project Gutenberg ebook | file in `inputs/` | notes |
| --- | --- | --- | --- |
| *Frankenstein; or, The Modern Prometheus*, 1818 text (London: Lackington, Hughes, Harding, Mavor, & Jones; three volumes) | [#41445](https://www.gutenberg.org/ebooks/41445) · [text](https://www.gutenberg.org/cache/epub/41445/pg41445.txt) | `pg41445-frankenstein-1818.txt` | with the Preface; the same edition as `context/course-readings/course-readings-md/shelley-frankenstein-1818.md` |
| *Frankenstein; or, The Modern Prometheus*, 1831 text (London: Colburn and Bentley; one volume) | [#84](https://www.gutenberg.org/ebooks/84) · [text](https://www.gutenberg.org/cache/epub/84/pg84.txt) | `pg84-frankenstein-1831.txt` | identified as the 1831 text by its contents (24 chapters; Elizabeth as "the daughter of a Milanese nobleman"); lacks the 1831 Introduction and Preface |

- **The texts** are in the public domain in the United States. The files are kept exactly as downloaded on 2026-11-03, including Project Gutenberg's header and licence. Gutenberg's transcriptions are not critical editions; don't make edition-level textual claims from them without checking a printed text.
- **Map tiles and gazetteer results** are © OpenStreetMap contributors, under the Open Database Licence; the base maps and shaded relief are Esri's, shown with Esri's attribution. Nominatim's [usage policy](https://operations.osmfoundation.org/policies/nominatim/) allows at most one request a second, requires an identifying User-Agent, and asks for caching, all of which `04-geocode.mjs` does.
- **Moretti's *Atlas*** is in copyright and is cited, not quoted.
