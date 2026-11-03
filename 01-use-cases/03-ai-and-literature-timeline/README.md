---
title: "Use case 03: a timeline of AI and literature"
description: A model drafts a history of made beings, dialogue, and computing; every event is checked against a source; a second model tags it; a script builds an interactive timeline. Shows how model-drafted history gets verified.
author: claude
created: 2026-11-03
---

# A timeline of AI and literature

An interactive timeline of 116 events, from Homer's golden attendants to this seminar, in four lanes (course readings, made beings in literature and film, theories of dialogue, AI and computing), in which a model drafted every event and each date and claim was then checked against a source before it reached the page.

**Open it:** double-click `outputs/index.html`. It needs no server and no internet connection; the data is inside the file. Click any event for its description, why it matters for the course, the source, and what checking found. Add `#event-id` to the address (for example `index.html#capek-rur`) to open on one event.

## The chain

Inputs, then numbered operations, then the output. Each step says what kind of thing it is (prompt, script, or data) and who decides: deterministic code, model judgment, or verified research.

**Input.** `inputs/course-readings.json`: the course's reading list as metadata only (author, title, seminar, role) plus the arXiv IDs of the papers in the course's AI papers folder. No text from any reading.

1. **Draft** (model judgment). `operations/01-draft-prompt.md` is the prompt; `operations/01-draft.mjs` sends it with the reading list (authors and titles, but deliberately *not* the years, so the dates are the model's own) and writes `operations/01-candidates.json`: 112 candidate events, each with a date, a two-sentence description in the model's own words, a source URL to check against, an optional short quotation for public-domain texts, and a note on what the model itself was unsure of. One call per lane. The first attempt asked for all lanes in one call and came back truncated: the model spent two thirds of its output budget thinking and ran out mid-JSON (that failed call is still in the cost log).
2. **Verify** (verified research, in three parts).
   - `operations/02a-fetch-sources.mjs` (deterministic code) fetches the evidence for each candidate: the lead section of the Wikipedia article, the arXiv record (first-submission date), or the Crossref record for a DOI. It writes `operations/02a-source-extracts.json` and runs a crude test: does the claimed year appear in the source text? That test only sorts the work (80 of 112 passed); passing is not verification.
   - `operations/02b-verdicts.json` (research) holds one verdict per event: `verified`, `corrected`, `unverified`, or `dropped`, with what was read and what it said, and the fields that were fixed. Where the fetched lead wasn't enough, the checker read further into the article, searched the web, or went to the primary text (the course's copies of Shelley, Wilde, and Bergson; Legge's *Analects* on Project Gutenberg; Lovelace's 1843 notes on Wikisource). It also lists four events the checker added because the draft left gaps.
   - `operations/02c-merge.mjs` (deterministic code) applies the verdicts and writes `operations/02-events-verified.csv` (the table to read) and `operations/02-events-verified.json` (for the next step). It strips quotations from anything not in the public domain.
3. **Categorize** (model judgment, constrained by a JSON schema). `operations/03-categorize-prompt.md` and `operations/03-categorize.mjs` give each verified event a lane, one to three themes from a fixed list of eight, and one sentence on why it matters for the course. The schema means the model can't invent a theme or skip a field. One rule is code, not judgment: only works on the course list go in the readings lane. The model moved three events (Weizenbaum's book, Searle's Chinese Room, Bender and Koller's octopus paper) from the dialogue lane to computing; those moves are recorded in `operations/03-events-categorized.json` under `track_disagreements`. Output: `operations/03-events-categorized.json`.
4. **Build** (deterministic code). `operations/04-build.mjs` puts the data into `operations/04-template.html` and writes `outputs/index.html`. The page is hand-built HTML, CSS, and JavaScript with no libraries. The axis is broken into seven eras, each with its own linear scale and a width proportional to how many events it holds, so 2,800 years fit on one scroll without the last decade collapsing into a point.

Shared helper: `operations/openrouter.mjs` makes the model calls, caches every response in `operations/cache/` (so a rerun costs nothing unless a prompt or its data changed), and appends tokens and cost to `operations/cost-log.csv`.

## What verification caught

Of 112 drafted events, 89 were confirmed as drafted and 23 were corrected; none had to be dropped or left unverified. The model was almost always right about the year. It was less reliable about everything around the year:

