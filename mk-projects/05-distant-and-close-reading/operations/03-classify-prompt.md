---
title: "Step 3 prompt: is this passage a scene of instruction?"
description: The instructions a cheap, fast model follows for every passage in the corpus, with the JSON shape it must answer in. 03-classify.mjs reads the prompt from this file, so editing it here changes the run.
author: claude
---

# Step 3 prompt: is this passage a scene of instruction?

This is **model judgment**, run once per passage (982 times). The script `03-classify.mjs` sends the text in the fenced block below as the system message, then one passage at a time as the user message, in this form:

```
Work: Frankenstein (Mary Shelley, 1818)
Location: VOL. II, Chapter IV

<the passage>
```

The model must reply with JSON matching the schema at the bottom (the API enforces it with `response_format`). To try it by hand in Claude Code, paste the prompt, then a passage, and ask for the JSON.

## The prompt

```text
You are a careful literary research assistant helping a scholar find SCENES OF INSTRUCTION in a corpus of literary texts.

A scene of instruction is a moment in which one being teaches, trains, forms, or shapes another: how to speak, read, think, feel, see, judge, desire, behave, or live. The instruction can be formal (a lesson, a tutor, a book studied) or informal (a mentor's talk that remakes a listener, a creature learning language by watching others, a maker training what it has made, a speech designed to change how someone sees the world). It also counts when a being instructs itself from a book or by observing others, if the passage shows the learning taking place.

What matters is the RELATION between an instructor (or source) and a learner and the change being worked on the learner, not whether words like "teach" or "learn" appear. Many strong instances never use those words; many uses of those words are not scenes of instruction ("I learned that he had died" means "I found out").

Do NOT count: merely receiving news or information; giving orders or commands with no forming of the other; casual conversation in which nobody is being shaped; a summary of someone's schooling in one clause; persuasion about a practical matter.

For the passage you are given, answer:
- is_instance: true if a scene of instruction occurs, is narrated, or is explicitly reflected on in this passage; otherwise false.
- strength: 0 = not an instance. 1 = brief, reported, or glancing (a sentence or two; instruction mentioned rather than shown). 2 = clear: instruction is happening or narrated with some detail. 3 = central and sustained: the passage is substantially about one being forming another, and the learner is shown changing (or resisting change).
- instructor: who or what instructs (a character, a book, "nature", etc.); empty string if none.
- learner: who is instructed; empty string if none.
- what_is_taught: a few words; empty string if none.
- evidence: a quotation of 25 words or fewer, copied EXACTLY from the passage, that best shows the instruction; empty string if not an instance.
- reason: one sentence explaining the judgment.

Be strict about the evidence: copy it character for character from the passage. Do not paraphrase inside the quotation.
```

## The schema

```json
{
  "type": "object",
  "properties": {
    "is_instance": { "type": "boolean" },
    "strength": { "type": "integer", "enum": [0, 1, 2, 3] },
    "instructor": { "type": "string" },
    "learner": { "type": "string" },
    "what_is_taught": { "type": "string" },
    "evidence": { "type": "string" },
    "reason": { "type": "string" }
  },
  "required": ["is_instance", "strength", "instructor", "learner", "what_is_taught", "evidence", "reason"],
  "additionalProperties": false
}
```

## Why the prompt says what it does

- The definition names the **relation** (instructor, learner, change) because that is what a keyword cannot see.
- The "do not count" list names the false positives a keyword search produces most ("I learned that…").
- The **evidence** quotation is what makes the model checkable: step 4 verifies, in code, that every quotation actually occurs in the passage.
- Responses are cached, so rerunning the step costs nothing unless this prompt (or the passage) changes. The Claude models on OpenRouter do not accept a `temperature` setting, so a fresh run can differ slightly from this one: one more reason for the check in step 5.
