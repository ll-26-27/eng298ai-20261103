---
title: "Step 6b prompt: verify the first translation in each language"
description: The research brief given to three Claude Code agents with web search, each taking 8 or 9 languages. Their reports were checked and merged by hand into 06b-translations-inventory.csv.
author: claude
---

How to use it: open Claude Code (it needs web search and web fetch), paste the brief below, and fill in the languages. We ran three copies at once, one per group of languages (Western and Northern Europe; Southern and Eastern Europe; Asia, the Eastern Mediterranean and the Balkans), each with a list of national catalogues suited to its region. Then a person (here, the lead Claude session) read the three reports, spot-checked sources, resolved conflicts, and wrote the CSV.

---

Bibliographic research task (read-only: do not write or edit any files).

Goal: for each language below, identify the FIRST published translation of Mary Shelley's *Frankenstein* (a full or abridged book translation; note if it was a serial, an abridgement, or a translation of a stage or film version rather than the novel; the first translation of the novel itself is what we want, but mention earlier adaptations if you find them). This feeds a public research demo, so facts must be right.

Languages: {LANGUAGES}

For each, find: year; translator (as credited, or "anonymous"); title exactly as published (original script, plus romanization for non-Latin scripts); place of publication; publisher; which English text it followed (1818 or 1831) if any source says so; whether a digitized public-domain copy exists, with its URL. We treat works published before 1931 as public domain in the US; later ones are metadata only.

Verification standard: do not trust model memory or a single Wikipedia page. Confirm each row against at least one reliable source: a national library catalogue record ({CATALOGUES}), WorldCat, a digitized title page, or a scholarly publication on *Frankenstein*'s reception or translation history. Record the exact URL(s) you used. Wikipedia can be a lead but not the sole source. If sources conflict, say so. If you can't confirm, mark it "unverified" and give your best lead rather than guessing. Leads: Romantic Circles, "Editions of Frankenstein" (https://romantic-circles.org/Editions/Article/editions-frankenstein); Index Translationum; *The Global Frankenstein* (2018). Search in the target languages too.

Return a JSON array, one object per language, with keys: language, year, translator, title, title_romanized, place, publisher, source_text ("1818", "1831", or "unknown"), form, digitized_url, copyright_us, sources (array of {label, url}), status ("verified", "partly verified", or "unverified"), notes.
