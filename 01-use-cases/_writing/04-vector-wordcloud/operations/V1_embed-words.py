#!/usr/bin/env python3
"""V1 — Give each word its vector.

Looks every counted word up in a pretrained word2vec model and writes out its
vector, its nearest neighbours among the other words of the text, and its
nearest neighbours in the model's whole vocabulary.

The default model is the one Mikolov et al. released with word2vec in 2013:
300 dimensions, three million words and phrases, trained on about a hundred
billion words of Google News. Gensim fetches it once (1.66 GB) into
~/gensim-data/; after that no network is needed.

Lookup, in order: the word as counted; Capitalised; UPPER. A possessive
("art's") falls back to its stem. A hyphenated compound ("subject-matter")
tries the model's underscore phrase ("subject_matter"), then the mean of its
parts. Every word records which route it took.

Deterministic code. No language model is involved; word2vec is a shallow
network whose weights are fixed.

Usage
  python3 V1_embed-words.py COUNTS.json --out vectors.json
                            [--vectors PATH] [--global-neighbours 6]
"""
import argparse, json, re, sys
from pathlib import Path

import numpy as np

MODEL_NAME = "word2vec-google-news-300"


def load_model(path: str | None):
    from gensim.models import KeyedVectors
    if path is None:
        import gensim.downloader as api
        path = api.load(MODEL_NAME, return_path=True)
    print(f"loading {path} …", file=sys.stderr)
    return KeyedVectors.load_word2vec_format(path, binary=True), path


def lookup(kv, word: str):
    """Return (vector, keys used, route) or (None, [], 'missing')."""
    for cand in (word, word.capitalize(), word.upper()):
        if cand in kv.key_to_index:
            return kv[cand], [cand], "exact" if cand == word else "case"
    stem = re.sub(r"['’]s$", "", word)
    if stem != word:
        v, keys, _ = lookup(kv, stem)
        if v is not None:
            return v, keys, "possessive → stem"
    if "-" in word:
        phrase = word.replace("-", "_")
        if phrase in kv.key_to_index:
            return kv[phrase], [phrase], "phrase"
        parts = [lookup(kv, p) for p in word.split("-")]
        if all(p[0] is not None for p in parts):
            return np.mean([p[0] for p in parts], axis=0), [k for p in parts for k in p[1]], "mean of parts"
    return None, [], "missing"


def clean_neighbours(kv, vec, own_keys, n):
    """Top n vocabulary neighbours, skipping case variants of the word itself and multi-word phrases."""
    own = {k.lower() for k in own_keys}
    out = []
    for key, sim in kv.similar_by_vector(vec, topn=60):
        if "_" in key or not re.fullmatch(r"[A-Za-z'-]+", key) or key.lower() in own:
            continue
        if key.lower() in {o[0].lower() for o in out}:
            continue
        out.append((key, round(float(sim), 3)))
        if len(out) == n:
            break
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("counts")
    ap.add_argument("--out", required=True)
    ap.add_argument("--vectors", help="a word2vec .bin(.gz); default: gensim's word2vec-google-news-300")
    ap.add_argument("--global-neighbours", type=int, default=6)
    ap.add_argument("--text-neighbours", type=int, default=5)
    a = ap.parse_args()

    counts = json.loads(Path(a.counts).read_text(encoding="utf-8"))
    kv, model_path = load_model(a.vectors)

    rows, missing = [], []
    for w in counts["words"]:
        vec, keys, route = lookup(kv, w["word"])
        if vec is None:
            missing.append(w["word"])
            continue
        rows.append({"word": w["word"], "count": w["count"], "keys": keys, "route": route, "vec": vec})

    M = np.array([r["vec"] for r in rows], dtype=np.float64)
    U = M / np.linalg.norm(M, axis=1, keepdims=True)
    S = U @ U.T
    for i, r in enumerate(rows):
        order = [j for j in np.argsort(-S[i]) if j != i][: a.text_neighbours]
        r["text_neighbours"] = [[rows[j]["word"], round(float(S[i, j]), 3)] for j in order]
        r["model_neighbours"] = clean_neighbours(kv, r["vec"], r["keys"], a.global_neighbours)
        r["vec"] = [round(float(x), 5) for x in r["vec"]]

    out = {
        "source_counts": a.counts,
        "model": MODEL_NAME if a.vectors is None else Path(a.vectors).name,
        "model_file": str(model_path),
        "dimensions": int(M.shape[1]),
        "vocabulary_size": len(kv.key_to_index),
        "words_in": len(counts["words"]),
        "words_embedded": len(rows),
        "missing": missing,
        "routes": {k: sum(r["route"] == k for r in rows) for k in sorted({r["route"] for r in rows})},
        "words": rows,
    }
    Path(a.out).write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"{len(rows)}/{len(counts['words'])} words embedded ({out['routes']}); missing: {missing or 'none'} -> {a.out}")
    for r in rows[:6]:
        print(f"  {r['word']:<12} text: {', '.join(n for n, _ in r['text_neighbours'][:3]):<36} model: {', '.join(n for n, _ in r['model_neighbours'][:3])}")


if __name__ == "__main__":
    main()
