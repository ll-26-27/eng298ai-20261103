---
title: The categories (schema and prompt for step 04)
description: The fixed list of categories and fields every change is sorted into, the instructions the model receives, and why these categories and not others. Step 04 reads this file directly.
author: claude
---

# The categories

This file is an operation, not documentation: `04-categorize.mjs` reads the **Prompt** section and the **Schema** block below and sends them to the model unchanged. Edit the categories here and rerun step 04 (delete `04-cache/` first) to see how a different reading of the revisions redistributes them.

## Why these categories

The diff in step 02 found every change with certainty. Deciding *what kind* of change each one is, is interpretation, and the list of kinds is the first interpretive decision. These categories come from two places: the plainest description of an edit (spelling, wording, adding, cutting) and the questions scholars have actually asked of the 1831 revision (Elizabeth's origins and other changes to character; Victor's increasing sense of destiny; heavier moral and religious language; the new Introduction).

What the list leaves out, on purpose or by necessity:

- **Tone and rhythm** fold into *wording*; a reader interested in Shelley's prose style would want to split it (diction, syntax, register).
- **Gender, class, politics, and science** are not their own categories. A change that softens a political sentence or updates the science lands in *wording* or *characterization*, and a project about those questions would need its own list.
- **One label per change.** A long rewritten passage does several things at once. The model gives a primary category and up to two secondary ones, and the page counts only the primary.
- **Significance is a judgment about importance to interpretation**, made one change at a time, without the whole novel in view. Treat it as a sorting aid, not a finding.

## Prompt

You are helping a literary scholar sort the revisions Mary Shelley made to *Frankenstein* between the first edition (1818) and the revised edition (1831).

You will receive ONE change found by a computer diff: the 1818 text, the 1831 text, a marked-up diff in which `[-removed-]` and `{+added+}` show exactly what changed, and a sentence of unchanged context on either side. The diff is complete and exact; do not second-guess what changed. Your job is only to say what *kind* of change it is and how much it matters for interpretation.

Choose `category` from this list (the single best fit), and up to two `secondary` categories if the change clearly does more than one thing:

- `spelling`: orthography only (sympathize/sympathise, Shakespeare/Shakspeare, ligatures, archaic forms), no change in wording.
- `wording`: rephrasing or word choice that keeps the meaning (style, diction, syntax, grammar).
- `expansion`: adds description, elaboration, or emphasis without changing events or a character's nature.
- `cut`: removes material without replacing it with something of a different kind.
- `plot`: changes what happens, the facts of the story, or the sequence of events.
- `characterization`: changes who a character is: their origins, relationships, motives, or how the narrator presents them.
- `moral-religious`: adds, removes, or changes moral judgment, religious language, providence, guilt, or virtue.
- `fate-agency`: changes how far events are presented as destined, fated, or beyond the characters' control, versus chosen.
- `framing`: the frame and paratext: the author's introduction, preface, Walton's letters as letters (dates, signatures, addresses), chapter divisions.
- `other`: none of the above; say what it is in the rationale.

`significance` (1–5): 1 = no interpretive consequence (spelling, a comma-level word swap); 2 = minor stylistic; 3 = noticeable change of emphasis; 4 = changes how a character, theme, or event reads; 5 = a major revision that scholars would discuss.

`rationale`: at most 40 words, specific to this change. Quote or name the words that justify the category.

`confidence`: `high` if the category is clear, `medium` if a second category is nearly as good, `low` if you are guessing.

## Schema

```json
{
  "type": "object",
  "properties": {
    "category": { "type": "string", "enum": ["spelling", "wording", "expansion", "cut", "plot", "characterization", "moral-religious", "fate-agency", "framing", "other"] },
    "secondary": { "type": "array", "items": { "type": "string", "enum": ["spelling", "wording", "expansion", "cut", "plot", "characterization", "moral-religious", "fate-agency", "framing", "other"] }, "maxItems": 2 },
    "significance": { "type": "integer", "minimum": 1, "maximum": 5 },
    "rationale": { "type": "string" },
    "confidence": { "type": "string", "enum": ["low", "medium", "high"] }
  },
  "required": ["category", "secondary", "significance", "rationale", "confidence"],
  "additionalProperties": false
}
```

## What is not sent to the model

Changes that the diff marks as `punctuation` (the 1818 and 1831 sentences contain exactly the same letters once punctuation, capitalization and hyphens are removed) skip the model. Step 04 assigns them the category `punctuation` by rule, with significance 1, and says so on the page.
