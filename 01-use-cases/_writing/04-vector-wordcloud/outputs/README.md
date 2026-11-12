# Outputs

Open [`index.html`](index.html).

| File | What |
|---|---|
| `index.html` | The page, self-contained (161 KB, no network). Four layouts (t-SNE, PCA, rotating 3D t-SNE, Wordle), cluster legend (click to isolate), word panel (click a word), the text, the method, and every word as a table. |
| `preface-counts.json` | `C1`'s counts; identical to `../03-word-clouds/outputs/preface-counts.json`. 123 words. |
| `preface-vectors.json` | The 123 vectors (300 numbers each), lookup routes, and both neighbour lists. Enough to rerun `V2` and `V3` without the 1.66 GB model. |
| `preface-semantic-layout.json` | Clusters, glyph metrics, and for each 2D layout every word's position, size, its projected target, and how far packing moved it; for `tsne3d`, each word's X, Y, Z. |
