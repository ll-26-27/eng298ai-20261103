---
title: "Vector word cloud: Wilde's Preface, placed by meaning"
description: The same 123 words as the Wordle in 03-word-clouds, sized by the same counts, but placed by their word2vec vectors instead of at random. Colour is a cluster in the 300-dimensional space. The page moves between t-SNE, PCA, a rotating 3D t-SNE and the original Wordle, and shows each word's nearest neighbours in the Preface and in Google News.
author: claude
created: 2026-11-03
---

# Vector word cloud

**[Open the page](outputs/index.html)**

In a Wordle, size is the only thing that means anything. Position is a
random start on a spiral; colour is drawn from a palette. This project keeps
Wordle's size (count, linear) and replaces the other two with meaning, or with
what word2vec learned about meaning from Google News.

Each word of the Preface to *The Picture of Dorian Gray* is looked up in the
vectors Mikolov and colleagues released with word2vec in 2013: 300 numbers per
word, learned by predicting words from the words around them across about
100 billion words of news. Words that keep the same company end up pointing
the same way. The 123 vectors are flattened to two dimensions, each word
starts at its flattened point, and Wordle's spiral nudges it out only as far
as it needs to stop overlapping. Colour is a k-means cluster of the full
vectors, so two words of the same colour are near each other before
anything is flattened.

The page has four buttons. *t-SNE* and *PCA* are two ways of flattening.
*In 3D* flattens less: t-SNE into three dimensions, drawn with perspective
and turning slowly. Drag it to turn it yourself; nearer words are larger and
darker. *As Wordle placed them* animates the same words back to their positions in
[`../03-word-clouds`](../03-word-clouds/outputs/index.html), where place is
chance. Click any word for its five nearest words in the Preface (lines on the
cloud, bars in the panel), its six nearest in the whole three-million-word
vocabulary, and every sentence in which Wilde uses it.

## What it shows

- **The people form a cluster.** The gold cluster is *artist, creator,
  critic, musician, actor's, Caliban*, with *nineteenth, realism* and
  *morbid* pulled in. *Artist*'s nearest word in the Preface is *musician*
  (0.68), ahead of *art* (0.57).
- **Morals and judgements form another.** The orange cluster, the largest
  at 28 words, puts *moral, morality, ethical, immoral, corrupt, vice,
  virtue, unpardonable* together with *critics, spectator, opinion,
  disagree, forgive, excuse*.
- **The Preface's own pairs mostly land together.** *Reveal* and *conceal*,
  *surface* and *beneath*, *mirrors* and *seeing* share the pink cluster.
  *Useful* and *useless* share the violet one.
- **News is the model's reading.** In Google News *vice* is nearest *chairman*
  and *deputy*, not *virtue* (0.14). *Glass* is nearest *Plexiglas*. *Face* is
  nearest *confront*.
- **Some of Wilde's senses survive anyway.** *Surface* and *beneath* (0.42);
  *useless* and *useful* (0.53); *Caliban*'s nearest neighbour in the whole
  model is *Prospero*.
- **PCA flattens almost everything.** Its two components hold 4.7% and 3.9% of
  the variance, which is why *artist* and *art* sit alone at one edge. t-SNE
  keeps neighbourhoods and makes the readable picture; PCA makes the
  honest-but-crowded one.

## The chain

| Step | What | Who |
|---|---|---|
| `inputs/` | The Preface, copied exactly (same file as `03`) | — |
| `C1` (from `03`) | Count the words; drop stop words. Reused unchanged, so the counts match the Wordle exactly. | deterministic code |
| `V1` | Look each word up in word2vec; record the vector, the route taken, and nearest neighbours in the text and in the model. | deterministic code (a pretrained, fixed embedding) |
| `V2` | k-means in 300-D for colour; t-SNE and PCA to 2-D; pack biggest first from each word's own point along Wordle's spiral; t-SNE again to 3-D, unpacked; read the Wordle positions from `03`. | deterministic code |
| `V3` | The page: cloud, four layouts (the 3D one projected and rotated in the browser), legend, word panel, text, method, full table. | deterministic code |

No language model is called. word2vec is a single-layer network whose weights
were fixed in 2013; looking a word up is reading a row of a table.

## How to rerun

From the repository root:

```bash
cd 01-use-cases/_writing/04-vector-wordcloud
python3 ../03-word-clouds/operations/C1_count-words.py \
  ../../../context/course-readings/course-readings-md/wilde-picture-of-dorian-gray-1891.md \
  --from "## The Preface" --to "## Chapter I" --out outputs/preface-counts.json
python3 operations/V1_embed-words.py outputs/preface-counts.json --out outputs/preface-vectors.json
python3 operations/V2_lay-out-semantic.py outputs/preface-vectors.json \
  --out outputs/preface-semantic-layout.json \
  --wordle-layout ../03-word-clouds/outputs/preface-layout.json
python3 operations/V3_build-page.py outputs/preface-semantic-layout.json \
  --excerpt inputs/wilde-dorian-gray-preface.md --out outputs/index.html
```

