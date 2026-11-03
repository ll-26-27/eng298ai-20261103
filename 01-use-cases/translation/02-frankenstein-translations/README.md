---
title: "the early translations of Frankenstein"
description: How did Frankenstein travel? A verified inventory of the first translation into each of about twenty languages, a timeline and map, and one passage followed into the translations we can legally read, back-translated and compared.
author: claude
created: 2026-11-03
---

# the early translations of *Frankenstein*

A worked example of a translation-history pipeline: find the first translation of *Frankenstein* in each of 25 languages, check every one against library catalogues and published scholarship, then follow one passage (the creature's awakening) into the translations that are public domain and digitized, back-translate it, and sort what each translator changed.

Open **`outputs/index.html`** by double-clicking it.

**Where it stands (2026-11-03):** 25 languages: 12 verified, 8 partly verified, 5 unverified. First translations run from 1821 (French) to 1996 (Turkish); Greek and Korean have no confirmed date. Two historical translations are public domain and readable, so the anchor passage is compared in the 1821 French and the 1912 German, alongside model translations into French and German made one-shot and after a critique. The map needs an internet connection (Leaflet and OpenStreetMap tiles load from the web); everything else works offline.

## The chain

Each step says what kind of thing it is (a prompt, a script, or a data file) and whether it is deterministic code, model judgment, or research a person or agent verified.

0. **`operations/00-fetch-texts.mjs`** (script, deterministic): downloads every text in `inputs/texts/manifest.json` and cuts Shelley's anchor passage out of the 1818 and 1831 editions by its first and last words, into `inputs/anchor-passage.json`.
1. **The inventory**, in three parts:
   - **1a. `01a-draft-prompt.md` → `01a-draft-candidates.mjs` → `01a-model-draft.json`** (prompt + script, model judgment): two models list first translations from memory, with no web access. These are leads only, kept so you can see what memory gets right and wrong.
   - **1b. `01b-verify-prompt.md` → `01b-translations-inventory.csv`** (prompt + data, verified research): the research brief given to three Claude Code agents with web search, one per group of languages; their reports were read, reconciled, and merged into the CSV by the lead session, which spot-checked the French, Japanese, Polish, Swedish, Spanish, Catalan and Russian rows against the cited records. Every row records its sources as URLs and a status: *verified* (confirmed in a catalogue record, a digitized title page, or a scholarly study), *partly verified* (some fields confirmed, or only one bibliographic source), or *unverified* (a lead). Coordinates for each city of publication were entered by hand.
   - **1c. `01c-compare-draft-to-verified.mjs` → `01c-draft-vs-verified.csv`** (script, deterministic): lines up the models' memory against the verified rows.
2. **`02-locate-passage.mjs` → `02-passages.json`** (script, model points and code checks): a model reads each public-domain translation and returns the first and last words of the passage matching Shelley's; code then searches for those exact words in the file and cuts the translator's text out. If the words aren't in the file, the row fails loudly, so the stored passage is never a model's paraphrase.
3. **`03-compare-prompt.md` → `03-backtranslate-compare.mjs` → `03-comparisons.json`** (prompt + script, model judgment with a JSON schema): back-translates each version into English and lists its departures from Shelley in six categories (omission, addition, intensification, softening, domestication, shift in meaning), quoting both sides. Code then checks that every quoted phrase really occurs in its text and flags any that don't.
4. **`04-chain-prompts.md` → `04-translate-critique-retranslate.mjs` → `04-chain.json`** (prompts + script, model judgment): translates the same passage into French and German, has a different model critique each translation, and has the first model revise and say which criticisms it accepted. Step 3 then back-translates these too, so the model versions can be set beside the 1821 translator's.
5. **`05-page-template.html` + `05-build-page.mjs` → `outputs/index.html`** (script, deterministic): merges every data file into the template inline, so the page opens from the file system without a server.

`operations/lib/openrouter.mjs` is the shared model client: it caches every response in `operations/cache/` (so reruns are free unless a prompt changes) and logs tokens and cost for every live call to `operations/costs.jsonl`.

## How to rerun it

From the repository root, with `OPENROUTER_API_KEY` in the root `.env`:

```
node 01-use-cases/translation/02-frankenstein-translations/operations/00-fetch-texts.mjs
node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/01a-draft-candidates.mjs
node 01-use-cases/translation/02-frankenstein-translations/operations/01c-compare-draft-to-verified.mjs
node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/02-locate-passage.mjs
node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/04-translate-critique-retranslate.mjs
node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/03-backtranslate-compare.mjs
node 01-use-cases/translation/02-frankenstein-translations/operations/05-build-page.mjs
```

Step 1b is research, not a script: to redo it, paste `01b-verify-prompt.md` into Claude Code, then edit the CSV by hand. To add a translation's text, add it to `inputs/texts/manifest.json` (public domain only), give its row a `passage_id`, and rerun from step 0. Step 4 runs before step 3 so that step 3 compares the model translations too. With the cache in place, rerunning everything costs nothing.

## What a scholar must check

- **"First" is a definition, not a fact.** Abridgements, magazine serials, children's digests, and books built from the films often came before a full translation of the novel. The inventory records the earliest translation of the novel we could document and says in `form` and `notes` what kind of thing it was (the Japanese "first" is an unfinished 1889 serial; the Turkish books of 1944 and 1971 were made from films and are not counted). A different definition gives a different map.
- **Every *unverified* row is a lead.** Several rows rest on one bibliography (Romantic Circles' list of editions, which stops in 1996 and misses earlier items) or on catalogues our tools could not search (Korea, Israel, Serbia, Greece, China). Check those in a browser before citing them.
- **Newspaper serials were not searched** in any language. An earlier serialized translation could exist almost anywhere.
- **"English text followed"** is usually unknown. Catalogue notes saying "1818" often name the original work, not the edition used. Where we give 1818 or 1831 the reason is in `notes` (for the German, internal evidence from Elizabeth's 1831 back-story).
- **Passages:** the German comes from a 2009 reprint transcribed by Projekt Gutenberg-DE and has not been checked against the 1912 printing.
- **Back-translations and categories are model readings.** They can smooth over what is strange in a translation, and two runs (or two models) would list somewhat different changes. The six categories are a teaching device; many changes fit two of them. Code checks that each quoted phrase exists, not that the reading is right; flagged quotes are marked on the page.
- **The model drafts in step 1a are not research.** Asked from memory, Claude Sonnet 5.5 declined 23 of 25 languages (and got the two it answered right); Gemini 3.8 Flash answered all 25 with confidence and got 10 of the 23 comparable years right. Its right answers mostly match the Romantic Circles list, and it missed every case where that list is incomplete (Japanese 1889, Spanish 1912, Dutch 1946, Portuguese 1943). See `01c-draft-vs-verified.csv`.

## Models and cost

| step | model (OpenRouter ID, checked against the live model list on 2026-11-03) | what it does |
| --- | --- | --- |
| 1a | `anthropic/claude-sonnet-5.5`, `google/gemini-3.8-flash` | draft the inventory from memory |
| 2 | `google/gemini-3.8-flash` (low reasoning effort) | point to the passage in a long text |
| 3 | `anthropic/claude-sonnet-5.5` | back-translate and categorize (JSON schema) |
| 4 | `google/gemini-3.8-flash` translates and revises; `anthropic/claude-sonnet-5.5` critiques | the translation chain |

**Actual cost of the model calls: $0.37** for 17 calls (Claude Sonnet 5.5 $0.27, Gemini 3.8 Flash $0.10), including one call that was cut off and retried; every call is logged in `operations/costs.jsonl`. The research in step 1b was done by three Claude Code agents with web search (about 555,000 tokens between them) under the session's Claude plan, so it doesn't appear in that log. Reruns cost nothing while `operations/cache/` is in place.

## Inputs: sources and copyright

| input | where it's from | copyright (US) |
| --- | --- | --- |
| *Frankenstein*, 1818 text | Project Gutenberg #41445, https://www.gutenberg.org/ebooks/41445 | public domain |
| *Frankenstein*, 1831 text | Project Gutenberg #84, https://www.gutenberg.org/ebooks/84 | public domain |
| *Frankenstein, ou le Prométhée moderne*, vol. 1, trans. Jules Saladin (Paris: Corréard, 1821) | Project Gutenberg #62404, https://www.gutenberg.org/ebooks/62404, transcribed from the Gallica (BnF) scans | public domain |
| *Frankenstein oder Der moderne Prometheus*, trans. Heinz Widtmann (Leipzig: Max Altmann, 1912), one chapter only | Projekt Gutenberg-DE, https://projekt-gutenberg.org/authors/mary-shelley/books/frankenstein-oder-der-moderne-prometheus/chapter/11 (their source: a 2009 Fischer Taschenbuch reprint) | public domain in the US (published 1912); the reprint text is not checked against 1912 |
| bibliographic records and studies for every language | the URLs in the `sources` column of `operations/01b-translations-inventory.csv` | metadata and links only |

The downloaded texts sit in `inputs/texts/` and are listed in `inputs/texts/manifest.json`. Every first translation published after 1930 is still in copyright and appears only as metadata and links. The 1889 Japanese serial is public domain and digitized by the National Diet Library, but only as page images, so no passage from it is included.
