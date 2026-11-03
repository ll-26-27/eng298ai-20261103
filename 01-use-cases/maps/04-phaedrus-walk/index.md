# File guide

| File | Purpose |
|---|---|
| [README.md](README.md) | Entry point: the question, the chain, how to rerun, what to check, sources and rights. |
| [summary.md](summary.md) | Purpose, workflow, result, limits, on one page. |
| [CLAUDE.md](CLAUDE.md) | Instructions for Claude Code working in this folder. |
| [inputs/README.md](inputs/README.md) | Provenance of the four input files. |
| [inputs/texts/](inputs/texts/) | Burnet's Greek and Fowler's English (Perseus TEI), Jowett's English (Project Gutenberg), copied from the pharmakon project (translation/03-phaedrus-pharmakon). |
| [inputs/pausanias-1.19-jones.json](inputs/pausanias-1.19-jones.json) | Pausanias 1.19.1–6 in Jones's translation, the ancient topographic witness. |
| [operations/01-extract-passages.mjs](operations/01-extract-passages.mjs) | Cuts the eleven passages by Stephanus section; Jowett by anchor phrases. |
| [operations/01-passages.json](operations/01-passages.json) | The passages, speech by speech, in three texts. |
| [operations/02-topography-prompt.md](operations/02-topography-prompt.md) | The research brief for the topography. |
| [operations/02-stops.json](operations/02-stops.json) | One record per stop: the text's words, identification, certainty, certain/conjecture, sources; plus the source list with `opened` flags. |
| [operations/03-geocode.mjs](operations/03-geocode.mjs) | Looks up the modern landmarks (Overpass by OSM id, Nominatim, Wikidata), cached. |
| [operations/03-landmarks.json](operations/03-landmarks.json) | The landmarks with coordinates and the geocoder that answered. |
| [operations/03-route.geojson](operations/03-route.geojson) | The hand-drawn, conjectural walk and the approximate river line. |
| [operations/cache/](operations/cache/) | Raw gazetteer responses, so reruns send nothing. |
| [operations/04-template.html](operations/04-template.html) | The page, without data. |
| [operations/04-build.mjs](operations/04-build.mjs) | Checks the data for consistency and inlines it into the template. |
| [outputs/index.html](outputs/index.html) | The map. Double-click to open. |
