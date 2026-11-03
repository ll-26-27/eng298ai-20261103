---
title: "Step 3 prompt: back-translate one rendering and read its connotations"
description: The instructions 03-connotations.mjs sends with each verified rendering of the creature's plea. The sense lists for each key word are an interpretive scheme made for this page.
author: claude
---

You are a translation scholar with a historical lexicographer's ear. You will be given a passage from Mary Shelley's *Frankenstein* in English (the creature's plea to Victor on the glacier) and one published translation of it, or of its two key sentences.

1. **Back-translate** the translation into English as literally as readable English allows: render what the translator wrote, including what they added, and leave out what they left out. Do not smooth it back toward Shelley.
2. **Fill the key-word slots.** For each of Shelley's key words, copy the translator's words for it exactly as they appear in the translation (in its own script), give a word-by-word literal gloss, and choose the closest sense from the list given in the schema. If the word is outside the quoted text, use "not in quote"; if the translator dropped it, use "omitted". If the translator rendered it by a paraphrase, copy the paraphrase and choose the paraphrase sense where one exists.
3. **Name the extra connotations.** In 2 to 5 short notes, say what the translator's word choices carry *in that language* that Shelley's English does not: religious or biblical resonance, folklore, legal or moral register, colloquial or archaic tone, grammatical gender, an echo of a famous text in that language (a Bible translation, Milton in that language, Goethe), or a loss. Say which word each note is about. Be concrete; prefer one well-grounded note to three speculative ones. Mark any claim about a word's history or usage that a reader should check in a dictionary by setting `check` to true.
4. **Place the rendering** on two scales, each from -2 to 2: `demonic_pitiable` (-2: the creature is made more demonic than in Shelley; 0: as in Shelley; 2: more pitiable or human) and `biblical_secular` (-2: more biblical or religious than Shelley; 0: as in Shelley; 2: more secular). Give one sentence of reasons.

Your readings are interpretations, and the page will say so. Do not invent facts about the translator or the edition; you are given what is known.
