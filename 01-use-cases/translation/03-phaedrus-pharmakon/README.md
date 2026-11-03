---
title: "Plato's pharmakon in translation"
description: One crux of the Phaedrus (274c–275b, writing as a pharmakon of memory or of reminding) followed through seventeen public-domain translations in ten languages, 1484 to 1922, with every key rendering extracted by a model and checked against the translator's own text.
author: claude
created: 2026-11-03
---

# Plato's *pharmakon* in translation

A worked example of a philological pipeline: find every public-domain translation of the myth of Theuth and Thamus (*Phaedrus* 274c–275b) we can verify and download, cut the passage out of each, have a model pull out each translator's words for φάρμακον, μνήμη, ὑπόμνησις, σοφία and δοξόσοφοι, check every extracted word against the translator's text by code, and lay the results out so the drift of *pharmakon* across five centuries is visible at a glance.

Open **`outputs/index.html`** by double-clicking it. It works offline (fonts fall back to system serifs without a connection).

**Where it stands (2026-11-03):** 17 translations with their text, in 10 languages (Latin, English, German, French, Italian, Spanish, Russian, Polish, Finnish, Modern Greek), from Ficino's Latin (first printed 1484) to Meunier's French (1922), plus 10 more in the inventory as metadata only (in-copyright translations, and public-domain ones we could not fetch or date). 136 extracted renderings were checked against their passages by code: 135 occur verbatim, and the one that doesn't is explained in the spot-check.

