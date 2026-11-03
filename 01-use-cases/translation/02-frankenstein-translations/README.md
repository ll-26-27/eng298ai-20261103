---
title: "Frankenstein in translation"
description: How have translators rendered the creature's plea, "I ought to be thy Adam ... misery made me a fiend"? Twenty-one verified renderings in fourteen languages, 1821 to 2025, read for their connotations and compared; plus the first translation in each of 25 languages and a second passage (the awakening) followed through the early translations.
author: claude
created: 2026-11-03
---

# *Frankenstein* in translation

A worked example of comparing translations: find as many published renderings as we can verify of one short, loaded passage (the creature's plea to Victor on the glacier), have a model back-translate each one and name the connotations its words carry in their own language, check the surprising claims in dictionaries, and lay the renderings side by side so you can see what each translator highlighted and what they muted.

Open **`outputs/index.html`** by double-clicking it. It works offline (fonts fall back to system serifs without a connection).

**Where it stands (2026-11-03):**

- **The plea:** 21 renderings in 14 languages, from 1821 to 2025: French, German, Spanish, Portuguese, Italian, Dutch, Russian, Czech, Serbian, Bulgarian, Hungarian, Turkish, Japanese and Chinese. Two are public domain and quoted in full (Saladin's French, 1821; Widtmann's German, 1912). The other 19 are still in copyright and quoted only for the two key sentences, with full citations. Every quotation was copied from a source we can point to. Step 2 re-found 17 of them by script; two sit in PDFs a script can't read, one in a scan whose OCR is garbled, and the Dutch is half-confirmed.
- **What the comparison shows:** every translator keeps Adam and the fallen angel; they split on "fiend". Twelve make him a demon or devil (*demonio*, *Teufel*, *демон*, *şeytan*, 恶魔, and Shishido's 鬼, the Japanese folk ogre-demon). Two make him a monster. Five dissolve the noun into "bad" or "what I am now" (Widtmann, Korbař, Stevović, Liu Xinmin, an unnamed Spanish text). Saladin makes him "like the spirit of evil", and Bonillo (2023) "an enemy". Many translators also turn "benevolent" into meekness or a child's good behaviour, and "misery" into bad luck. Several add Paradise where Shelley has only "joy".
- **Lower on the page:** the first translation of the novel in each of 25 languages (12 verified, 8 partly verified, 5 unverified; 1821 to 1996), and a second passage, the creature's awakening, compared in the 1821 French and 1912 German and in model translations made one-shot and after a critique.

## The chain

Each step says what kind of thing it is (a prompt, a script, or a data file) and whether it is deterministic code, model judgment, or research that was verified. Steps 1 to 5 are the comparison at the centre of the page; steps 6 to 9 are the secondary sections; step 10 builds the page.

0. **`operations/00-fetch-texts.mjs`** (script, deterministic): downloads every public-domain text in `inputs/texts/manifest.json` and cuts Shelley's two passages out of the 1818 and 1831 editions by their first and last words, into `inputs/comparison-passage.json` (the plea) and `inputs/anchor-passage.json` (the awakening).
1. **`01-why-this-passage.md`, `01-renderings-prompt.md` → `01-renderings.csv`** (prompt + data, verified research): why we chose the plea, and the brief given to three Claude Code agents with web search (Romance languages; Germanic, Slavic and Hungarian; Asian and others). Each quotation was copied from a page an agent fetched, never from memory. The lead session reconciled the reports into the CSV, one row per rendering: translator, year of first publication, the edition quoted, the source URL and what kind of source it is, a `source_flag`, the copyright status, how much is quoted, the quotation, and how it was verified. Seven renderings it found were left out because their attribution was too weak (see "Leads not used").
2. **`02-check-quotes.mjs` → `02-quote-check.json`** (script, deterministic): re-finds every quotation in its source: the local file for the public-domain texts; otherwise it fetches the page now (for Internet Archive items, the item's OCR text) and searches it, decoding legacy encodings, HTML entities, Japanese ruby, and OCR line-end hyphens. Nothing it fetches is saved. Sources it can't read are marked "not checkable by script".
3. **`03-connotations-prompt.md` → `03-connotations.mjs` → `03-connotations.json`** (prompt + script, model judgment with a JSON schema): for each rendering, Claude Opus 5.5 writes a literal back-translation; fills nine key-word slots (creature, Adam, fallen angel, drivest from joy, misdeed, benevolent, misery, fiend, virtuous) with the translator's exact words, a word-by-word gloss and a sense from a fixed list; writes two to five notes on the connotations those words carry in their language, flagging claims a dictionary should confirm; and places the rendering on two scales (demonic to pitiable, biblical to secular). Code then checks that every copied word occurs in the quotation. **The sense lists and the scales are an interpretive scheme made for this page.**
4. **`04-synthesis-prompt.md` → `04-synthesize.mjs` → `04-synthesis.json` → `04-synthesis-edited.md`** (prompt + script, model judgment, then edited by hand): one call compares all 21 readings and drafts a synthesis, a line per rendering on what it highlights and mutes, and the most striking contrasts. The lead session then edited the draft against the quotations and the dictionary checks (correcting a misquotation and a miscount), and the page shows the edited version. The per-rendering lines on the cards come from the draft.
5. **`05-dictionary-checks.json`** (verified research): eight of the flagged connotation claims looked up in the TLFi (via CNRTL), the Luther Bible, Wiktionary (English, Russian, Japanese) and the Türk Dil Kurumu dictionary. Six were confirmed, one was partly confirmed (Russian *отлучить* can mean excommunicate, but it doesn't have to), and one was confirmed only in part (*forfait* is grave, but not specifically juridical). The other flagged claims stay marked "check" on the page.
6. **The first translations:**
   - **6a. `06a-draft-prompt.md` → `06a-draft-candidates.mjs` → `06a-model-draft.json`** (model judgment, no web): two models list first translations from memory. These are leads only.
   - **6b. `06b-verify-prompt.md` → `06b-translations-inventory.csv`** (verified research): agents checked every language against national library catalogues, WorldCat, title pages and reception studies, recording URLs and a status (*verified*, *partly verified*, *unverified*).
   - **6c. `06c-compare-draft-to-verified.mjs` → `06c-draft-vs-verified.csv`** (deterministic): memory against research. From memory, Gemini 3.8 Flash answered all 25 languages and got 10 of the 23 comparable years right; Claude Sonnet 5.5 declined 23.
7. **`07-locate-passage.mjs` → `07-passages.json`** (model points, code checks): a model returns the first and last words of the awakening in each public-domain translation, and code cuts the translator's text out between them.
8. **`08-compare-prompt.md` → `08-backtranslate-compare.mjs` → `08-comparisons.json`** (model judgment with a JSON schema): back-translates the awakening and sorts each departure from Shelley into six categories.
9. **`09-chain-prompts.md` → `09-translate-critique-retranslate.mjs` → `09-chain.json`** (model judgment): translate, critique with a second model, revise, into French and German. Step 8 then reads these too, so it runs after step 9 when you rerun.
10. **`10-page-template.html` + `10-build-page.mjs` → `outputs/index.html`** (deterministic): merges every data file into the template inline, so the page opens from the file system without a server.

`operations/lib/openrouter.mjs` is the shared model client. It caches every response in `operations/cache/`, so reruns are free unless a prompt changes, and it logs tokens and cost for every live call to `operations/costs.jsonl`.

## How to rerun it

From the repository root, with `OPENROUTER_API_KEY` in the root `.env`:

```
node 01-use-cases/translation/02-frankenstein-translations/operations/00-fetch-texts.mjs
node 01-use-cases/translation/02-frankenstein-translations/operations/02-check-quotes.mjs
node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/03-connotations.mjs
node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/04-synthesize.mjs
node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/06a-draft-candidates.mjs
node 01-use-cases/translation/02-frankenstein-translations/operations/06c-compare-draft-to-verified.mjs
node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/07-locate-passage.mjs
node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/09-translate-critique-retranslate.mjs
node --env-file=.env 01-use-cases/translation/02-frankenstein-translations/operations/08-backtranslate-compare.mjs
node 01-use-cases/translation/02-frankenstein-translations/operations/10-build-page.mjs
```

Steps 1, 4 (the edit), 5 and 6b are research or editing, not scripts. To add a rendering, add a row to `01-renderings.csv` with its exact quotation and source, then rerun steps 2, 3 and 4 and re-edit `04-synthesis-edited.md`. With the cache in place, rerunning costs nothing.

## Methods and findings

- **The connotation notes, senses, scales and back-translations are a model's readings.** Many are sharp; some are speculative (a Lermontov echo in Russian *демон*, a 2011 political ring for Portuguese *malfeito*). Read the translator's words, and check any claim about a word's history in a dictionary before repeating it. The scales are the crudest part: they put Seber's *şeytan* and Shishido's 鬼 at the same "more pitiable" point as Korbař's *zlým*.
- **Twenty-one renderings show tendencies, not patterns of period or language.** Most languages have one or two, and six renderings are undated (the Liu Xinmin, Pareja and Torres Oliver translations are older than the editions quoted; three texts name no translator).
- **Attributions.** Liu Xinmin's name rests on the reading site's preface page; the unnamed French (an e-text of 2003), the unnamed Spanish (a 2015 budget ebook), and the second Chinese text are unattributed. Maghelli's Italian was checked against Wikiquote only, the Grawes' German against a magazine excerpt, Brinkman's Dutch against two reviews (the "benevolent" clause wasn't seen), and Seber's Turkish against an essay that quotes it with a page number.
- **Transcriptions.** Most in-copyright quotations come from OCR or PDF text layers. Aleksandrova's Russian has an OCR slip (”) for a comma; Stevović's Serbian was read from a scan's text layer because the OCR is garbled; Widtmann's German comes from a 2009 reprint not checked against 1912. Check against page images before quoting in print.
- **Sources flagged "unauthorised upload"** (`source_flag` in the CSV): seven renderings (three Spanish, two Portuguese, the Russian and the Serbian) were verified in Internet Archive copies that are probably unauthorised uploads of in-copyright books. The page cites the printed editions and does not link those copies; the CSV keeps the URLs so the check can be rerun. Decide whether the CSV should carry them in a public repo.
- **The first-translations inventory** (lower on the page): "first" is a definition (the Japanese first is an unfinished 1889 serial; Turkish books made from the films are not counted), unverified rows are leads, and newspaper serials were not searched.

## Leads not used

Found by the agents but left out because the attribution or the source was too weak to present as a published translation: a Greek quotation in a 2018 newspaper article (no translator named; it switches between plural and singular "you"); an Arabic quotation on Goodreads (user-contributed, no translator); two Polish quotations (a user-posted fragment on lubimyczytac.pl, and a plot summary on historykon.pl that may be the writer's own); a Catalan quotation in an essay in *Mètode* that matches the unnamed Spanish almost word for word; a Spanish quotation inside a translated essay by Joyce Carol Oates; and a Korean line seen only in search snippets. Not found at all: Swedish, Danish, Norwegian, Finnish, Romanian, Hebrew, Esperanto, Portugal's Portuguese, and the modern Japanese translations (Morishita, Serizawa, Kobayashi). The best lead for another public-domain French text is Germain d'Hangest's 1922 translation, once on French Wikisource.

## Models and cost

| step | model (OpenRouter ID, checked against the live model list on 2026-11-03) | what it does |
| --- | --- | --- |
| 3, 4 | `anthropic/claude-opus-5.5` | read each rendering; draft the synthesis |
| 6a | `anthropic/claude-sonnet-5.5`, `google/gemini-3.8-flash` | draft the inventory from memory |
| 7 | `google/gemini-3.8-flash` | point to the awakening in a long text |
| 8 | `anthropic/claude-sonnet-5.5` | back-translate and categorize the awakening |
| 9 | `google/gemini-3.8-flash` translates and revises; `anthropic/claude-sonnet-5.5` critiques | the translation chain |

**Actual cost of the model calls: $1.75** for 39 calls (Claude Opus 5.5 $1.38 for steps 3 and 4; Claude Sonnet 5.5 $0.27; Gemini 3.8 Flash $0.10), every call logged in `operations/costs.jsonl`. The research in steps 1 and 6b was done by six Claude Code agents with web search under the session's Claude plan (roughly 1.1 million tokens between them), which doesn't appear in that log.

## Inputs: sources and copyright

| input | where it's from | copyright (US) |
| --- | --- | --- |
| *Frankenstein*, 1818 text | Project Gutenberg #41445, https://www.gutenberg.org/ebooks/41445 | public domain |
| *Frankenstein*, 1831 text | Project Gutenberg #84, https://www.gutenberg.org/ebooks/84 | public domain |
| *Frankenstein, ou le Prométhée moderne*, vols. 1 and 2, trans. Jules Saladin (Paris: Corréard, 1821) | Project Gutenberg #62404 and #62405, transcribed from the Gallica (BnF) scans | public domain |
| *Frankenstein oder Der moderne Prometheus*, trans. Heinz Widtmann (Leipzig: Max Altmann, 1912), two chapters only | Projekt Gutenberg-DE, chapters 11 and 16 (their source: a 2009 Fischer Taschenbuch reprint) | public domain in the US (published 1912); the reprint text is not checked against 1912 |
| 19 in-copyright renderings of the plea, two sentences each | the editions and URLs in `operations/01-renderings.csv` | in copyright: brief quotation for comparison, with citation |
| bibliographic records for the first translations | the URLs in `operations/06b-translations-inventory.csv` | metadata and links only |

The downloaded texts sit in `inputs/texts/` and are listed in `inputs/texts/manifest.json`. No in-copyright page is stored in the repo; step 2 fetches and discards.
