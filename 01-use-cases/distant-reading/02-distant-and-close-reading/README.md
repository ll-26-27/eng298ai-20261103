---
title: "distant and close reading, beyond word search"
description: A model reads every passage of four public-domain texts for scenes of instruction (a concept no keyword can find), compared with a keyword search, checked by hand, and the strongest passages read closely; the output is one self-contained page.
author: claude
created: 2026-11-03
---

# distant and close reading, beyond word search

A model reads all 982 passages of *Frankenstein*, *R.U.R.*, *The Picture of Dorian Gray*, and the *Phaedrus* and marks every **scene of instruction** (one being teaching, training, or forming another), so we can compare that against a keyword search across whole texts, check how often the model is right, and then read the strongest passages closely.

**Open the output:** double-click [`outputs/index.html`](outputs/index.html). It works offline; all the data is inside the file.

## The concept, and why word search can't find it

A *scene of instruction* is a moment in which one being forms another: teaches it to speak, read, think, feel, see, or desire. It runs through all four texts and through this course's questions about makers and the made: the creature learns language by watching the De Laceys through a chink in the wall; Lord Henry remakes Dorian in a single afternoon's talk; Socrates turns Phaedrus from rhetoric toward philosophy; the last Robots beg Alquist to teach them how Robots are made. But the texts rarely use the word "teach" for these moments. Wilde's word is *influence*; Shelley's creature calls language "a godlike science"; Plato stages instruction as conversation. Meanwhile the most common keyword hit, "learned", usually means "found out". So keywords both miss the concept and drown it in false hits, which is exactly where a model reading each passage for a *relation* (who forms whom, and how) can help.

## Results in brief

Across 982 passages (numbers from `operations/04-comparison.md` and `operations/05-check-results.json`):

| text | passages | keyword hits | model hits (clear or central) | both | keyword only | model only (clear or central) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| *Frankenstein* | 348 | 58 | 103 (48) | 45 | 13 | 58 (23) |
| *R.U.R.* | 117 | 6 | 18 (5) | 3 | 3 | 15 (4) |
| *Dorian Gray* | 402 | 32 | 124 (45) | 22 | 10 | 102 (39) |
| *Phaedrus* | 115 | 22 | 85 (30) | 20 | 2 | 65 (21) |
| **all** | 982 | 118 | 330 (128) | 90 | 28 | 240 (87) |

