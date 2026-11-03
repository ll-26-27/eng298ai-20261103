---
title: "04 · Frankenstein revisions, 1818 to 1831"
description: Every difference between the 1818 and 1831 texts of Frankenstein, found by a deterministic diff and then sorted into categories by a model with structured outputs, with the checks that show how far to trust the sorting.
author: claude
created: 2026-11-03
---

# 04 · Every change between the 1818 and 1831 *Frankenstein*

A pipeline that finds every change Mary Shelley made between the 1818 and 1831 editions with code, then asks a language model to categorize each one through a fixed JSON schema, and checks the model against a stronger model, a reading of the text, and the revisions scholars have described.

**Open the result:** double-click `outputs/index.html`. It is one self-contained file (the data is inside it; no internet needed).

**The lesson:** code finds every change with certainty; models only interpret them. Pasting both novels into one chat and asking "what changed?" is brittle: you cannot tell what it missed. Here the diff accounts for every sentence of both editions (the script checks this and stops if it fails), so the only open questions are interpretive ones, and the first of those, which categories to use, is a decision made before any model runs.

## The chain

| step | file | kind | what it does |
| --- | --- | --- | --- |
| inputs | `inputs/pg41445.txt`, `inputs/pg42324.txt` | data | the two editions from Project Gutenberg, unchanged |
| 01 | `operations/01-normalize-align.mjs` → `01-text-1818.json`, `01-text-1831.json`, `01-alignment.json` | script, deterministic | strips boilerplate, title pages, illustrations and footnotes; standardizes quotes, dashes and italics; splits into sections, paragraphs and sentences; aligns 1818's three volumes (chapters numbered per volume) with 1831's continuous chapters by shared five-word sequences. 1818 Vol. I, Ch. I became 1831 Chs. I and II; every later chapter maps one to one. |
| 02 | `operations/02-diff.mjs` → `02-changes.json` | script, deterministic | matches sentences inside each aligned section (longest common subsequence); each run of unmatched sentences is one change; inside a change, marks the exact words removed and added. Passages sharing under half their words are marked as rewrites and shown whole. Changes that differ only in punctuation, capitals or hyphens are marked by rule. Verifies every sentence is accounted for. |
| 03 | `operations/03-schema-prompt.md` | prompt, human decision | the categories, the instructions, and the JSON schema, with a note on why these categories and what they leave out. Step 04 reads this file directly, so editing it changes the run. |
| 04 | `operations/04-categorize.mjs` → `04-categorized.json`, `04-cache/` | script calling a model | sends each non-punctuation change, one per call, to a cheap model with `response_format: json_schema` (strict); validates the answer again in code. Every request and response is kept in `04-cache/`. |
| 05 | `operations/05-check-with-stronger-model.mjs` → `05-check.json`, `05-cache/` | script calling a model | a seeded random sample of 100 changes goes to a stronger model with the same prompt, blind to the first answer; agreement is computed by rule. |
| 05b | `operations/05b-hand-check.json` | data, reading | 25 of those 100 read against the text, with a category and a note for each, plus changes noticed outside the sample where the model was wrong. **Read by Claude (the agent that built this), not by a person**: redo it yourself. |
| 06 | `operations/06-known-revisions.mjs` → `06-known-revisions.json` | script, deterministic | looks up revisions described by scholars (and by Shelley's 1831 Introduction) by exact phrase; tests Shelley's claim about where the changes fall; counts fate vocabulary in each edition. |
| 07 | `operations/07-aggregate.mjs` → `07-aggregate.json` | script, deterministic | counts by category, section, significance, confidence; agreement for the reading. |
| 08 | `operations/08-build-page.mjs` + `08-page-template.html` → `outputs/index.html` | script, deterministic | embeds the data in the page. Chart is hand-built SVG, no libraries. |

`operations/_openrouter.mjs` is a shared helper for 04 and 05 (one cached structured-output call, with token and cost accounting). `operations/cost-log.jsonl` has one line per model run.

## Results (run of 2026-11-03)

- **3,101** sentences in 1818, **3,332** in 1831; **2,127** identical in both.
- **550 changes**: 216 punctuation-only (labelled by rule, no model), 334 categorized by the model, 0 failed calls.
- Primary categories from the model: wording 137, spelling 91, expansion 43, characterization 30, cut 12, moral-religious 9, framing 6, plot 3, fate-agency 2, other 1. Counting secondary labels too, characterization rises to 94, moral-religious to 45, fate-agency to 12.
- **Check, cheap vs. stronger model:** same primary category on 78 of 100; 96% overlap if secondary categories count; significance within one point 98%. Agreement is 84% on small changes and **50% on large rewritten passages**, the ones that matter most.
- **Reading against the text (25 changes):** agrees with the cheap model 88%, the stronger model 92%.
- **Known revisions: 12 of 12 caught** by the diff: the new Introduction; Elizabeth as cousin (1818) vs. adopted foundling and "pretty present" (1831); "Destiny was too potent…"; the "Angel of Destruction"; "the words of the fate, enounced to destroy me"; "I felt as if I were destined" → "I believed myself destined"; the natural philosopher's lecture on electricity and galvanism replacing Victor's father's explanation; Walton's "One man's life or death were but a small price"; the creature finding Justine asleep in a barn; the Villa Lavenza on Lake Como.
- **Shelley's own claim** that the changes "occur almost exclusively in the beginning of the first volume": 48.9% of changed words fall in the letters and the first two chapters, 67.8% in Volume I; so concentrated, not exclusive. Her claim that she "changed no portion of the story" is contradicted by the barn scene and the Como villa.
- **Fate vocabulary** (destiny, destined, fate, fatal, doom…): 53 in 1818, 55 in 1831. Scholars' "more fatalistic 1831" lives in a few emphatic passages, not in word frequency.

## Rerun it

From the repo root (the model steps need `OPENROUTER_API_KEY` in the root `.env`):

```sh
node mk-projects/04-frankenstein-revisions/operations/01-normalize-align.mjs
node mk-projects/04-frankenstein-revisions/operations/02-diff.mjs
node --env-file=.env mk-projects/04-frankenstein-revisions/operations/04-categorize.mjs
node --env-file=.env mk-projects/04-frankenstein-revisions/operations/05-check-with-stronger-model.mjs
node mk-projects/04-frankenstein-revisions/operations/06-known-revisions.mjs
node mk-projects/04-frankenstein-revisions/operations/07-aggregate.mjs
node mk-projects/04-frankenstein-revisions/operations/08-build-page.mjs
```

With the caches in place, steps 04 and 05 cost nothing and return the same labels. To try different categories, edit `03-schema-prompt.md` and rerun from 04: every change is re-sent, and the cache keeps only answers for the current prompt. `04-categorize.mjs --limit 5` tries the first five changes only.

To adapt this to another pair of texts (two editions, a manuscript and a print, a translation pair in the same language), replace the inputs, adjust the heading patterns in step 01, and rewrite the categories in 03 for your question.

## What a scholar must check, and what is unreliable

- **The categories are an argument.** They come from what scholars have asked of the 1831 revision (Elizabeth, destiny, moral framing). Tone, gender, class, politics and science have no category of their own and land in "wording" or "characterization".
- **One label per change is too few for long rewrites.** The largest change (c0051, the opening of Ch. I) holds the parents' marriage, Elizabeth's new origins and a new providential frame; the models disagree about its main category, and agreement on large changes is only 50%.
- **Rationales can be wrong about the text.** c0113's rationale says the 1818 letter is replaced by "a new letter from Elizabeth herself"; both versions are her letters. c0358 asserts a historical fact (Gower vs. Goring) the pipeline never checked. Read the passage, not just the label.
- **Significance (1–5) is a judgment one change at a time,** made without the whole novel in view. The cheap model never said "low" confidence, even where the stronger model disagreed.
- **The 40-word limit on rationales is not enforced by the schema** (it cannot count words): 42 ran over and are flagged on the page.
- **Model-vs-model agreement is not correctness.** Both models are Anthropic models and may share blind spots. The 25-change reading was done by Claude, not a person.
- **Transcription noise.** The two texts come from different volunteer transcriptions of photo-reprints, so a few differences (especially punctuation and spelling) may be the transcribers', and spelling changes such as *sympathize/sympathise* may be the 1831 printer's house style rather than Shelley's.
- **Moves.** The diff aligns sentences inside matched chapters; a passage moved far away would appear as a removal plus an addition.

## Models and cost

- Categorize: `anthropic/claude-haiku-5.5` via OpenRouter ($0.10 / $0.50 per million tokens in / out; structured outputs confirmed in the OpenRouter catalog on 2026-11-03). 374 calls including a test run and one rerun after a fix: **$0.10**.
- Check: `anthropic/claude-sonnet-5.5` ($2 / $10 per million): 114 calls: **$0.60**.
- **Total: $0.70.** Neither model accepts a `temperature` setting on OpenRouter; asking for one with `require_parameters` finds no endpoint, so it was dropped. The cache, not temperature, is what makes reruns repeatable.

## Sources and copyright

- **1818 text:** Mary Wollstonecraft Shelley, *Frankenstein; or, The Modern Prometheus*, 3 vols. (London: Lackington, Hughes, Harding, Mavor, & Jones, 1818). Project Gutenberg eBook #41445, "produced from a photo-reprint of the 1818 edition": https://www.gutenberg.org/ebooks/41445 (text file https://www.gutenberg.org/cache/epub/41445/pg41445.txt, downloaded 2026-11-03). Public domain in the US.
- **1831 text:** Mary W. Shelley, *Frankenstein*, revised, with a new Introduction (London: Henry Colburn and Richard Bentley, 1831). Project Gutenberg eBook #42324, "produced from a photo-reprint of the 1831 edition": https://www.gutenberg.org/ebooks/42324 (text file https://www.gutenberg.org/cache/epub/42324/pg42324.txt, downloaded 2026-11-03). Public domain in the US.
- **Not used:** Project Gutenberg #84, the most-downloaded *Frankenstein*, is not the 1818 text: it has the 1831 Elizabeth ("the daughter of a Milanese nobleman") and continuous chapters, but no 1831 Introduction. Check which edition an online text is before comparing.
- Anne K. Mellor, "Revising Frankenstein," ch. 9 of *Mary Shelley: Her Life, Her Fiction, Her Monsters* (Routledge, 1988), online at https://knarf.english.upenn.edu/Articles/mellor9.html: the 1831 text makes Victor the pawn of a destiny beyond his control; Elizabeth's changed origins. The page refused automated access on 2026-11-03, so the specific passages were confirmed against the two texts, not against Mellor's page; a reader should check her chapter.
- Stuart Curran, ed., *Frankenstein*, Romantic Circles Electronic Editions (2009), annotation at https://romantic-circles.org/editions/frankenstein/1065.html: "I believed myself destined" substituted for "I felt as if I were destined"; Victor already appeals to destiny in 1818.
- Wikipedia, "Elizabeth Lavenza," https://en.wikipedia.org/wiki/Elizabeth_Lavenza (a tertiary source that cites no scholarship for the edition differences; listed so students can see the difference).
- Model outputs (labels and rationales) are generated text, included here as the record of the run.
