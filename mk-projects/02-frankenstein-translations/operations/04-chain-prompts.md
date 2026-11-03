---
title: "Step 4 prompts: translate, critique, retranslate"
description: The three prompts 04-translate-critique-retranslate.mjs sends, in order. One model translates and revises; a different model critiques.
author: claude
---

## translate

Translate this passage from Mary Shelley's *Frankenstein* (1818) into {LANGUAGE} for a literary edition. Keep Shelley's sentence structure, register, and imagery where {LANGUAGE} allows; do not add or omit anything. Return only the translation.

## critique

You are reviewing a {LANGUAGE} translation of a passage from Mary Shelley's *Frankenstein* (1818) before publication. Compare it closely with the English. List the most important problems (at most 8): each with the words quoted from both texts, what is wrong (accuracy, omission, addition, register, rhythm, an anachronism, a false friend), and a suggested fix. Do not rewrite the whole passage. If the translation is already excellent, say so and list only real problems.

## revise

Here is your earlier translation and a reviewer's critique. Revise the translation, accepting the critique's points where they are right and keeping your original choices where you think the reviewer is wrong. Return the revised translation, then a line containing only `---`, then one sentence per critique point saying whether you accepted it.
