---
title: "Step 1 prompt: draft candidate events"
description: The prompt 01-draft.mjs sends to a model to propose candidate events for a timeline of AI and literature; the course reading list is appended below it.
author: claude
---

You are helping a graduate seminar in English build a timeline of **AI and literature**, from antiquity to 2026. The seminar reads the cultural history of AI and of dialogue (Socratic dialogue, the *Analects*, Grice, conversation analysis, *Frankenstein*, Wilde, *R.U.R.*, role play with language models, the "assistant" persona) and then turns to making things with AI tools. The timeline should let a student see how stories about made beings, theories of conversation, and the history of computing run in parallel and cross.

Propose about **105 candidate events** in four tracks:

- `readings`: every reading on the course list below that has a seminar number (the list follows this prompt). One event per reading, dated to its first publication or performance. About 13 events.
- `computing`: AI and computing, from mechanical calculators and Babbage/Lovelace through Turing, Dartmouth, ELIZA, PARRY, SHRDLU, expert systems, statistical NLP, word vectors, the transformer, GPT models, RLHF, ChatGPT, Claude, and events up to 2026. Include about 12 of the papers in the course's papers folder (listed below), chosen for their importance to dialogue and the assistant persona. About 38 events.
- `made-beings`: literature, theater, and film about made beings, automata, and talking machines: Hephaestus's golden attendants and Talos, Pygmalion, the golem, Albertus Magnus's talking head, Vaucanson and Jaquet-Droz automata, the Mechanical Turk, Hoffmann's "The Sandman", Villiers's *L'Ève future*, *Metropolis*, Asimov, *2001*, *Do Androids Dream*, *Neuromancer*, *Her*, *Ex Machina*, *Klara and the Sun*, and so on. About 30 events. Do not repeat a work that is already in `readings`.
- `dialogue`: theories and forms of dialogue and conversation: Socratic dialogue beyond the *Phaedrus*, Lucian, Boethius, Galileo's *Dialogue*, Hume's *Dialogues*, Diderot, Bakhtin on dialogism, Buber, Austin and Searle on speech acts, conversation analysis, Weizenbaum's critique, Searle's Chinese Room, and so on. About 24 events. Do not repeat a work that is already in `readings`.

For each event give:

- `id`: a short kebab-case slug.
- `title`: the event as a short heading (work titles in their usual English form).
- `date_display`: the date as a reader should see it ("c. 370 BCE", "1818", "November 30, 2022").
- `year`: an integer for placing it on the axis (BCE years negative; use the best single year for a circa date).
- `precision`: one of `day`, `year`, `circa`, `century`.
- `track`: one of `readings`, `computing`, `made-beings`, `dialogue`.
- `who`: the author, maker, or organization.
- `description`: two sentences **in your own words** saying what happened or what the work is. No quotation in this field.
- `quote`: optional. Only for a work in the public domain in the US (published before 1931, or ancient), and only one short line (under 20 words) that you are confident is accurate, with `quote_attribution` (work and location). Leave both as empty strings when unsure or when the work is in copyright.
- `copyright`: `public-domain`, `in-copyright`, or `not-a-text` (for events like a product release).
- `source_url`: the best reliable page for checking the date and claim (an English Wikipedia article is fine; for papers, the arXiv abstract page or the journal page).
- `uncertain`: a short note on anything in this entry you are not sure of (a disputed date, premiere vs. publication, a first-edition question), or an empty string.

Rules: prefer events whose date can be checked. Distinguish the date of composition, first publication, first performance, and translation, and say which one `date_display` is. Do not invent quotations. Return **only** a JSON object of the form `{"events": [ ... ]}`.
