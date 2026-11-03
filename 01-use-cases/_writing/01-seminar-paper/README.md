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

**“Writing and Dialogue Agents: Plato, Shanahan, and Grice.”**
The current paper is a complete rewrite: 5,013 words in continuous prose,
followed by Works Cited and a method note. It makes one claim about how a
conversation preserves a commitment, working through Plato's writing
passage, the twenty-questions example and its footnote, and Grice's examples
of conversational inference.

The original staged run remains in `notebook/work/`. The later revision adds
[copied academic prose and annotations](notebook/academic-prose-models.md), an
[argument audit](paper/academic-prose-audit.md), and reproducible
[Pangram checks](paper/pangram/README.md) of the earlier draft and complete
rewrite. The [revision record](paper/revision-record.md) distinguishes these
stages and their source checks.

## Run it on your own question

Read [`notebook/README.md`](notebook/README.md), then the steps in order.
You can supply seminar notes (`W01b`), select the thesis (`W03`), and give
feedback (`W09`), or delegate the choices and revision. This run used the
writer’s chosen angle and proceeded without seminar notes or draft feedback.

## Rules the folder keeps

- Texts are read whole. A note that says "read in full" means every line.
- No quotation enters the draft that is not in the bank with its location.
- The last step writes a short note on method from the files, so a reader
  can see what ran. The files make the process reproducible.

The shape is adapted from a pipeline built for a Government seminar; the
prompts are rewritten for literary and philosophical argument about texts.
