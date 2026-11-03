# Use cases

These examples extend the inputs → operations → outputs workflow through
scale, language, tools, loops, and new forms of output.

| Use case | What you will do | Start here |
|---|---|---|
| [Translation](translation/) | Translate Bergson's French through a visible prompt chain, then read an annotated bilingual page. | [Guide](translation/README.md) · [Output](translation/outputs/example/annotated-translation.html) |
| [01 · Dickens's places](01-dickens-places-map/) | Map every place named in eight Dickens novels, after Moretti, with the passages behind each point. | [Guide](01-dickens-places-map/README.md) · [Map](01-dickens-places-map/outputs/index.html) |
| [02 · *Frankenstein* in translation](02-frankenstein-translations/) | Follow one loaded line through the first translations into 25 languages, with back-translations and a timeline. | [Guide](02-frankenstein-translations/README.md) · [Page](02-frankenstein-translations/outputs/index.html) |
| [03 · AI and literature timeline](03-ai-and-literature-timeline/) | Read a checked timeline of AI, literature, theories of dialogue, and the course readings, antiquity to 2026. | [Guide](03-ai-and-literature-timeline/README.md) · [Timeline](03-ai-and-literature-timeline/outputs/index.html) |
| [04 · *Frankenstein* revisions](04-frankenstein-revisions/) | See every change between the 1818 and 1831 editions, categorized and checked. | [Guide](04-frankenstein-revisions/README.md) · [Page](04-frankenstein-revisions/outputs/index.html) |
| [05 · Distant and close reading](05-distant-and-close-reading/) | Compare keyword search with a model's reading of 982 passages for scenes of instruction. | [Guide](05-distant-and-close-reading/README.md) · [Page](05-distant-and-close-reading/outputs/index.html) |
| [06 · *Pharmakon*](06-phaedrus-pharmakon/) | Trace one word of the *Phaedrus* across 17 translations and five centuries. | [Guide](06-phaedrus-pharmakon/README.md) · [Page](06-phaedrus-pharmakon/outputs/index.html) |

The numbered projects were made in a morning by a model and a few scripts.
Each folder's own README has the full chain, sources, costs, and caveats.

## How each use case is organized

```text
<use-case>/
  inputs/        source material
  operations/    prompts, skills, and scripts
  outputs/       completed examples
  summary.md     purpose, workflow, and limitations
  index.md       file-by-file guide
  CLAUDE.md      Claude Code instructions; readable explicitly in other apps
```

Read an example’s `README.md` to try it, or `summary.md` for its purpose. Use `index.md` to find
a specific file.
The outputs are examples, not guaranteed results for new source material. In
Claude Desktop or another app, ask the assistant to read the example's
`CLAUDE.md` before starting; Claude Code loads it automatically.

Shared course readings and full-text AI papers are in
[`context/`](../context/).

## The numbered projects at a glance

Every numbered folder has the same shape: **`inputs/`** (what we start from),
**`operations/`** (numbered steps: prompts, scripts, and the in-between data
files they pass along), **`outputs/`** (one HTML page; double-click
`outputs/index.html`).

### 01 · Dickens's places: a map after Moretti

- **Inputs:** eight Dickens novels from Project Gutenberg, *Oliver Twist* to *Our Mutual Friend*.
- **Operations:** code cuts each novel into chunks by chapter → a model lists every place name in each chunk, with a quote → code merges them into an inventory (1,116 places) → a free gazetteer (OpenStreetMap's Nominatim) finds coordinates; a model estimates a few it can't → a short brief on what the map should show.
- **Output:** a map of London, Britain, and abroad. Tick novels on and off, show only scenes set at a place, set a minimum number of mentions, or search for a place; click a circle to read its passages. Dashed circles are the model's guesses.

### 02 · *Frankenstein* in translation

- **Inputs:** the 1818 and 1831 English texts, the first French (1821) and German (1912) translations, and short quoted lines from many later translations, each cited.
- **Operations:** research and verify the first translation into 25 languages → find one loaded line in as many translations as possible → a model back-translates each and notes the connotations each translator's words add → a comparison across all of them.
- **Output:** the English line and each translation side by side, with key words highlighted and connotation notes; a matrix of how each key word was rendered; below, a timeline of first translations by language. *(Being reworked; this entry will be updated.)*

### 03 · A timeline of AI and literature

- **Inputs:** the course reading list (titles and dates only) and the history of AI.
- **Operations:** a model drafts 112 events → each one checked against Wikipedia, arXiv, or Crossref records (23 corrected) → a model sorts each into a lane and themes → code builds the page.
- **Output:** a timeline in four lanes (AI and computing, literature and theater, theories of dialogue, course readings as gold diamonds), split into eras so antiquity and 2026 both fit. Filter, search, and zoom; click an event for its source and checking status. A panel lists what the checking caught.

### 04 · Every change between the 1818 and 1831 *Frankenstein*

- **Inputs:** the 1818 and 1831 texts from Project Gutenberg.
- **Operations:** code aligns the two editions and finds every change (550) → a schema of categories (an interpretive choice, written down) → a model labels each change in a fixed format → a stronger model and a reader check samples → code counts by category and chapter.
- **Output:** a chart of where the changes fall, filters by category and significance, and each change side by side with the edit highlighted plus the model's label and reasons. Shows the agreement from the checks and the twelve known revisions the scholarship describes.

### 05 · Distant and close reading: scenes of instruction

- **Inputs:** *Frankenstein* (1818), *R.U.R.* (1923 translation), *The Picture of Dorian Gray*, and Plato's *Phaedrus* (Jowett).
- **Operations:** code cuts the texts into 982 passages → a keyword search for teach/learn/lesson… → a model reads every passage for the concept → code compares the two methods → a blind check of 30 passages → a stronger model close-reads the 15 strongest.
- **Output:** one strip per text, with keyword hits on one row and the model's hits (shaded by strength) on another, so you can see what word search misses. Click any mark for the passage, the evidence, and the close reading.

### 06 · *Pharmakon*: one word across five centuries

- **Inputs:** the Greek of *Phaedrus* 274c–275b (Theuth and Thamus) and 17 public-domain translations in 10 languages, Ficino (1484) to Meunier (1922).
- **Operations:** find the passage in each translation → a model pulls out how each renders *pharmakon*, *mnēmē*, *hypomnēsis*, and *sophia*, and sorts *pharmakon* by sense (medicine, drug, means…) → code confirms each rendering appears word for word → a model back-translates each passage.
- **Output:** the Greek with clickable key words; a timeline of each word's renderings by year, colored by sense; the passages side by side with back-translations.

### Rerunning a step

You don't need to. To try, put `OPENROUTER_API_KEY=…` in a `.env` at the repo
root (gitignored) and run, e.g.,
`node --env-file=.env 01-use-cases/04-frankenstein-revisions/operations/04-categorize.mjs`.
Cached responses make unchanged steps free. A few inputs from sites with their
own terms are fetched by each folder's download step instead of being included.
