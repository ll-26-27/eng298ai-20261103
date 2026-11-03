---
title: mk-projects
description: Worked example projects for ENGLISH 298AI, November 3, 2026, each laid out as inputs → operations → outputs.
author: claude
created: 2026-11-03
---

# mk-projects

Six worked examples of using AI tools to research and present work on texts. Each project folder has the same three parts, so you can see the whole pipeline and borrow its shape for your own project.

- **`inputs/`**: the material we start from (public-domain texts, data). Each folder's `README.md` gives every input's source and copyright status.
- **`operations/`**: everything that turns inputs into outputs, numbered in the order it runs. An operation can be a **prompt** (a `.md` file you can give to Claude Code), a **script** (`.mjs`, run with Node), or an **intermediate file** that one step hands to the next (a `.csv` or `.json` of extracted data). Each README says which steps are plain code, which are a model's judgment, and which are checks.
- **`outputs/`**: what a reader sees, a single HTML page. Double-click `outputs/index.html` to open it.

| folder | inputs | operations, in brief | output |
| --- | --- | --- | --- |
| [`01-dickens-places-map/`](01-dickens-places-map/) | eight Dickens novels | find place names chunk by chunk → inventory → look up coordinates → design the map | an interactive map, after Moretti's *Atlas of the European Novel* |
| [`02-frankenstein-translations/`](02-frankenstein-translations/) | the 1818 and 1831 texts and the first French and German translations | inventory first translations into 25 languages, checking each → find one passage in each translation → back-translate and compare | a timeline and map of how the novel travelled, with the passages side by side |
| [`03-ai-and-literature-timeline/`](03-ai-and-literature-timeline/) | the course reading list and the history of AI | a model drafts events → each one checked against a source → sorted into lanes | an interactive timeline, with what the checking caught |
| [`04-frankenstein-revisions/`](04-frankenstein-revisions/) | *Frankenstein*, 1818 and 1831 | code finds every change → a model sorts each change into categories → a second model and a reader check a sample | a filterable explorer of every revision |
| [`05-distant-and-close-reading/`](05-distant-and-close-reading/) | *Frankenstein*, *R.U.R.*, *Dorian Gray*, *Phaedrus* | keyword search vs. a model reading every passage for "scenes of instruction" → a check → close readings | a page that moves from the whole corpus to single passages |
| [`06-phaedrus-pharmakon/`](06-phaedrus-pharmakon/) | the Greek of *Phaedrus* 274c–275b and 17 translations, 1484–1922 | find the passage in each → pull out how each renders *pharmakon*, *mnēmē*, *hypomnēsis*, *sophia* → check them word for word → back-translate | the Greek with clickable key words, a timeline of renderings, the passages side by side |

## Running the operations yourself

You don't need to rerun anything to read the outputs. To rerun or change a step, put your OpenRouter key in a `.env` file at the root of this repo (it is gitignored, so it stays on your machine):

```
OPENROUTER_API_KEY=your-key-here
```

Then run a step from the repo root, for example:

```
node --env-file=.env mk-projects/04-frankenstein-revisions/operations/04-categorize.mjs
```

Most folders keep a cache of the model responses, so rerunning an unchanged step costs nothing. Each README lists the models used and what the run cost.

## Left out of this repo

Some inputs are downloaded by their own fetch step instead of being included here: the German *Frankenstein* chapter in `02` (`operations/00-fetch-texts.mjs`), the Wikipedia extracts used to check the timeline in `03` (`operations/02a-fetch-sources.mjs`), and four *Phaedrus* translations in `06` from sites with their own terms of use (`operations/02-fetch-texts.mjs`). The large rebuildable files are left out too: the text chunks in `01` (rebuilt by `operations/01-clean-and-chunk.mjs`) and the response cache in `05`.
