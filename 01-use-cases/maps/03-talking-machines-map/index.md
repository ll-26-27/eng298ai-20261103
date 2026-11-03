# File guide

| File | Purpose |
|---|---|
| [README.md](README.md) | Entry point: the question, the layers, the place rule, the chain, how to rerun, what verification caught, what to check, sources. |
| [summary.md](summary.md) | Purpose, workflow, and limits in one page. |
| [CLAUDE.md](CLAUDE.md) | Standing instructions for anyone rerunning or extending this folder with Claude Code. |
| [inputs/README.md](inputs/README.md) | Provenance of the inputs. |
| [inputs/03-events-verified.csv](inputs/03-events-verified.csv) | The timeline (maps/02-ai-and-literature-timeline)'s 116 verified events, copied unchanged: dates, sources, status, quotations. |
| [inputs/03-events-categorized.json](inputs/03-events-categorized.json) | The timeline (maps/02-ai-and-literature-timeline)'s categorized events, copied for their one-paragraph descriptions. |
| [inputs/course-readings.json](inputs/course-readings.json) | The timeline (maps/02-ai-and-literature-timeline)'s reading list and the arXiv IDs of the 22 papers. |
| [operations/01-select.mjs](operations/01-select.mjs) | Step 1 (code): choose the rows for each layer; read the papers' front matter and the course's notes on them. |
| [operations/01-candidates.json](operations/01-candidates.json) | Output of step 1: 80 candidates with dates, descriptions, and sources, no places yet. |
| [operations/02-places-prompt.md](operations/02-places-prompt.md) | Step 2 (the brief): the place rule and the rules of evidence for researching a place. |
| [operations/02-places.json](operations/02-places.json) | Output of step 2 for imagined, readings, and built rows: place, kind, certainty, note, pages opened, `speaks`; the five added machines; the exclusions. |
| [operations/02a-affiliations.json](operations/02a-affiliations.json) | Output of step 2 for the 22 papers: the printed author line, all affiliations, and the place used. |
| [operations/03-geocode.mjs](operations/03-geocode.mjs) | Step 3 (code): Nominatim lookups with caching, rate limiting, and a name-match test; Wikidata fallback. |
| [operations/03-geocoded.csv](operations/03-geocoded.csv) | Output of step 3: one row per candidate with coordinates, the gazetteer match, and every place field. Open in a spreadsheet. |
| [operations/03-rows.json](operations/03-rows.json) | The same, with every field, for the build step. |
| [operations/cache/](operations/cache/) | Every gazetteer response, keyed by request URL, so reruns send nothing. |
| [operations/04-build.mjs](operations/04-build.mjs) | Step 4 (code): embed the data in the template and write the page. |
| [operations/04-template.html](operations/04-template.html) | The page: Leaflet map, year slider, layer and speech filters, search, detail panel, unmapped list. |
| [outputs/index.html](outputs/index.html) | The map. Double-click to open. |