- **Which event a date belongs to.** The 1931 *Frankenstein* film: the draft called November 21 the New York premiere; it is the release date, and the film opened in New York on December 4. *R.U.R.*: the draft gave the Prague opening as the premiere; the first performance was weeks earlier in Hradec Králové. Siri: the title said it "ships" on a date that was the announcement.
- **Wording of quotations.** The *Frankenstein* line was given in its 1831 wording but cited to 1818 (the 1818 text has a comma after "November"). Wilde's "rewrite" is "re-write" in *Intentions*. Both caught by checking against the course's own copies. The other four quotations matched.
- **Titles.** Bakhtin's 1929 book was *Problems of Dostoevsky's Creative Art*, not the draft's *Problems of Dostoevsky's Art*.
- **Details in descriptions.** Talos is not a "giant" in any ancient source; only one of Chiang's two protagonists is a former zookeeper; the *Phaedrus* doesn't "close with" the Theuth myth.
- **Links.** Five source URLs were broken or wrong: three Wikipedia articles that don't exist, the disambiguation page for the word "her", and a publisher's home page.
- **False precision.** For *Neuromancer*, *Machines Like Me*, Lucian, and MYCIN, the draft gave a month or a year the sources read didn't support, so the display was reduced to what could be confirmed.
- **Sources that disagree.** The Dartmouth proposal is dated August 31, 1955 on the document and September 2, 1955 on Wikipedia; the page no longer asserts either.

The full list is on the page ("What checking caught") and in `operations/02-events-verified.csv`.

## What a scholar must still check

- **The checker was also an AI.** Verification was done by a Claude Code agent reading sources and searching the web, not by a person. It is recorded so that a person can redo it: every row says what was read. Spot-check the `corrected` rows first, then a sample of `verified` ones.
- **Most checks rest on Wikipedia,** with arXiv, Crossref, publishers, and primary texts where they mattered. Wikipedia is a reasonable first check of a date and a poor final authority on a contested one. Ancient and medieval dates (Homer, the *Analects*, the Talmud, the *Liezi*) are scholarly estimates, and the page places them at a single point only to draw them.
- **Descriptions were read for errors, not proved line by line.** The date and the main claim were checked; a secondary detail in a paraphrase may still be off.
- **"Why it matters" and the themes are model interpretation.** Treat them as prompts for discussion, not findings.
- **Selection is the model's.** The canon here is heavily Anglo-European and English-language, the computing lane favors papers and products that are easy to date, and the four events the checker added (Stochastic Parrots, "vibe coding", Claude Code, this seminar) reflect what the checker noticed was missing. What's absent is a choice worth arguing about.
- **The axis distorts time on purpose.** Each era has its own scale, so distances between eras mean nothing.
- **Recent events rest on recent reporting.** The date of the "vibe coding" post (February 2, 2025) comes from reports and embedded copies; one source says February 6. Check the original post.

## How to rerun

Run from the repo root. Steps 1 and 3 need `OPENROUTER_API_KEY` in the repo's `.env`; the others need no key. Because responses are cached, rerunning an unchanged step is free.

```
node --env-file=.env 01-use-cases/03-ai-and-literature-timeline/operations/01-draft.mjs
```

```
node 01-use-cases/03-ai-and-literature-timeline/operations/02a-fetch-sources.mjs
```

Then read `02a-source-extracts.json`, check each candidate, and record verdicts in `02b-verdicts.json`. This is the step that can't be automated.

```
node 01-use-cases/03-ai-and-literature-timeline/operations/02c-merge.mjs
```

```
node --env-file=.env 01-use-cases/03-ai-and-literature-timeline/operations/03-categorize.mjs
```

```
node 01-use-cases/03-ai-and-literature-timeline/operations/04-build.mjs
```

To make your own: replace `inputs/course-readings.json` with your reading list, rewrite the lanes in the two prompts and the `TRACKS` and `ERAS` lists in `04-template.html`, and expect the verify step to take most of the time.

## Models and cost

Model IDs were confirmed against OpenRouter's model list on November 3, 2026.

| step | model | calls | cost |
| --- | --- | --- | --- |
| 1 draft | `anthropic/claude-opus-5.5` | 5 (one failed, truncated) | $1.40 |
| 3 categorize | `anthropic/claude-sonnet-5.5` | 9 (six, then three rerun after title corrections) | $0.36 |
| **total** | | 14 | **$1.76** |

Verification used web search and page fetches inside the Claude Code session, which aren't in the cost log.

## Sources and rights

- Evidence for dates: English Wikipedia (lead sections fetched through the MediaWiki API; text in `02a-source-extracts.json` is CC BY-SA), the arXiv API, Crossref, the ACL Anthology, Anthropic's announcements, Fulcrum (University of Michigan Press), the Film Society of Lincoln Center, the Berlinale archive, and the other pages named in each row of `02-events-verified.csv`.
- Primary texts for quotations: Legge's translation of the *Analects* (1861; Project Gutenberg #4094); Lovelace's "Notes by the Translator", *Scientific Memoirs* vol. 3 (1843; Wikisource); the 1818 *Frankenstein*, Wilde's *Dorian Gray* (1891) and *Intentions* (1891), and Bergson's *Laughter* (trans. 1911), all public domain in the US.
- Quotations appear only for public-domain works, at most one short line each. Everything else is a paraphrase written by the model and checked, and works still in copyright are represented by metadata and a link.
