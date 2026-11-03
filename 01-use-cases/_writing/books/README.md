# Books

The texts this pipeline reads. Nothing is copied here; the Markdown versions
already live in [`context/`](../../../context/), and the steps in
`../notebook/` read them from there. This file is the manifest: what exists,
where it is, and which edition it is, so that a quotation can always be traced.

If you add a text of your own, put the file in this folder and add a row.

## The syllabus

| File | What |
|---|---|
| [`../../../context/course-readings/syllabus.md`](../../../context/course-readings/syllabus.md) | The Canvas syllabus, transcribed. The assignment brief (`W00`) is reconstructed from it. |

## Course readings

| Seminar | Text | Edition in the file | Path |
|---|---|---|---|
| 2 | Mary Shelley, *Frankenstein* (1818) | See the file's header for source and edition | `context/course-readings/course-readings-md/shelley-frankenstein-1818.md` |
| 3 | Oscar Wilde, *The Picture of Dorian Gray* (1891) | See header | `context/course-readings/course-readings-md/wilde-picture-of-dorian-gray-1891.md` |
| 3 | Oscar Wilde, *Intentions* (1891), incl. "The Critic as Artist" | See header | `context/course-readings/course-readings-md/wilde-intentions.md` |
| 4 | Karel Čapek, *R.U.R.* (1920; English translation) | See header for translator and date | `context/course-readings/course-readings-md/capek-rur.md` |
| 4 | Henri Bergson, *Laughter* (1900), trans. Brereton and Rothwell (1911) | Project Gutenberg #4352 | `context/course-readings/course-readings-md/bergson-laughter.md` |
| 5 | Plato, *Phaedrus* | See header for translator | `context/course-readings/course-readings-md/plato-phaedrus.md` |
| 5 | Confucius, *Analects* | See header for translator | `context/course-readings/course-readings-md/confucius-analects-chin.md` |
| 6 | Sacks, Schegloff, and Jefferson, "A Simplest Systematics for the Organization of Turn-Taking for Conversation" (1974) | *Language* 50.4 | `context/course-readings/course-readings-md/sacks-schegloff-jefferson-1974-turn-taking.md` |
| 6 | H. P. Grice, "Logic and Conversation" (1975) | *Syntax and Semantics* 3 | `context/course-readings/course-readings-md/grice-1975-logic-and-conversation.md` |

**Check the header of each file before citing.** The Markdown files carry a
note on their source, and several are later editions or reprints of the text
the syllabus dates. The `W01` notes step records which edition it read, so
the paper can cite it correctly. Čapek's *R.U.R.* in particular is a
translation; which one changes the wording of every quotation.

## AI papers

Twenty-two papers, word2vec (2013) to Shanahan et al. on role-play (2023), as
full-text Markdown extracted from the arXiv PDFs, with a reading guide.

| File | What |
|---|---|
| [`../../../context/LL-readings/papers-on-ai-notes.md`](../../../context/LL-readings/papers-on-ai-notes.md) | The Learning Lab's notes on why each paper is in the collection. Read this first. |
| `context/LL-readings/papers-on-ai-md/` | One file per paper, named by arXiv id and title. |
| `context/LL-readings/extraction-manifest.json` | Which PDF each Markdown file came from, with page counts and checksums. |

Two of these are assigned reading: Askell et al. (2021), *A General Language
Assistant as a Laboratory for Alignment* (Seminar 7), and Shanahan, McDonell,
and Reynolds (2023), "Role Play with Large Language Models" (Seminar 7,
required). The rest are the technical history the course asks you to "tackle
using AI to extract the most salient points."

## Further reading the syllabus names but the repository does not hold

- Nina Beguš, *Artificial Humanities: A Fictional Perspective on Language in AI* (2025). In copyright; not included. Cite from a library copy.
- The 1931 *Frankenstein* film (James Whale). Not a text; the timeline use case has its verified release dates.
