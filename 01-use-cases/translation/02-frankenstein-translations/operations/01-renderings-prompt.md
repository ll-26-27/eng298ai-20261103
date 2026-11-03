---
title: "Step 1 prompt: find published renderings of the creature's plea"
description: The research brief given to three Claude Code agents with web search, one per group of languages. Their reports were checked and merged by the lead session into 01-renderings.csv.
author: claude
---

How to use it: open Claude Code (it needs web search and web fetch), paste the brief below, and fill in the languages and any leads. We ran three copies at once: Romance languages; Germanic and Slavic languages and Hungarian; and Asian and other languages. The lead session then read the reports, dropped anything without a source it could point to, and wrote the CSV. Step 2 re-checks every quotation by script.

---

Research task (read-only: do not edit repository files).

Goal: find how published translations of Mary Shelley's *Frankenstein* render this passage (the creature speaking to Victor on the Mer de Glace; 1818 vol. II ch. II, 1831 ch. 10):

"Remember, that I am thy creature: I ought to be thy Adam; but I am rather the fallen angel, whom thou drivest from joy for no misdeed. Every where I see bliss, from which I alone am irrevocably excluded. I was benevolent and good; misery made me a fiend. Make me happy, and I shall again be virtuous."

The two key sentences are "I ought to be thy Adam; but I am rather the fallen angel, whom thou drivest from joy for no misdeed." and "I was benevolent and good; misery made me a fiend."

Your languages: {LANGUAGES}. Aim for {N} renderings across these languages and across periods (early public-domain, mid-century, modern); several translations of the same language are welcome. Leads: {LEADS}.

Where to look: full texts you can fetch (Wikisource, Internet Archive full text, Gallica, national e-libraries, Project Gutenberg, Google Books previews and snippets, publishers' sample pages, scholarly articles that quote the line in translation). A translation still in copyright is in scope for this one passage only: quote no more than these four sentences.

Verification rule: every quotation must be copied from a page you actually fetched or a snippet you actually saw, character for character, with its URL. Never supply a translation from memory or reconstruct one. If a source shows only part of the passage, give only that part and say so. If you can't find a source, leave it out.

Report, as a JSON array, one object per rendering: language; translator; year_first_published; edition_quoted (publisher, year, page if known); source_url; source_type; quote_full (the four sentences, exactly, or null); quote_key (at least the two key sentences, exactly); copyright_us ("public domain (pre-1931)" or "in copyright"); how_verified; notes. Then list leads you couldn't confirm.