**What the page shows about *pharmakon*:** the medical sense dominates the older versions (Ficino's *remedium*, Taylor's, Cary's and Wright's *medicine*, Cousin's *remède*, Azcárate's *remedio*, Witwicki's *lekarstwo*), while the German, Russian, Finnish and one Italian version choose a neutral "means" (*Mittel*, *Hilfsmittel*, *средство*, *apukeino*, *aiuto*). Several translators change word between Theuth's claim and Thamus's reply (Cousin *remède* → *moyen*, Azcárate *remedio* → *medio*, Dalbono *aiuto* → *mezzo*), which breaks the turn in which Thamus answers Theuth in his own word. Nobody before 1930 chooses "poison". Jowett revised himself: "the cure of forgetfulness and of folly" (1871) became "a specific both for the memory and for the wit" (1892).

## The question

In the myth, Theuth offers writing to King Thamus as a φάρμακον "of memory and wisdom" (μνήμης τε γὰρ καὶ σοφίας φάρμακον, 274e). Thamus replies that Theuth has found a pharmakon not of μνήμη (memory) but of ὑπόμνησις (reminding), and that writing will give students the seeming of wisdom (σοφίας δόξαν) and make them δοξόσοφοι, wise-seeming, instead of wise (275a–b). *Pharmakon* means remedy, drug, and poison at once, so every translator must choose; Jacques Derrida's "La pharmacie de Platon" (*Tel Quel* 32 and 33, 1968; reprinted in *La Dissémination*, Paris: Seuil, 1972; English, "Plato's Pharmacy", in *Dissemination*, trans. Barbara Johnson, Chicago: University of Chicago Press, 1981) made that choice famous. The passage is about writing as a technology that stands in for memory, which is why it belongs in a course about AI. **How have translators rendered these words, across languages and centuries, and what does each choice do to Plato's argument?**

## The chain

Each step says what kind of thing it is (a prompt, a script, or a data file) and whether it is deterministic code, model judgment, or research that was verified.

1. **`operations/01-inventory-prompt.md` → `operations/01-inventory.csv`** (prompt + data, verified research): the brief given to three Claude Code research agents with web search, one per group of languages. Their reports were reconciled by hand into the CSV: translator, title, imprint, year of first publication, the edition actually digitized, copyright and digital license, a status (*verified*, *partly verified*, *unverified*), the reason a row is not in the pipeline, and the catalogue or scholarly URLs each fact rests on. For in-copyright translations the CSV holds metadata and, only where a source confirms it, the one word used for pharmakon.
2. **`operations/02-fetch-texts.mjs`** (script, deterministic): downloads every text in `inputs/texts/manifest.json` into `inputs/texts/`, byte for byte. Originals are never edited.
3. **`operations/03-locate-passage.mjs` → `operations/03-passages.json`** (script: code narrows, a model points, code cuts): code converts each original to plain text (`lib/text.mjs`: markup and editorial notes removed, entities decoded, line-end hyphens rejoined) and finds where the myth's names cluster (Naucratis, Theuth, Thamus, in any spelling or alphabet); a model (Gemini 3.8 Flash) reads that stretch beside the Greek and returns the translator's first and last words; code searches for those exact words and cuts the passage. If they aren't in the text the row fails loudly, so a stored passage is always the translator's text, never a model's paraphrase. The Greek is cut by fixed anchors with no model.
4. **`operations/04-extract-prompt.md` → `operations/04-extract-renderings.mjs` → `operations/04-renderings.json`** (prompt + script, model judgment with a strict JSON schema): for each translation, Claude Sonnet 5.5 fills eight slots (φάρμακον at 274e and 275a; μνήμης at 274e and 275a; σοφίας at 274e; ὑπόμνησις; σοφίας δόξαν; δοξόσοφοι), each with the translator's words copied exactly, a literal gloss, and a note; the two pharmakon slots also get a category from a fixed list (remedy/medicine, drug, poison, elixir/potion, recipe/prescription, specific, means/aid, kept the Greek word, other, not translated). **The categories are an interpretive scheme made for this page, not facts about the words.** The model also writes two or three sentences on what the choices do to the argument. The prompt the script sends is read from the `.md` file, so the prompt you read is the one that ran.
5. **`operations/05-check-renderings.mjs` → `operations/05-check.json`** (script, deterministic guardrail): confirms that every extracted rendering occurs verbatim in its passage (exact; or "loose", ignoring case, spacing and curly versus straight apostrophes; or NOT FOUND), and records whether the same word is used for both occurrences of pharmakon. **`operations/05b-spot-check.json`** (verified reading): the building session read the 274e and 275a sentences of every version against the Greek, checked that every pharmakon slot holds the right word, and recorded the misfiled slots it found (Cousin and Jowett 1871 at 274e) and the one NOT FOUND (a footnote marker splits Karpov's phrase). The check proves the words are the translator's; only the spot-check asks whether they render the Greek word they are filed under.
6. **`operations/06-backtranslate.mjs` → `operations/06-backtranslations.json`** (script, model judgment): Claude Sonnet 5.5 puts every non-English passage, and the Greek, into literal English, so readers without Latin or Russian can compare. English versions are not back-translated.
7. **`operations/07-chain.mjs` → `operations/07-chain.json`** (script, model judgment): translate → critique → revise. Gemini 3.8 Flash translates the Greek into English (it chose "elixir", like Fowler); Claude Sonnet 5.5 critiques it as a classicist, eight numbered points; Gemini revises (it switched to "remedy", accepted most points, and says which). Set this beside the historical versions: it is one more translation to judge, not an answer.
8. **`operations/08-page-template.html` + `operations/08-build-page.mjs` → `outputs/index.html`** (script, deterministic): merges the inventory and every step's data into the template inline, so the page opens from the file system without a server.

`operations/lib/openrouter.mjs` is the shared model client (copied from the Frankenstein translations project (translation/02-frankenstein-translations) and tightened): it caches every response in `operations/cache/` (so reruns are free unless a prompt changes), refuses replies that were cut off or empty, and logs tokens and cost for every live call to `operations/costs.jsonl`. The cache (under 0.5 MB) is committed; it also holds responses from earlier prompt versions made while building.

## How to rerun it

From the repository root, with `OPENROUTER_API_KEY` in the root `.env`:

```
node 01-use-cases/translation/03-phaedrus-pharmakon/operations/02-fetch-texts.mjs
node --env-file=.env 01-use-cases/translation/03-phaedrus-pharmakon/operations/03-locate-passage.mjs
node --env-file=.env 01-use-cases/translation/03-phaedrus-pharmakon/operations/04-extract-renderings.mjs
node 01-use-cases/translation/03-phaedrus-pharmakon/operations/05-check-renderings.mjs
node --env-file=.env 01-use-cases/translation/03-phaedrus-pharmakon/operations/06-backtranslate.mjs
node --env-file=.env 01-use-cases/translation/03-phaedrus-pharmakon/operations/07-chain.mjs
node 01-use-cases/translation/03-phaedrus-pharmakon/operations/08-build-page.mjs
```

Step 1 is research, not a script: to redo it, give `01-inventory-prompt.md` to Claude Code, then edit the CSV by hand. To add a translation, add it to `inputs/texts/manifest.json` (public domain only: `id`, `language`, `translator`, `year`, `file`, `format` of `txt`, `html` or `tei`, `fetch_url`, and `encoding` if it isn't UTF-8), add a row with the same `id` to the CSV, and rerun from step 2. `03-locate-passage.mjs <id>` reruns one text. Step 5b is a reading, not a script: update it by hand when you add a version.

## What a scholar must check

- **Which edition the words come from.** Almost every digital text is a later edition, reprint, or modernized transcription of the translation the timeline dates. Schleiermacher is dated 1804 but the text is his 1817 revision with modern spelling; Ficino is dated 1484 but the text is Bekker's 1816 reprint (not compared with the incunable); Karpov's 1863 text is in modernized Russian spelling on Wikisource; Witwicki's is a 2005 edition with modern spelling; Georgii's comes from a 1940 reprint; Wright's from a 1900 reprint. The CSV's `edition_used` column says which, and Jowett shows why it matters: his 1871 and 1892 editions render pharmakon differently.
- **OCR.** Taylor (1792), Cary, Wright and Jowett 1871 come from Internet Archive OCR. Taylor's passage includes his long Neoplatonic footnotes, which the OCR runs into the text, and keeps the long s (ſ). Check any word against the page image before quoting it.
- **Dates and attributions marked *partly verified* or *unverified*.** Cousin's tome 6 is dated 1831 by Wikisource only (its index page says 1823); Gounaris's Modern Greek translation has no date we could find, so it is left off the timeline; Wright's 1848 imprint was seen only in catalogue search results; Lehmuskoski's and Dalbono's imprints come from transcribed title pages.
- **Copyright of the Polish text.** Witwicki's *Fajdros* was published in 1918, but the Wolne Lektury text is from a 2005 edition. If Witwicki revised the translation after 1930, that text may still be in copyright in the US. Compare it with the 1918 scan on Polona before copying this folder into a public repo, or drop the row.
- **The categories, glosses, back-translations, and "what these choices do" notes are a model's readings.** They can smooth over what is strange (Georgii's reversal of memory and reminding is easy to miss) and two runs would differ somewhat. *Mittel* and *средство* sit between "means" and "remedy"; "specific" got its own category because Jowett's word fits no other. Use the categories to see a pattern, then read the words.
- **Slot filing.** A ✓ means the words are in the passage, not that they render the Greek word they are filed under. The spot-check found two misfiled μνήμης slots at 274e (Cousin, Jowett 1871), both in versions that restructure Theuth's sentence. Read the spot-check notes in section 4 of the page.
- **"Same word for both pharmaka"** compares the first four letters of the slot renderings, so it misses a switch inside a sentence (Witwicki's *lekarstwo* → *środek*, Jowett 1892's "specific" plus "aid").
- **In-copyright translations** appear only as one word, and only Robin's *remède* (1933) was confirmed. The words often attributed to Hackforth ("recipe") and Nehamas & Woodruff ("potion") could not be confirmed from a reliable source and are left blank.

## Models and cost

| step | model (OpenRouter ID, checked against the live model list on 2026-11-03) | what it does |
| --- | --- | --- |
| 3 | `google/gemini-3.8-flash` (low reasoning effort) | point to the passage's first and last words |
| 4 | `anthropic/claude-sonnet-5.5` | extract renderings, glosses, categories (JSON schema) |
| 6 | `anthropic/claude-sonnet-5.5` | literal back-translation |
| 7 | `google/gemini-3.8-flash` translates and revises; `anthropic/claude-sonnet-5.5` critiques | the translation chain |

**Actual cost of the model calls: $1.10** for 71 live calls (Claude Sonnet 5.5 $1.01, Gemini 3.8 Flash $0.09), including reruns while the prompts were being tightened and one critique cut off at the token limit and rerun; every call is in `operations/costs.jsonl`. The research in step 1 was done by three Claude Code agents with web search (about 475,000 tokens between them) under the session's Claude plan, so it doesn't appear in that log. Reruns cost nothing while `operations/cache/` is in place.

## Inputs: sources and copyright

All texts are in `inputs/texts/`, listed in `inputs/texts/manifest.json`, named text first and catalogue ID after. Bibliographic sources for every row are in `operations/01-inventory.csv`.

| input file | what it is | where it's from | copyright (US) and digital license |
| --- | --- | --- | --- |
| `phaedrus-grc-burnet-perseus-grc2.xml` | Greek, ed. John Burnet, *Platonis Opera* II (Oxford, 1901; 1910 printing) | Perseus Digital Library, canonical-greekLit, https://github.com/PerseusDL/canonical-greekLit | public domain text; Perseus TEI file CC BY-SA 4.0 (attribution: Perseus Digital Library, Tufts University) |
| `phaedrus-la-ficino-bekker1816-lawikisource.html` | Latin, Marsilio Ficino (first printed Florence, 1484–85), as reprinted by Bekker (Berlin, 1816) | Latin Wikisource, https://la.wikisource.org/wiki/Phaedrus_(ed._Bekker) | public domain; Wikisource CC BY-SA 4.0 |
| `phaedrus-en-1792-taylor-ia-bim_eighteenth-century.txt` | English, Thomas Taylor, *The Phædrus of Plato* (London, 1792) | Internet Archive OCR, https://archive.org/details/bim_eighteenth-century_the-phdrus-of-plato-a-_plato_1792 | public domain |
| `phaedrus-de-schleiermacher-projektgutenbergde-ch8.html` | German, Friedrich Schleiermacher (Berlin, 1804; text of the 2nd ed., 1817–26) | Projekt Gutenberg-DE, https://projekt-gutenberg.org/authors/friedrich-schleiermacher/books/friedrich-schleiermacher-platons-werke/chapter/8 | public domain; no license stated |
| `phaedrus-fr-1831-cousin-frwikisource.html` | French, Victor Cousin, *Œuvres de Platon* VI (Paris, 1831 per Wikisource) | French Wikisource, https://fr.wikisource.org/wiki/Phèdre_(Platon,_trad._Cousin) | public domain; CC BY-SA |
| `phaedrus-en-1848-cary-ia-theworksofplato01platiala.txt` | English, Henry Cary, *The Works of Plato* I (London: Bohn, 1848) | Internet Archive OCR, https://archive.org/details/theworksofplato01platiala | public domain |
| `phaedrus-en-wright-1900reprint-ia-110821.txt` | English, J. Wright (London: Parker, 1848), Golden Treasury reprint of 1900 | Internet Archive OCR, https://archive.org/details/india.history.resource.110821 | public domain |
| `phaedrus-de-1853-georgii-zeno-20009262660.html` | German, Ludwig von Georgii (Stuttgart: Metzler, 1853), from a 1940 reprint | zeno.org, http://www.zeno.org/nid/20009262660 | public domain; zeno.org: gemeinfrei |
| `phaedrus-ru-1863-karpov-ruwikisource.html` | Russian, Vasily Karpov, *Сочинения Платона* IV (St Petersburg, 1863), modernized spelling | Russian Wikisource, https://ru.wikisource.org/wiki/Федр_(Платон;_Карпов) | public domain; CC BY-SA |
| `phaedrus-it-1869-dalbono-itwikisource.html` | Italian, Cesare Dalbono, *Fedro di Platone* (Naples, 1869) | Italian Wikisource, https://it.wikisource.org/wiki/Fedro_(Dalbono,_1869)/Fedro | public domain; CC BY-SA 3.0 / GFDL |
| `phaedrus-en-1871-jowett-ia-cu31924092280043.txt` | English, Benjamin Jowett, *The Dialogues of Plato*, 1st ed., I (Oxford, 1871) | Internet Archive OCR, https://archive.org/details/cu31924092280043 | public domain |
| `phaedrus-es-1871-azcarate-filosofia-azc02261.html` | Spanish, Patricio de Azcárate, *Obras completas de Platón* II (Madrid, 1871) | Proyecto Filosofía en español, https://www.filosofia.org/cla/pla/azc02261.htm | public domain text; the site claims © 2005 for its transcription and grants no license (a faithful transcription of a public-domain text is generally not copyrightable in the US, but note it) |
| `phaedrus-en-1892-jowett-pg1636.txt` | English, Jowett, 3rd ed. (Oxford, 1892) | Project Gutenberg #1636, https://www.gutenberg.org/ebooks/1636 | public domain; Project Gutenberg License |
| `phaedrus-en-1914-fowler-perseus-eng2.xml` | English, Harold N. Fowler, Loeb Classical Library 36 (1914) | Perseus Digital Library, canonical-greekLit | public domain text; Perseus TEI file CC BY-SA 4.0 |
| `phaedrus-pl-witwicki-wolnelektury.txt` | Polish, Władysław Witwicki, *Platona Fajdros* (Lwów, 1918), text of a 2005 edition | Wolne Lektury, https://wolnelektury.pl/katalog/lektura/platon-fajdros/ | **check before publishing** (see above); Wolne Lektury: public domain, notes under Licencja Wolnej Sztuki 1.3 |
| `phaedrus-fi-1920-lehmuskoski-pg59435.txt` | Finnish, Niilo Lehmuskoski, *Phaidros* (Porvoo: WSOY, 1920) | Project Gutenberg #59435, https://www.gutenberg.org/ebooks/59435 | public domain; Project Gutenberg License |
| `phaedrus-fr-1922-meunier-frwikisource.html` | French, Mario Meunier, *Phèdre ou la beauté des âmes* (Paris: Payot, 1922) | French Wikisource, https://fr.wikisource.org/wiki/Phèdre_(Platon,_trad._Meunier) | public domain in the US (published 1922); not in the EU until 2031; CC BY-SA |
| `phaedrus-el-gounaris-pg35604.txt` | Modern Greek, K. S. Gounaris (Athens: Fexis, n.d.) | Project Gutenberg #35604, https://www.gutenberg.org/ebooks/35604 | date unconfirmed; distributed by Project Gutenberg as US public domain |

The CC BY-SA files (Perseus, Wikisource) require attribution and share-alike if redistributed; the attributions above and in the CSV are meant to satisfy that in the public repo.

**Leads not followed:** in the CSV as metadata only, with the reason, are Zhebelev's Russian (1922, PDF with noisy OCR), Diesendruck's Hebrew (1923, page images only), Acri's Italian (*medicina*, first date unconfirmed, e-text is a zip of a 1988 edition), and the 1902 Bocca Italian volume (translator uncertain, poor OCR). Noted here only: Chambry's French (no transcription), Taylor's 1804 reprint (same wording as 1792), and the Didot Greek-Latin volumes (no OCR). No pre-1930 Portuguese Phaedrus was found online.
