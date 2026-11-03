---
title: "Quotes and outlines: the notebook's first movements"
description: The smallest useful piece of writing with AI. One text, read whole; the passages copied out with their page numbers; the text's own skeleton; three sketches of what a paper could be. Worked on Grice's "Logic and Conversation."
author: claude
created: 2026-11-03
---

# Quotes and outlines

Before there is a paper there is a notebook, and before there is an argument
there are the passages you copied out and the shape you noticed. This
example does only that. It stops on purpose before anyone writes prose.

Three movements, each a file in `operations/`:

| Step | What it does | Who |
|---|---|---|
| `Q1` | Reads one text whole and copies out the passages that matter, verbatim, with page numbers, each tagged for what it is doing | model |
| `Q2` | Writes the text's skeleton: the argument's steps, in order, with where each happens | model |
| `Q3` | Sketches three outlines for a paper this text could anchor in this course, each with a claim, a crux passage, a collision, and a counter-reading | model, you choose |

The worked run is on **H. P. Grice, "Logic and Conversation" (1975)**,
assigned for Seminar 6. It is eighteen pages, which is why it was chosen: a
reader can check every quotation in the time it takes to read this README.
The results are in `operations/work/`.

## Why this is worth doing with a model

Not because the model reads better than you. Because the quote bank it
produces is checkable in a way its summaries are not. Every line in
`Q1_quotes_grice.md` is in the text at the page given, or it is wrong, and
you can tell which in a minute. A summary cannot be checked that way. The
skeleton is the same: it names where each step happens, so a wrong step is
visible. Of the three movements, only `Q3` is interpretation, and it is
labelled as such.

## Run it on another text

```text
Follow 01-use-cases/_writing/02-quotes-and-outlines/operations/Q1_pull-quotes.md
for context/course-readings/course-readings-md/wilde-intentions.md.
Write to 01-use-cases/_writing/02-quotes-and-outlines/operations/work/Q1_quotes_wilde-intentions.md.
```

Then `Q2`, then `Q3`. The texts are listed in [`inputs/README.md`](inputs/README.md).

## What to check

- **Every quotation against the file.** Search for a phrase from it in the
  Markdown in `context/`. If it is not there, the notebook is wrong.
- **Page numbers.** The course's Markdown keeps the original page breaks as
  comments (`<!-- p. 45 -->`); a quotation that straddles one is cited to
  both pages.
- **The tags.** *crux*, *claim*, *definition*, *example*, *turn*, *joke*,
  *objection* are the model's reading of what a passage does. Disagree with
  them.
- **`Q3` is not neutral.** The three sketches are angled toward this course's
  questions about dialogue and the assistant. A different course would get
  different sketches from the same bank.

## Models and cost

The reading, the quote bank, the skeleton, and the sketches were done by
Claude Code (Fable 5.1) in the building session, reading the 190-line
Markdown file in one pass. No API calls; no cost log.

## Sources

Grice, H. P. 1975. "Logic and Conversation." In *Syntax and Semantics, Vol. 3:
Speech Acts*, ed. Peter Cole and Jerry L. Morgan, 41–58. New York: Academic
Press. The course's Markdown is an OCR of the Canvas scan, proofread against
page images, with small capitals rendered in uppercase. The essay was first
delivered as part of the William James Lectures at Harvard in 1967. The text
is in copyright; the notebook quotes only sentences, for study.
