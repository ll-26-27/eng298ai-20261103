# Inputs

| What | Path | Note |
|---|---|---|
| **Wilde, the Preface to *The Picture of Dorian Gray* (1891)** | [`wilde-dorian-gray-preface.md`](wilde-dorian-gray-preface.md) | The same file as `../03-word-clouds/inputs/`: the exact passage counted, from `context/course-readings/course-readings-md/wilde-picture-of-dorian-gray-1891.md` (Project Gutenberg #174). 381 words. Public domain. |
| **word2vec GoogleNews vectors** (Mikolov et al., 2013) | `~/gensim-data/word2vec-google-news-300/`, outside the repository | 3,000,000 words and phrases × 300 dimensions, trained on about 100 billion words of Google News. 1.66 GB; fetched once by `V1` through gensim's downloader. Apache 2.0. Not committed; the 123 rows used are in `../outputs/preface-vectors.json`. |
| **The Wordle layout** | `../03-word-clouds/outputs/preface-layout.json` | Positions, sizes and rotations from the Wordle project, read by `V2` for the *As Wordle placed them* button. An output of one project used as an input to the next. |
