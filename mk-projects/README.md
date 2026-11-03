---
title: mk-projects
description: Six worked example projects for ENGLISH 298AI, November 3, 2026, each laid out as inputs → operations → outputs, explained at a glance.
author: claude
created: 2026-11-03
---

# mk-projects

Six worked examples of using AI tools to research and present work on texts. Every folder has the same shape: **`inputs/`** (what we start from), **`operations/`** (numbered steps: prompts, scripts, and the in-between data files they pass along), **`outputs/`** (one HTML page; double-click `outputs/index.html`). Each folder's own README has the full chain, sources, costs, and caveats.

## 01 · Dickens's places: a map after Moretti

- **Inputs:** eight Dickens novels from Project Gutenberg, *Oliver Twist* to *Our Mutual Friend*.
- **Operations:** code cuts each novel into chunks by chapter → a model lists every place name in each chunk, with a quote → code merges them into an inventory (1,116 places) → a free gazetteer (OpenStreetMap's Nominatim) finds coordinates; a model estimates a few it can't → a short brief on what the map should show.
- **Output:** a map of London, Britain, and abroad. Tick novels on and off, show only scenes set at a place, set a minimum number of mentions, or search for a place; click a circle to read its passages. Dashed circles are the model's guesses.

## 02 · *Frankenstein* in translation: the creature's plea

- **Inputs:** the 1818 and 1831 English texts, the 1821 French and 1912 German translations, and the plea ("I ought to be thy Adam; but I am rather the fallen angel … misery made me a fiend") quoted from 19 later translations, each cited to its printed edition.
- **Operations:** find the plea in 21 translations across 14 languages, 1821–2025 → code re-finds each quotation in its source → a model back-translates each and notes what its words add (fiend as devil, demon, ogre, enemy…), some checked against dictionaries → a model compares what each translator highlighted or muted. Below that, the first translation into 25 languages, researched and verified.
- **Output:** a card per translation with key words highlighted, back-translation, and connotation notes; a matrix of how *Adam*, *fallen angel*, *benevolent*, *misery*, and *fiend* were rendered; a grid placing each version between demonic and pitiable, biblical and secular; the synthesis; then the first-translations timeline.

## 03 · A timeline of AI and literature

- **Inputs:** the course reading list (titles and dates only) and the history of AI.
- **Operations:** a model drafts 112 events → each one checked against Wikipedia, arXiv, or Crossref records (23 corrected) → a model sorts each into a lane and themes → code builds the page.
- **Output:** a timeline in four lanes (AI and computing, literature and theater, theories of dialogue, course readings as gold diamonds), split into eras so antiquity and 2026 both fit. Filter, search, and zoom; click an event for its source and checking status. A panel lists what the checking caught.

## 04 · Every change between the 1818 and 1831 *Frankenstein*

- **Inputs:** the 1818 and 1831 texts from Project Gutenberg.
- **Operations:** code aligns the two editions and finds every change (550) → a schema of categories (an interpretive choice, written down) → a model labels each change in a fixed format → a stronger model and a reader check samples → code counts by category and chapter.
- **Output:** a chart of where the changes fall, filters by category and significance, and each change side by side with the edit highlighted plus the model's label and reasons. Shows the agreement from the checks and the twelve known revisions the scholarship describes.

## 05 · Distant and close reading: scenes of instruction

- **Inputs:** *Frankenstein* (1818), *R.U.R.* (1923 translation), *The Picture of Dorian Gray*, and Plato's *Phaedrus* (Jowett).
- **Operations:** code cuts the texts into 982 passages → a keyword search for teach/learn/lesson… → a model reads every passage for the concept → code compares the two methods → a blind check of 30 passages → a stronger model close-reads the 15 strongest.
- **Output:** one strip per text, with keyword hits on one row and the model's hits (shaded by strength) on another, so you can see what word search misses. Click any mark for the passage, the evidence, and the close reading.

## 06 · *Pharmakon*: one word across five centuries

- **Inputs:** the Greek of *Phaedrus* 274c–275b (Theuth and Thamus) and 17 public-domain translations in 10 languages, Ficino (1484) to Meunier (1922).
- **Operations:** find the passage in each translation → a model pulls out how each renders *pharmakon*, *mnēmē*, *hypomnēsis*, and *sophia*, and sorts *pharmakon* by sense (medicine, drug, means…) → code confirms each rendering appears word for word → a model back-translates each passage.
- **Output:** the Greek with clickable key words; a timeline of each word's renderings by year, colored by sense; the passages side by side with back-translations.

## Rerunning a step

You don't need to. To try, put `OPENROUTER_API_KEY=…` in a `.env` at the repo root (gitignored) and run, e.g., `node --env-file=.env mk-projects/04-frankenstein-revisions/operations/04-categorize.mjs`. Cached responses make unchanged steps free. A few inputs from sites with their own terms are fetched by each folder's download step instead of being included.
