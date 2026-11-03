---
title: "Word clouds: Wordle, rebuilt in Python, on Wilde's Preface"
description: Jonathan Feinberg's Wordle (2008) was a Java applet that is no longer online. This rebuilds its published algorithm in three short Python scripts and runs it on the Preface to The Picture of Dorian Gray, the shortest text in the course, with the counts beside the picture so the picture can be checked.
author: claude
created: 2026-11-03
---

# Word clouds

**[Open the page](paper/index.html)**

Before distant reading had a name it had a toy. Wordle (Jonathan Feinberg,
2008) took any text you pasted and drew its words at sizes proportional to
their counts, packed together "like the dot of an *i* in the lower counter of
a *g*." It ran as a Java applet in the browser; when browsers stopped running
Java, it stopped. Feinberg published how it worked in 2010. This folder is
that algorithm, rewritten in Python, run on one short course text.

The text is the Preface to *The Picture of Dorian Gray*: twenty-five
aphorisms, 381 words, a signature. It was chosen because it is whole, short
enough to check by hand, and about the worthlessness of exactly this kind of
exercise ("All art is quite useless").

## The chain

| Step | What | Who |
|---|---|---|
| `books/` | The Preface, copied exactly; the original Wordle, cited | — |
| `C1` | Find the words, drop stop words, count. Weight = count. | deterministic code |
| `C2` | Size by count; place biggest first along a spiral from the centre line; swell for spacing; colour at random. | deterministic code |
| `C3` | The page: clouds, text, counts, algorithm, caveats. | deterministic code |

No model is involved anywhere in the chain. That is the point of including
it: next to the other `_writing` examples, where the model reads, this is
what counting looks like with nothing reading at all.

## How to rerun

From the repository root:

```bash
cd 01-use-cases/_writing/03-word-clouds
python3 notebook/C1_count-words.py \
  ../../../context/course-readings/course-readings-md/wilde-picture-of-dorian-gray-1891.md \
  --from "## The Preface" --to "## Chapter I" \
  --out paper/preface-counts.json --excerpt notebook/work/preface.txt
python3 notebook/C2_lay-out-wordle.py paper/preface-counts.json \
  --png paper/preface-wordle.png --svg paper/preface-wordle.svg \
  --layout-json paper/preface-layout.json --palette wilde --min-size 20 --max-size 240
python3 notebook/C3_build-page.py --out paper/index.html \
  --main-svg paper/preface-wordle.svg --main-counts paper/preface-counts.json \
  --excerpt books/wilde-dorian-gray-preface.md \
  --second-svg paper/common-room-wordle.svg --second-counts paper/common-room-counts.json
```

The second cloud on the page, the Common Room committee, was made with:

```bash
python3 notebook/C1_count-words.py \
  ../../simulation/outputs/runs/20261103T160946Z-cab251/conversation.json \
  --json-path turns.utterance --remove-numbers --out paper/common-room-counts.json
python3 notebook/C2_lay-out-wordle.py paper/common-room-counts.json \
  --png paper/common-room-wordle.png --svg paper/common-room-wordle.svg \
  --layout-json paper/common-room-layout.json --palette committee \
  --min-size 16 --max-size 200 --seed 1103
```

Needs Python 3 with Pillow and NumPy; matplotlib supplies the default font.
No key, no network. Same seed, same picture. Change `--seed` and the words
land elsewhere; change `--font` and they change their clothes.

### Run it on another text

Any file in `context/`. Cut a passage with `--from` and `--to` (the headings
in the Markdown), or feed a whole essay. `books/README.md` lists some cuts.

## What to check

- **The counts against the text.** Search the Preface for *artist*: eleven
  hits. If the picture and the file disagree, the picture is wrong.
- **The stop list.** It is ours, not Wordle's, and Feinberg says such lists
  are "a matter of taste, not science." *Things* is in the cloud; *all* is
  not. Decide whether that is right for your text and edit the list at the
  top of `C1`.
- **What size means.** Count, linearly. Not importance, not emotional weight.
  Feinberg found most Wordle users guessed otherwise.
- **What size does not control for.** A long word takes more room than a
  short one used as often. *Nineteenth* (2) looks like more than *new* (2).
- **Apostrophes and hyphens.** Feinberg's regex keeps them, so *art's* and
  *art* are different words, as are *subject-matter* and *subject*. That
  matches the original; it may not match what you want.
- **The whole-text caveat.** "Merely counting words does not permit
  meaningful comparisons of like texts." A cloud of every chapter of a novel
  is a page of its protagonist's name. To see what makes one text unlike its
  neighbours you need a comparison corpus and a statistic, which this does
  not do; `distant-reading/` does.

## Models and cost

None. Three Python scripts; about two seconds. The scripts and this page
were written by Claude Code (Fable 5.1) in the building session, from
Feinberg's chapter read whole.

## Sources and rights

- Oscar Wilde, *The Picture of Dorian Gray* (1891 book edition), Project
  Gutenberg #174, as held in `context/course-readings/`. Public domain.
- Jonathan Feinberg, "Wordle," in *Beautiful Visualization: Looking at Data
  Through the Eyes of Experts*, ed. Julie Steele and Noah Iliinsky
  (Sebastopol, CA: O'Reilly, 2010), 37–58. The author's copy is at
  <https://s3.amazonaws.com/static.mrfeinberg.com/bv_ch03.pdf>. In copyright;
  the scripts quote its pseudocode (Examples 3-3 and 3-4) and nothing longer.
- San Diego State University Library, "Wordle," *Teaching with Digital
  Humanities*, <https://teachdh.sdsu.edu/tools/wordle/>. Where this started.
- The Common Room transcript is this repository's own, from
  `01-use-cases/simulation/`; its speakers are fictional.
- Font: DejaVu Sans Bold (Bitstream Vera licence), via matplotlib.