`V1` downloads the vectors once (1.66 GB, to `~/gensim-data/`), then loads
them in about a minute. `V2` and `V3` need only the 380 KB
`preface-vectors.json` that `V1` writes, which is committed, so the layout can
be changed without the download. Python 3 with NumPy, scikit-learn, gensim,
Pillow and matplotlib (all in Anaconda).

### Knobs

- `V2 --clusters 7`: how many colours. Fewer gives broader families.
- `V2 --perplexity 10`: t-SNE's sense of neighbourhood size. Lower values
  give tighter islands; higher values blend them.
- `V2 --seed 298`: t-SNE and k-means starts. Same seed, same picture.
- `V2 --min-size 24 --max-size 150`: the count-to-size scale. Larger words
  pack more densely and walk further from their points: at 24–150 the median
  word moves 50 px from its t-SNE point; at 15–96 it moved 5.5 px, but the
  cloud was mostly white space.
- `V1 --vectors FILE.bin`: any word2vec-format file, such as GloVe converted
  or vectors trained on a corpus of your own.

### Run it on another text

Any cut that `C1` can make. Count with `C1`, then run `V1`–`V3`. Without
`--wordle-layout` the page shows only the t-SNE, PCA and 3D buttons; to get the
third, run `03`'s `C2` on the same counts first.

## What to check

- **Proximity is news proximity.** Every similarity is learned from Google
  News, 2013. Read the panel's *Nearest in Google News* list before reading
  meaning into a position.
- **Three words were looked up indirectly.** *Art's* and *actor's* use their
  stems (so *art's* and *art* share a vector and sit together by
  construction); *subject-matter* is the mean of *subject* and *matter*;
  *caliban* was found capitalised. Every other word matched exactly; none was
  missing.
- **The flattening loses most of the space.** Check closeness by clicking: the
  lines and bars use all 300 dimensions; the picture uses two, or three.
- **The 3D view is a separate t-SNE run**, not the 2D one with depth added,
  so its neighbourhoods can differ a little from the flat t-SNE. Its scale is
  set so 95% of words fall inside the unit sphere. *Even* landed 2.8 times
  further out than that and is drawn at the sphere's edge (1.15) instead;
  `tsne3d_pulled_in` in the layout file records it.
- **Packing moves words.** Tick *Show where the vectors put each word*: a dot
  marks each word's projected point, and a line shows how far the spiral moved
  it. The largest move on t-SNE is *intensely*, 372 px out from the crowded
  centre.
- **Clusters are k-means.** They depend on k and the seed. The legend names
  each cluster after its three most frequent words, which can mislead:
  *art · beautiful · century* is mostly aesthetic vocabulary (*beauty,
  charming, cultivated, style, mannerism*), with *century* and *glass*
  along for the ride. The table at the foot of the page lists every member.

## Models and cost

No API calls, no key. word2vec GoogleNews vectors (Mikolov et al. 2013), run
locally: about a minute to load, two seconds for layout and page. Built by
Claude Code (Opus 5.5), November 3, 2026, extending the `03` scripts.

## Sources and rights

- Oscar Wilde, *The Picture of Dorian Gray* (1891 book edition), Project
  Gutenberg #174, as held in `context/course-readings/`. Public domain.
- Tomas Mikolov, Kai Chen, Greg Corrado and Jeffrey Dean, "Efficient
  Estimation of Word Representations in Vector Space," arXiv:1301.3781 (2013);
  Mikolov, Sutskever, Chen, Corrado and Dean, "Distributed Representations of
  Words and Phrases and their Compositionality," *NeurIPS* 2013. The
  pretrained GoogleNews-vectors-negative300 are released under Apache 2.0 and
  fetched through gensim-data. `preface-vectors.json` holds 123 of their rows.
- Laurens van der Maaten and Geoffrey Hinton, "Visualizing Data using t-SNE,"
  *Journal of Machine Learning Research* 9 (2008): 2579–2605; scikit-learn's
  implementation.
- Jonathan Feinberg, "Wordle," in *Beautiful Visualization*, ed. Julie Steele
  and Noah Iliinsky (O'Reilly, 2010), 37–58: the spiral, via `03`.
- Font: DejaVu Sans Bold (Bitstream Vera licence), via matplotlib.
