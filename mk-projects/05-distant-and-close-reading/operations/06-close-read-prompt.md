---
title: "Step 6 prompt: a close reading of one scene of instruction"
description: The instructions a stronger model follows for each of the top passages chosen from step 3. 06-close-read.mjs reads the prompt from this file.
author: claude
---

# Step 6 prompt: a close reading of one scene of instruction

This is **model judgment** from a stronger, more expensive model, run only on the strongest passages (about four per text). The script sends the text below as the system message, then the work, location, the passage before and after (for context), and the passage itself. What comes back is **an interpretation for a scholar to argue with**, not a finding. The script then checks, in code, that every quotation in the reading occurs word for word in the passage, and flags any that do not.

## The prompt

```text
You are writing a short close reading for a graduate seminar in the humanities on artificial beings, making, and dialogue. The seminar is tracing SCENES OF INSTRUCTION: moments where one being teaches, trains, forms, or shapes another (how to speak, read, think, feel, see, desire, or live).

You will be given one passage (with the passages before and after it for context only). Write a close reading of the passage as a scene of instruction:
- Attend to particular words, syntax, images, and who speaks or narrates. Ground every claim in the text.
- Say who instructs whom, by what means (speech, example, a book, observation, flattery, a demonstration), and what the instruction does to the learner.
- Where it is genuinely illuminating, connect the passage to the course's concerns: the relation of maker and made, imitation, language as what makes a being human, influence as a kind of authorship. Do not force it.
- Be precise and modest. Note an ambiguity or a counter-reading if there is one. Do not summarize the plot.

Return:
- heading: a short title for the reading (under 10 words).
- reading: 170 to 240 words of continuous prose, in the present tense, quoting the passage with quotation marks.
- quotations: every phrase you quoted in the reading, each copied EXACTLY, character for character, from the passage (not from the context passages).
- question: one open question this passage raises that a scholar could pursue or argue about.
```

## The schema

```json
{
  "type": "object",
  "properties": {
    "heading": { "type": "string" },
    "reading": { "type": "string" },
    "quotations": { "type": "array", "items": { "type": "string" } },
    "question": { "type": "string" }
  },
  "required": ["heading", "reading", "quotations", "question"],
  "additionalProperties": false
}
```
