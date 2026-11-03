---
title: "Seminar paper: books, notebook, paper"
description: An eleven-step pipeline for writing a seminar paper with AI in ENGLISH 298AI, and one complete run of it on the Phaedrus and Shanahan's role-play paper.
author: claude
created: 2026-11-03
---

# Seminar paper: books → notebook → paper

The inputs → operations → outputs model in its oldest form.

| Folder | The old name | What is here |
|---|---|---|
| [`books/`](books/) | Inputs | A manifest of the course readings and AI papers in [`context/`](../../../context/), with editions. |
| [`notebook/`](notebook/) | Operations | Eleven numbered steps, `W00` to `W10`. `notebook/work/` holds one complete run. |
| [`paper/`](paper/) | Outputs | The paper that run produced: [`final.md`](paper/final.md), [`final.html`](paper/final.html). |

## The run

**"One Unvarying Answer: The *Phaedrus* and the Speaker Who Is Not There."**
About 3,000 words. Socrates says the written word, questioned, "always gives
one unvarying answer"; Shanahan says a dialogue agent, asked to regenerate,
names a different object every time. The paper reads 275d–e as three charges,
shows the living word of 276a answers all three, runs the agent past each,
and concludes that the agent inverts Socrates's objection rather than
refuting it, for the cause he names: no one is behind the words.

What the model did: read Grice, Shanahan et al., and the whole *Phaedrus*
(with Jowett's introduction); took notes; proposed eight angles; built the
quote bank; outlined, drafted, judged, revised. What the writer did: chose the
angle. Every step is a file in `notebook/work/`, so the whole thing can be
read backwards from the paper to the passages.

## Run it on your own question

Read [`notebook/README.md`](notebook/README.md), then the steps in order.
Three of them are yours by design: your seminar notes (`W01b`), the choice of
thesis (`W03`), and your feedback on the draft (`W09`). This run skipped the
first and third; yours need not.

## Rules the folder keeps

- Texts are read whole. A note that says "read in full" means every line.
- No quotation enters the draft that is not in the bank with its location.
- The last step writes a short note on method from the files, so a reader
  can see what ran. The course asks for that; it is also just useful.

The shape is adapted from a pipeline built for a Government seminar; the
prompts are rewritten for literary and philosophical argument about texts.
