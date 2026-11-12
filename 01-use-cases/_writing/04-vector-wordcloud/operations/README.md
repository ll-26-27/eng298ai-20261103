# Operations

Three scripts, run after `../03-word-clouds/operations/C1_count-words.py`. All
deterministic; no language model, no key. Same seed, same page.

| Step | What it does | Reads | Writes |
|---|---|---|---|
| [`V1_embed-words.py`](V1_embed-words.py) | Looks each counted word up in word2vec (exact → Capitalised → UPPER → possessive stem → underscore phrase → mean of hyphenated parts). Records the route, the vector, the 5 nearest words in the text and the 6 nearest in the model's vocabulary. | `preface-counts.json`, the GoogleNews vectors | `preface-vectors.json` |
| [`V2_lay-out-semantic.py`](V2_lay-out-semantic.py) | k-means (k = 7, NumPy) on the unit vectors for colour. t-SNE (cosine, perplexity 10) and PCA (SVD) to 2-D, each axis stretched to the field. Packs biggest first: each word starts at its own projected point and walks Wordle's Archimedean spiral until its box is clear. Runs t-SNE a second time to 3-D, scaled so 95% of words sit inside the unit sphere, with outliers pulled to radius 1.15. Adds the `03` Wordle positions, rescaled. | `preface-vectors.json`, `03`'s `preface-layout.json` | `preface-semantic-layout.json` |
| [`V3_build-page.py`](V3_build-page.py) | The page. Every word is one SVG `<text>` drawn at size 100 and moved by a CSS transform, so switching layouts animates position, size and rotation together. The 3D view is drawn by about forty lines of JavaScript: rotate by yaw and pitch, divide by distance from a camera at 3.2 radii, redraw each frame, and re-sort the words back to front every fourth frame. No 3D library. | the layout, the Preface | `index.html` |

## Differences from `03`'s Wordle

- **Start point.** Wordle starts each word at a random point near the centre
  line. `V2` starts it at its projected vector.
- **Collision.** Rectangles, not glyph masks: every word here is horizontal,
  so its box is its shape to within the descenders. This keeps `V2` short.
- **Colour** encodes cluster membership in 300-D. In Wordle it encoded nothing.
- **No rotation** in the semantic layouts, so every word can be read where it lands.

## Why k-means and PCA are written out

scikit-learn's `KMeans` calls `threadpoolctl`, and the version shipped with
some Anaconda installs crashes on macOS (`AttributeError: 'NoneType' object
has no attribute 'split'`). `V2` therefore has twenty lines of NumPy for
k-means (k-means++ starts, best of 50 by inertia) and five for PCA. scikit-learn's
t-SNE does not hit the bug and is used as is.
