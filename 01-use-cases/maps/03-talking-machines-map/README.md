---
title: "where does the machine speak from?"
description: A map of where talking machines were imagined, built, and trained, from Homer's golden attendants to the papers behind the assistant, built from the timeline (maps/02-ai-and-literature-timeline)'s verified timeline plus the course's AI papers, with every place sourced and every coordinate from a gazetteer.
author: claude
created: 2026-11-03
---

# where does the machine speak from?

Franco Moretti's *Atlas of the European Novel* maps the space inside novels, and the Dickens map (maps/01-dickens-places-map) does the same for Dickens. This map does the opposite: it marks where the works that imagined talking machines were made, where the machines that spoke were built or shown, and where the papers that shaped today's assistant were written. Drag the year slider and one thing becomes visible in two seconds: **the dream of the speaking artifact was written across Eurasia for two and a half millennia; the machine itself was built in a handful of cities in about sixty years; and the modern assistant was trained in about half a dozen in ten.**

**Open it:** double-click `outputs/index.html`. The data is inside the file; the base map tiles and the Leaflet library load from the internet. Click a circle to read every row at that place, with its date, source, and the reasoning for the place. `index.html#eliza` opens on one row (ids are the first column of `operations/03-geocoded.csv`).

## The question

Where does the voice we talk to come from? Not where the story is set (Talos guards Crete) but where the imagining happened (Apollonius wrote in Alexandria), where the first machines actually pronounced words (Vienna, Philadelphia, a World's Fair in Queens), and where the people who built the assistant sat (Mountain View, San Francisco, London). Put the three on one map with a clock and the shape of the history is a geographic fact as well as a chronological one.

## The layers

| layer | rows | distinct points | what counts |
| --- | --- | --- | --- |
| **Imagined** (red) | 35 | 30 | every event in the `made-beings` lane of the timeline (maps/02-ai-and-literature-timeline): made beings in literature, legend, and film, Homer to Ishiguro |
| **Course readings** (gold) | 8 | 8 | the literary works on the syllabus: *Phaedrus*, *Analects*, *Frankenstein*, *Dorian Gray*, *The Critic as Artist*, *Laughter*, *R.U.R.*, the 1931 film |
| **Built** (blue) | 15 | 10 | machines that spoke or conversed: ten from the timeline (maps/02-ai-and-literature-timeline)'s computing lane (ELIZA, SHRDLU, PARRY, the Loebner Prize, Siri, GPT-2, ChatGPT, Claude, GPT-4, Claude Code) and five added here (Kempelen's speaking machine, Faber's Euphonia, the Voder, Xiaoice, Alexa) |
| **Trained** (green) | 22 | 11 | the 22 papers in `context/LL-readings/papers-on-ai-md/`, placed by the first author's affiliation as printed |

80 rows at 52 distinct points. Each row also carries **`speaks`**: does the made being speak or converse in the work? 38 yes, 14 no (Vaucanson's flautist, the Mechanical Turk, Dorian's portrait, Karloff's Monster), 3 unclear (Olimpia's "Ah, ah!"), 25 not applicable (papers and theory). The filter on the page lets you watch only the speaking ones arrive.

## The place rule

Applied the same way to every row and recorded in the `place_kind` column:

1. **Imagined works**: the place of **composition** if a source documents where the author wrote it; otherwise **first publication** (the publisher's or periodical's city) or **first performance** (the premiere venue); for a film with no recorded premiere, the studio.
2. **Legends** (Talos, the golem, Albertus's brazen head, the Liezi): the place the tradition attaches the being to, or where the text that records it was compiled, with `certainty: low` and dashed circles.
3. **Machines**: where built, exhibited, or described in print; for software from a company, the organisation's headquarters city (`certainty: medium`) unless a source gives the office.
4. **Papers**: the first author's affiliation as printed. A printed city is `high`; an organisation name alone becomes its headquarters city per a page opened, `medium`.

Every row has a `place_note` a reader can check and the URLs that were opened. Certainty across the 80 rows: 41 high, 34 medium, 5 low.

## The chain

Inputs, numbered operations, one output. Each step says whether it is **deterministic code**, **model judgment**, or **verified research**.

**Inputs.** `inputs/03-events-verified.csv` and `inputs/03-events-categorized.json` are copied from the timeline (maps/02-ai-and-literature-timeline), the timeline whose 116 events were drafted by a model and then checked one by one against a source: an output of one use case becomes the input of another. `inputs/course-readings.json` is 03's reading list. The 22 papers are read in place from `context/LL-readings/papers-on-ai-md/`, with the course's one-paragraph notes from `papers-on-ai-notes.md`.

1. **`operations/01-select.mjs`** (deterministic code). Chooses the rows: the whole made-beings lane, the eight literary readings, the ten conversational machines, the 22 papers. The lists are constants at the top of the script, so the selection is an argument you can read. Writes `01-candidates.json`.
2. **`operations/02-places-prompt.md` → `02-places.json` and `02a-affiliations.json`** (model judgment and verified research). The brief, then the result: for each candidate a place, its kind, its certainty, a note, the pages opened, and the `speaks` judgment. This was done by Claude Code in the building session, opening about sixty Wikipedia articles, catalogue records, and publisher pages, plus the header of each paper. Nothing was written from memory; where no page gave a place, the row says so (`certainty: low`) or was left out (`excluded`, with reasons: machine translation and Deep Blue are not talking machines; A.L.I.C.E. had no sourced place).
3. **`operations/03-geocode.mjs`** (deterministic lookup). Sends each of the 52 distinct place names to OpenStreetMap's Nominatim, at most one request a second, with an identifying User-Agent, caching every answer in `operations/cache/`. A result is accepted only if its name contains every word of the place and most words of its qualifier (city, state, country); the first version of that test let "Paternoster Row, London" land on a Paternoster Row in Essex and "79 Seventh Avenue, New York" in upstate New York, so the queries were made more specific and the test tightened. Wikidata (property P625) is the fallback if Nominatim is down or rejects a name; in the final run it was not needed. Writes `03-geocoded.csv` (open it in a spreadsheet) and `03-rows.json`.
4. **`operations/04-build.mjs`** with **`04-template.html`** (deterministic code). Embeds the data and writes `outputs/index.html`: Leaflet 1.9.4 on Esri's light-gray canvas, a year slider over the sorted list of years (so 750 BCE and 2026 both get room), layer toggles, the `speaks` filter, a search box, per-layer counts of rows and places that update as you drag, a detail panel for the place you click, and the list of anything unmapped.

## How to rerun

From the repo root, Node 22 or later. No API key is needed: the only network calls are to the gazetteer, and they are cached.

```
node 01-use-cases/maps/03-talking-machines-map/operations/01-select.mjs
node 01-use-cases/maps/03-talking-machines-map/operations/03-geocode.mjs
node 01-use-cases/maps/03-talking-machines-map/operations/04-build.mjs
```

Step 2 is research, not a script. To add a row, give `02-places-prompt.md` to Claude Code (or a person) with the new candidate, open the sources, and add the row to `02-places.json` under `rows` (if it exists in the timeline (maps/02-ai-and-literature-timeline)) or `added` (if not); then rerun from step 3. To change what the map is about, edit the lists at the top of `01-select.mjs` and redo step 2 for the new rows.

## What verification caught

- **Gazetteers match names, not meanings.** The first geocoding run placed three rows wrongly on a name match alone (see step 3). The fix was two-fold: more specific queries and a stricter test. Every accepted match is recorded in `geo_match`; read it before trusting a point.
- **Jacobs University Bremen no longer exists under that name.** OpenStreetMap has the campus as Constructor University (renamed 2023); the query uses the current name and the note says so.
- **The Markdown extraction of one paper lost its affiliation.** `2203.15556` (Chinchilla) prints only "Equal contributions" in the course's Markdown; the arXiv PDF and the NeurIPS record give DeepMind. Recorded as such, `certainty: medium`.
- **Headquarters are not desks.** Patrick Lewis (RAG) was at Facebook AI Research *and* University College London; Hugo Touvron (LLaMA) at Meta AI in Paris, while Wikipedia lists Meta AI's headquarters in New York. Both rows follow the first author's documented office rather than the company's address, and say so.
- **Al-Jazari's court.** Wikipedia's lead names the Artuklu Palace of the "Mardin branch" of the Artuqids; two other sources place him at Amid (Diyarbakır). The row uses Diyarbakır and records the disagreement.
- **Premieres beat releases.** The timeline (maps/02-ai-and-literature-timeline) had already corrected the 1931 *Frankenstein* and *R.U.R.* dates; here the same care gives *Forbidden Planet* a premiere at a convention in Charlotte, North Carolina, rather than Hollywood, and *A.I.* a premiere in Venice.

## Methods and findings

- **The place rule is a convention, not a fact about the works.** Composition beats publication where documented, so *Frankenstein* is at Cologny and *Dorian Gray* at Tite Street, but *Erewhon* is at Paternoster Row because nothing opened says where Butler wrote it. Change the rule and the map moves. The `place_kind` column shows which clause each row used.
- **Low-certainty rows are placements, not locations.** Homer at Smyrna, the Liezi at Nanjing, the Talmud at Ctesiphon, and the brazen head at Cologne stand for traditions and regions. They are dashed on the map and should not be read as points.
- **"Headquarters" rows (34 of 80 are `medium`) locate organisations, not people.** Google, OpenAI, Anthropic, DeepMind, and Microsoft all have offices in many cities; a paper with no printed city is drawn at the company's seat.
- **The `speaks` column is a reading.** It was decided from the source summaries and the course's descriptions, not from re-reading every work. Olimpia, the Liezi's artificial man, and Forster's Machine are marked unclear on purpose.
- **Selection is inherited from the timeline (maps/02-ai-and-literature-timeline).** The imagined layer is exactly 03's made-beings lane, whose canon is heavily Anglo-European; the five added machines are the builder's choice. What is absent is worth arguing about. A.L.I.C.E., Jabberwacky, Eugene Goostman, Replika, and non-Western automata traditions beyond the Liezi and al-Jazari are not here.
- **Research record.** Claude Code checked each place against the page recorded in its row. The `medium` rows identify placements with less direct source support.
- **Coordinates are modern.** Nominatim knows today's map. Ctesiphon is drawn at the ruins; "Zoo Palast, Berlin" is the rebuilt cinema on the site of the Ufa-Palast; MIT and Stanford are their campuses now, not their 1966 and 1972 buildings.

## Models and cost

All model work in this folder was done by **Claude Code (Fable 5.1, `claude-fable-5-1`) in the building session**: selecting candidates, deciding the place rule, opening about sixty web pages, reading the 22 paper headers, and writing `02-places.json` and `02a-affiliations.json`. **No API calls were made and no key was used**, so there is no cost log; the session's token use is not recorded here. The gazetteer lookups were 58 requests to Nominatim over three runs (52 places, plus six retries after queries were corrected), all cached, and three test requests to Wikidata that were not needed in the end.

## Sources and rights

- **The timeline (maps/02-ai-and-literature-timeline)** (`../../maps/02-ai-and-literature-timeline/`): dates, source URLs, verification status, descriptions, and public-domain quotations for 53 of the 80 rows; its `02-events-verified.csv` is copied into `inputs/` unchanged. The timeline's own README lists what its checking rested on.
- **The course's AI papers** (`../../context/LL-readings/`): titles, authors, arXiv IDs, and the header lines quoted in `02a-affiliations.json`; descriptions from the Learning Lab's `papers-on-ai-notes.md`.
- **Places**: English Wikipedia articles on each work, author, publisher, periodical, studio, laboratory, and company (CC BY-SA; only short phrases are quoted in the notes); the Wikisource and Internet Archive title page of *Erewhon*; HathiTrust and Max Planck Institute catalogue records (the Oxford and Cambridge Review; Kempelen's 1791 book); the Jaquet Droz company history; Muslim Heritage and the Public Domain Review on al-Jazari; Slovak press accounts of Čapek at Trenčianske Teplice; alphaXiv and The Org profiles for Touvron; Semantic Scholar for the Chinchilla paper's affiliation. Every URL is in `place_sources` on the row that uses it.
- **Coordinates and map tiles**: © OpenStreetMap contributors (ODbL) via Nominatim, under its usage policy; Esri's World Light Gray canvas and World Street Map, with Esri's attribution on the page.
- **Quotations** appear only for public-domain works and only as inherited from the timeline (maps/02-ai-and-literature-timeline). Works in copyright are represented by metadata and a link.
