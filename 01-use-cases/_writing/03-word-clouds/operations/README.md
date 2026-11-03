# Notebook

Three scripts, run in order. All deterministic; no model, no key, no cost.
Python 3 with Pillow and NumPy (both come with Anaconda); matplotlib only for
its bundled font.

| Step | What it does | Reads | Writes |
|---|---|---|---|
| [`C1_count-words.py`](C1_count-words.py) | Finds the words with Feinberg's regex, drops stop words, counts. *Weight = word count.* | a text, or a JSON field | `counts.json`, and the exact excerpt counted |
| [`C2_lay-out-wordle.py`](C2_lay-out-wordle.py) | Sizes each word by its count, then places them biggest first, each walking out along a spiral from a random start near the centre line until it touches nothing. | `counts.json` | `.png`, `.svg`, `layout.json` |
| [`C3_build-page.py`](C3_build-page.py) | One HTML page: the clouds inline, the text, the counts, the algorithm, the caveats. | the above | `../paper/index.html` |

`work/` is where `C1` drops the excerpt it counted. It is gitignored across
this repository; the copy that is committed is `../books/wilde-dorian-gray-preface.md`.

## Knobs

`C2 --help` lists them. The ones that change the picture:

- `--layout`: `horizontal`, `mostly-horizontal` (default), `half-and-half`, `mostly-vertical`, `vertical`, `any-which-way`. Wordle's menu had the same names; its "any which way" used more angles than our 0° and 90°.
- `--placement`: `centre-line` (default) or `alphabetical`, Feinberg's two strategies.
- `--seed`: the random start positions and colours. Same seed, same cloud.
- `--font FILE.ttf`: any TrueType font. Default is DejaVu Sans Bold, so a rerun matches on another machine. `--font-family` is what the SVG asks the browser for; `textLength` holds each word to the measured width whatever font answers.
- `--palette`: a name from the script or a comma list of hex colours. Colour carries no information, as in the original.
- `--min-size`, `--max-size`: the ends of the linear scale. Feinberg kept it linear because square-root scaling "simply makes a Wordle look boring."
- `--gap`: how far the mask is swollen; the white between words.

## What is and is not Wordle

Kept: the word regex, stop-word removal, weight = count, linear size, the
estimated playing field, descending-weight greedy placement, random start near
the centre line, the Archimedean spiral, the rectangle as a soft constraint,
swollen shapes for spacing, meaningless colour.

Changed: Wordle tested glyph outlines through hierarchical bounding boxes and a
quadtree, for speed; `C2` tests pixel masks against one occupancy grid, which
is slower (about a second for a hundred words) and shorter. Wordle guessed the
text's language from its stop lists; `C1` has one English list, ours. One
guard is ours: a rotated word taller than the field lies down instead.