- **Word search misses most of it.** Of the 128 passages the model judged clear or central scenes of instruction, 87 contain none of the keywords: Lord Henry's first speeches to Dorian, the creature reading *Werter*, the charioteer taming the wild horse, Helena trying to change how the factory's directors see the Robots. In the hand check, the keyword search would have found 4 of the 11 passages the reader judged to be scenes of instruction.
- **Word search also finds the wrong things.** 28 keyword hits were rejected by the model, mostly "learned" meaning "found out" or school mentioned in a clause.
- **The distant view shows a shape.** In *Dorian Gray* instruction clusters in chapters II–IV (Lord Henry's influence), nearly vanishes in chapters XIV–XVIII, and returns in XIX when Dorian and Lord Henry talk again; in *Frankenstein* it is densest in Victor's education (Volume I, chapters I–III) and in the creature's education by the De Laceys (Volume II, chapters IV–VII), and nearly absent from the pursuit in Volume III; in the *Phaedrus* the model marks almost the whole dialogue, which is either a finding (the dialogue *is* instruction) or a sign that the definition is too loose for Plato. That's a question for the seminar.
- **The check** (30 passages read blind, step 5): the model agreed with the reader on 26 of 30. Precision 11 of 15 (73%); all four errors were strength-1 ("brief") calls, and its strength 2–3 calls were right 3 of 3. None of the 15 model negatives was a missed scene of instruction, so recall looks high, but 15 negatives is too few to say much: a pessimistic reading of the same sample puts it nearer 65%. The reader here was Claude, not a person; see below.
- **Quotations:** 2 of the model's 330 evidence quotations were not verbatim (it changed "and were initiated" to "we were initiated", and added "he" to another); all 169 quotations in the 15 close readings were found in their passages.
- **Embeddings** (step 7): all 30 passages most similar to the seed passage (the creature learning words) are in *Frankenstein*, every one of them from the creature's own narrative around it (Volume II, chapters II–VIII). Similarity finds what sounds alike, not what does the same thing.

## The chain: inputs → operations → outputs

Everything in `operations/` is numbered in the order it runs. Each step says what kind of thing it is.

1. **Chunk** — `01-chunk.mjs` → `01-chunks.json`. *Script, deterministic.* Strips the Project Gutenberg header and license (and Jowett's introduction to the *Phaedrus*, and the *R.U.R.* property list), joins wrapped lines into paragraphs, splits long paragraphs at sentence ends and merges short ones (dialogue) into passages of about 150–300 words. Each passage records its text, chapter or act, and position (0 = start, 1 = end).
2. **Keyword baseline** — `02-keyword-baseline.mjs` → `02-keyword-hits.json`. *Script, deterministic.* The best honest word search for the concept: teach, taught, learn, lesson, instruct, tutor, educate, pupil, disciple, school, preceptor, with their inflections. The pattern was fixed before seeing any model output; the comment in the script lists what was left out and why.
3. **Classify** — `03-classify-prompt.md` + `03-classify.mjs` → `03-classifications.json`. *Prompt and script, model judgment.* For every passage, a cheap model answers in enforced JSON: is it a scene of instruction; strength 0–3; who instructs whom; what is taught; a quotation of 25 words or fewer as evidence; a one-sentence reason. The script reads its prompt from the `.md` file, so the prompt you read is the prompt that ran. You can paste the prompt into Claude Code with a passage to try it by hand.
4. **Compare** — `04-compare.mjs` → `04-comparison.json`, `04-comparison.md`. *Script, deterministic.* Counts agreements and disagreements per text, lists what each method found that the other didn't, with examples, and **checks in code that every evidence quotation actually occurs in its passage**.
5. **Check** — `05a-check-sample.mjs` → `05-check-sheet.md`; a reader fills in `05-check-judgments.json`; `05b-check-score.mjs` → `05-check-results.json`. *Human check, the guardrail.* Draws 30 passages at random with a fixed seed (15 the model called positive, 15 negative, mixed so the reader can't tell), shows them without the model's answers, and scores the model against the reader's judgments: precision, and a rough recall estimate weighted by the size of each group.
6. **Close read** — `06-close-read-prompt.md` + `06-close-read.mjs` → `06-close-readings.json`. *Prompt and script, model judgment (a stronger model).* Picks the strongest passages (strength 3 first, at most four per text, never two from the same scene) and asks for a 170–240-word close reading grounded in quotation, plus one open question. The script then **verifies every quotation in code**. These readings are interpretations for a scholar to argue with, and the page labels them that way.
7. **Embed** (optional third method) — `07-embed.mjs` → `07-similarity.json`. *Script, model arithmetic (no judgment).* Turns every passage into an embedding and ranks all passages by similarity to one seed passage (the creature learning words from the cottagers, `frankenstein-0158`).
8. **Build the page** — `08-build-page.mjs` + `08-page-template.html` → `outputs/index.html`. *Script, deterministic.* Embeds all the data inline so the page opens from the file system.

Shared helpers (paths, the cached and cost-logged OpenRouter call, a seeded random generator) are in `operations/_lib.mjs`. Every model call appends its tokens and cost to `operations/cost-log.jsonl`.

## Rerunning it

From the repository root, with an OpenRouter key in the root `.env` as `OPENROUTER_API_KEY`:

```
node 01-use-cases/distant-reading/02-distant-and-close-reading/operations/01-chunk.mjs
node 01-use-cases/distant-reading/02-distant-and-close-reading/operations/02-keyword-baseline.mjs
node --env-file=.env 01-use-cases/distant-reading/02-distant-and-close-reading/operations/03-classify.mjs all
node 01-use-cases/distant-reading/02-distant-and-close-reading/operations/04-compare.mjs
node 01-use-cases/distant-reading/02-distant-and-close-reading/operations/05a-check-sample.mjs
node 01-use-cases/distant-reading/02-distant-and-close-reading/operations/05b-check-score.mjs
node --env-file=.env 01-use-cases/distant-reading/02-distant-and-close-reading/operations/06-close-read.mjs
node --env-file=.env 01-use-cases/distant-reading/02-distant-and-close-reading/operations/07-embed.mjs
node 01-use-cases/distant-reading/02-distant-and-close-reading/operations/08-build-page.mjs
```

`03-classify.mjs` takes a text id and a limit for a cheap trial first (`03-classify.mjs rur 10`). Model responses are cached in `operations/cache/` (gitignored), so a rerun after a crash only pays for what's missing; changing a prompt changes the cache key and reruns everything that prompt touches. Before step 5b, delete `05-check-judgments.json` and do the check yourself: `05a` writes a fresh blank form only when none exists.

**To adapt it to your own project**, change three things: the texts in `inputs/` and the `TEXTS` list in `01-chunk.mjs`; the keyword pattern in `02-keyword-baseline.mjs`; and the definition in `03-classify-prompt.md` (and `06-close-read-prompt.md`). The rest of the chain doesn't care what the concept is.

## What a scholar must check, and what's unreliable

- **The definition is the argument.** The model applies the definition in `03-classify-prompt.md`, and where it draws the line (does Lord Henry's flattery count? does the creature reading *Paradise Lost* on his own count?) is a critical decision, not a technical one. Change the definition and the map changes.
- **The model is wrong some of the time,** in both directions. Read the check in step 5 and its disagreements, and read the passages behind any claim you make. It can also pick the right passage and misdescribe it: in *R.U.R.*, Act One (`rur-0023`, `rur-0024`) it names the factory's human directors as "the robots", repeating Helena's mistake in the scene as if it were fact. The stronger model in step 6 read the same passage correctly ("Preaching Liberation to the Makers").
- **The check was done by Claude, not by a person.** The agent that built this example read the 30 passages blind and recorded its judgments in `operations/05-check-judgments.json`, with notes; six were borderline. That shows the method, but it is a model checking a model. Before class or before relying on the labels, a person should delete that file, rerun `05a`, and judge the sheet. Thirty passages is a smoke test, not a measurement.
- **Strength is the least reliable field.** Models are inconsistent about the line between 1 and 2, and between 2 and 3. Use it to sort, not to count.
- **Evidence quotations can be misquoted;** step 4 flags any that aren't verbatim, and step 6 does the same for the close readings. A quotation that isn't in the passage is a fabrication until you've checked it.
- **The close readings are generated interpretations.** They are fluent and often perceptive, and they are not scholarship: they don't know the critical conversation, they can overread, and they always find *something*. Argue with them.
- **No temperature control.** The Claude models on OpenRouter don't accept a `temperature` setting, so a fresh run (with the cache cleared) can label some borderline passages differently.
- **Chunk boundaries matter.** A scene that straddles two passages may be judged weaker in each half; a 300-word window can't see that a scene began two pages earlier.
- **Embeddings find what sounds alike, not what does the same thing.** Step 7's similarity ranking stays almost entirely inside *Frankenstein*, near the seed: useful for finding neighboring passages, useless for finding the concept across texts. That contrast is the point of including it.
- **Translations.** *R.U.R.* and the *Phaedrus* are read in English translations (1923 and Jowett's, 1871 onward); the model is reading Selver and Playfair, and Jowett, not Čapek or Plato.

## Models and cost

| step | model | calls | tokens in / out | cost |
| --- | --- | ---: | --- | ---: |
| 3, classify | `anthropic/claude-haiku-5.5` (structured outputs; $0.10 / $0.50 per million tokens) | 1,059 logged | 1.60M / 0.41M | $0.36 |
| 6, close read | `anthropic/claude-opus-5.5` (structured outputs; $4 / $20 per million) | 15 | 30K / 17K | $0.46 |
| 7, embed | `google/gemini-embedding-2` via `POST /api/v1/embeddings` | 16 batches | 247K | $0.05 |
| | | | **logged total** | **$0.88** |

The logged total is from `operations/cost-log.jsonl`. It undercounts a little: in the first classification run, about 120 replies (mostly *Phaedrus*) were cut off at the 600-token limit and retried, and those failed calls were not logged until the script was fixed. That adds an estimated $0.15–0.25, so the whole build cost roughly **$1.10**. A clean rerun of every step would cost about $0.90.

Model IDs and structured-output support were confirmed against `https://openrouter.ai/api/v1/models` on 2026-11-03.

## Sources and copyright

All four inputs are kept exactly as downloaded from Project Gutenberg (header and license included) in `inputs/`.

| file | work | source | status in the US |
| --- | --- | --- | --- |
| `frankenstein-1818-pg41445.txt` | Mary Shelley, *Frankenstein; or, The Modern Prometheus*, first edition (London: Lackington et al., 1818), three volumes | https://www.gutenberg.org/ebooks/41445 | public domain (published 1818) |
| `rur-selver-playfair-1923-pg59112.txt` | Karel Čapek, *R.U.R. (Rossum's Universal Robots)*, English version by Paul Selver and Nigel Playfair (New York: Samuel French / Doubleday, Page, copyright 1923) | https://www.gutenberg.org/ebooks/59112 | public domain: published in the US in 1923, so its copyright expired on January 1, 2019. This is the Samuel French acting edition, with full stage directions and a property list (step 1 skips the list). |
| `dorian-gray-1891-pg174.txt` | Oscar Wilde, *The Picture of Dorian Gray*, the 1891 book version (20 chapters, with the Preface) | https://www.gutenberg.org/ebooks/174 | public domain (published 1891) |
| `phaedrus-jowett-pg1636.txt` | Plato, *Phaedrus*, translated by Benjamin Jowett (*The Dialogues of Plato*, first published 1871; the Gutenberg file does not name the edition) | https://www.gutenberg.org/ebooks/1636 | public domain (Jowett died in 1893; every edition of the translation is pre-1929). The file includes Jowett's long introduction; step 1 skips it and reads only the dialogue. |

Project Gutenberg's trademark license applies to the files as distributed with its header; the texts themselves are free to use in the US. Readers outside the US should check their own country's law.
