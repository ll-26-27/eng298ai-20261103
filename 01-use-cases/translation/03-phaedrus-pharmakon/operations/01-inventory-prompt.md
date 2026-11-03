---
title: "Step 1 prompt: the inventory research brief"
description: The brief given to three Claude Code research agents with web search, one per group of languages, to find and verify public-domain digitized translations of Phaedrus 274c–275b.
author: claude
---

# Step 1 prompt: the inventory research brief

Step 1 is research, not a script. The building session gave this brief to three Claude Code agents with web search, in parallel: **(A)** the Greek source text, Latin, and English; **(B)** German, French, Italian, Spanish, Portuguese; **(C)** Russian, Polish and any other languages, plus in-copyright translations (metadata only) and the publication details of Derrida's "La pharmacie de Platon". Their reports were read, reconciled, and entered by hand into `01-inventory.csv`; every passage they quoted was then fetched again by step 2 and cut by step 3, so no text in this folder comes from an agent's report.

## The brief (shared part)

> A graduate seminar use case compares how translators render Plato's *Phaedrus* 274c–275b (the myth of Theuth and Thamus: writing as a φάρμακον "of memory and wisdom" at 274e; Thamus's reply at 275a that it is a pharmakon not of μνήμη (memory) but of ὑπόμνησις (reminding), making people δοξόσοφοι, wise-seeming). I need public-domain (US: published 1930 or earlier), digitized translations of this passage, with verified bibliographic facts.
>
> For each version, report: language; translator; title; place, publisher, year of first publication of that translation; edition actually digitized (year) if different; catalogue/bibliographic verification URL(s) (WorldCat, national library catalogue, HathiTrust record, Internet Archive item, or a reliable scholarly source); the direct machine-readable text URL that contains the passage (plain text or HTML preferred; say if only page images); whether Stephanus numbers are present; the first ~10 words of the passage at 274c and the word(s) it uses for pharmakon at 274e and 275a, quoted from what you actually read; the digital text's license if the site states one; status: verified / partly verified / unverified, and anything uncertain. Never guess a fact; mark it unconfirmed.
>
> Do not write any files in the repository. Do not post anything anywhere. Return a compact structured report.

## The group-specific parts

- **A:** find the Greek (Burnet's OCT as digitized by Perseus, First1KGreek or Wikisource) and the exact license of the digital file; Ficino's Latin in any digitized edition with machine-readable text; and the English of Sydenham (or Taylor), Thomas Taylor (1792, 1804), Henry Cary in Bohn's Classical Library (1848), Jowett (1871 and 1892; which one Project Gutenberg #1636 is), Fowler's Loeb (1914), and any other pre-1930 English version.
- **B:** Schleiermacher and other pre-1930 German; Victor Cousin, Émile Chambry, Mario Meunier and earlier French; Italian (Bonghi, Dardi Bembo, Acri); Spanish (Patricio de Azcárate); any pre-1930 Portuguese.
- **C:** Russian (Karpov; Solovyov if he translated the Phaedrus); Polish (Witwicki); anything else with a machine-readable text. Then in-copyright translations (Hackforth 1952, Helmbold & Rabinowitz 1956, Hamilton 1973, Rowe 1986, Nehamas & Woodruff 1995, Waterfield 2002, Robin 1933, Brisson 1989, Egunov): bibliographic data with a catalogue URL and, **only if confirmed from a reliable source**, the single word or two-word phrase used for pharmakon, never more. Then verify the publication details of Derrida's "La pharmacie de Platon".

## What came back, and what was done with it

The agents found about two dozen public-domain candidates; 17 had a fetchable machine-readable text and went into the pipeline. The rest are in the CSV as metadata (with `in_pipeline = no` and the reason) or are listed under "Leads not followed" in this folder's README. The agents' own words were not copied into the CSV; each row's facts were re-stated from the sources it cites, and the rows say where a fact rests on one source only.
