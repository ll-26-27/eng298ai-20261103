# Inputs

Everything here is copied from elsewhere in this repository and is read-only. An output of one use case becomes the input of another.

| File | Copied from | What it is |
|---|---|---|
| `03-events-verified.csv` | `../../../maps/02-ai-and-literature-timeline/operations/02-events-verified.csv` (checked 2026-11-03) | The timeline (maps/02-ai-and-literature-timeline)'s 116 events: a model drafted them, and each date and claim was then checked against Wikipedia, arXiv, Crossref, or a primary text; 89 verified as drafted, 23 corrected. Columns include `source_url`, `status`, `check_note`, `copyright`, and public-domain `quote`s. This map uses 53 of the rows: the `made-beings` lane, eight literary `readings`, and ten conversational machines from `computing`. |
| `03-events-categorized.json` | `../../../maps/02-ai-and-literature-timeline/operations/03-events-categorized.json` | The same events with a model-written one-paragraph `description` and `why_it_matters`, used for the detail panel. Descriptions are model text that the timeline (maps/02-ai-and-literature-timeline)'s checker read for errors, not proved line by line. |
| `course-readings.json` | `../../../maps/02-ai-and-literature-timeline/inputs/course-readings.json` | The syllabus reading list as metadata and the arXiv IDs of the 22 papers in the course's AI-papers folder. |

The 22 papers themselves are read in place from `../../../context/LL-readings/papers-on-ai-md/` (full-text Markdown extractions with YAML front matter: title, authors, arXiv ID, dates) and the Learning Lab's notes on them in `../../../context/LL-readings/papers-on-ai-notes.md`. They are not copied here because the context pack is the shared, read-only source for the whole repository.

Five talking machines not in the timeline (maps/02-ai-and-literature-timeline) (Kempelen's speaking machine, Faber's Euphonia, the Voder, Xiaoice, Alexa) were added in step 2 with their own sources; they live in `../operations/02-places.json` under `added`, not here, because they are a product of this use case's research rather than an input to it.
