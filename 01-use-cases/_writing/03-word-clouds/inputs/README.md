# Books

The inputs. Two kinds: a text to count, and the tool being imitated.

## The text of the worked run

| Text | Path | Length | Note |
|---|---|---|---|
| **Wilde, the Preface to *The Picture of Dorian Gray* (1891)** | [`wilde-dorian-gray-preface.md`](wilde-dorian-gray-preface.md), copied from `context/course-readings/course-readings-md/wilde-picture-of-dorian-gray-1891.md` | 381 words | Assigned for Seminar 3. The shortest text in the course that is whole in itself: twenty-five aphorisms and a signature. Public domain (Project Gutenberg #174). |

The copy here is the exact passage the scripts counted, so the numbers on the
page can be checked against it without opening the novel.

## The original Wordle

The thing being rebuilt. Nothing of it is copied here; it is cited.

| What | Where | Note |
|---|---|---|
| **Wordle**, Jonathan Feinberg, 2008 | wordle.net, offline | A Java applet: paste text, click, get a cloud. Browsers dropped Java and the site went dark. |
| San Diego State University, "Wordle," *Teaching with Digital Humanities* | <https://teachdh.sdsu.edu/tools/wordle/> | The page this project started from. Says what Wordle was, that "the original tool is no longer online," and points to EdWordle and Voyant as replacements. |
| Jonathan Feinberg, "Wordle," in *Beautiful Visualization: Looking at Data Through the Eyes of Experts*, ed. Julie Steele and Noah Iliinsky (O'Reilly, 2010), pp. 37–58 | Author's copy: <https://s3.amazonaws.com/static.mrfeinberg.com/bv_ch03.pdf> | Feinberg's own account of how Wordle works: the word regex (Example 3-1), weight = word count, the playing field, the spiral (Example 3-3), the rectangle constraint (Example 3-4), hierarchical bounding boxes, and his caveats. `operations/C1` and `C2` follow it section by section. In copyright; read, not copied. |
| Viégas, Wattenberg, and Feinberg, "Participatory Visualization with Wordle," *IEEE TVCG* 15.6 (2009): 1137–1144 | doi:10.1109/TVCG.2009.171 | The survey of how people used it. Cited in the chapter; not read for this run. |

Not to be confused with the other Wordle, Josh Wardle's five-letter guessing
game (2021). Different Wordle, different decade.

## A second corpus, from this repository

| Text | Path | Length | Note |
|---|---|---|---|
| The Common Room transcript | `01-use-cases/simulation/outputs/runs/20261103T160946Z-cab251/conversation.json`, field `turns[].utterance` | 1,970 words | Twenty turns of a fictional library committee, produced by the simulation use case. Not course material; an output used as an input. Rerun that project and the file name changes. |

## Other course texts to try

Any file in `context/course-readings/course-readings-md/` works with `C1`.
Short passages come out better than whole books, which turn into a page of the
author's favourite noun. Some cuts worth making with `--from`/`--to`:

- Wilde, *Intentions*: "The Decay of Lying" (`## The Decay of Lying` to `## Pen, Pencil, and Poison`).
- Bergson, *Laughter*: Chapter I alone.
- Grice, "Logic and Conversation": the whole essay is short enough.
- Plato, *Phaedrus*: the Theuth and Thamus passage, if you cut by Stephanus number by hand.
- Confucius, *Analects*: Wordle refused CJKV scripts on purpose (fonts too large, word breaks too hard). `C1`'s regex will split the Chinese into one token per run of characters, which is wrong. A fair project of its own.
