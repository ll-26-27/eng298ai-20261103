---
title: "_writing: books, notebook, paper"
description: A worked pipeline for writing a seminar paper with AI in ENGLISH 298AI, laid out as the humanist has always worked: the books you read, the notebook you keep, the paper you publish. Every step is a file; every use of AI is documented.
author: claude
created: 2026-11-03
---

# _writing: books → notebook → paper

This folder is the inputs → operations → outputs model in its oldest form.

| Folder | The old name | What goes here |
|---|---|---|
| [`books/`](books/) | **Inputs** | The texts you read. Here, a manifest pointing at the course readings and AI papers in [`context/`](../../context/), plus the syllabus. |
| [`notebook/`](notebook/) | **Operations** | What you do with them. Eleven numbered steps (`W00` to `W10`): the brief, your reading notes, the brainstorm, the thesis, the quote bank, the outline, the draft, the judges, your feedback, the provenance record. `notebook/work/` holds the notes a run produces. |
| [`paper/`](paper/) | **Outputs** | What you publish for others to read: `final.md`, `final.html`, and the provenance block the course's AI policy asks for. |

Your paper becomes someone else's book. That is the circle the README at the
top of this repository describes, and this folder is one turn of it.

## What this is and is not

It is a **template and a worked brief**, not a finished paper. The brief
(`notebook/work/W00_brief.md`) is filled in from the syllabus. The other
`work/` files are produced when you run the steps on your own question. Copy
this folder into `02-your-project/` and run it there, or run it in place.

It is built for this course's AI policy, which is unusual: *all uses of AI are
permitted, but they have to be documented, explained, and reflected upon.*
So the last step is not a confession appended to the paper. It is part of the
assignment. Every step writes a file, and the files are the documentation.

## Run order

Read [`notebook/README.md`](notebook/README.md) first. Then `W00` through
`W10`, in order. Three steps are yours alone and the model never does them:
your seminar notes (`W01b`), choosing the thesis (`W03`), and your feedback on
the draft (`W09`). Everything else the model drafts and you check.

## Where the material comes from

The readings are the course's own: Plato, Confucius, Shelley, Wilde, Čapek,
Bergson, Grice, Sacks–Schegloff–Jefferson, and the twenty-two AI papers, all
as Markdown in [`context/`](../../context/). The seminar's questions supply
the lenses the brainstorm step uses: the cultural prehistory of AI, dialogue
as the form of our encounter with machines, the fabricated "assistant"
persona, role-play, and writing itself as a *pharmakon* of memory.

## Rules the whole folder obeys

- Read texts whole. A note that says "read in full" means every line.
- No invented quotations. Every verbatim quote must be findable in a file in
  `context/` or `books/`.
- The model drafts; you decide. Steps marked **you** stop until you act.
- Keep API keys, if any step uses one, in the repository's gitignored `.env`.

The shape is adapted from a pipeline built for a Government seminar's
pre-prospectus; the prompts here are rewritten for literary and philosophical
argument about texts, and the detector step that pipeline carried is replaced
by the provenance record this course requires.
