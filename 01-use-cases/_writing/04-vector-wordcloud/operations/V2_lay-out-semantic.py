#!/usr/bin/env python3
"""V2 — Lay the words out by meaning.

Takes the vectors from V1 and produces four layouts of the same words on one
field, so the page can move between them:

  * tsne  — t-SNE (van der Maaten and Hinton 2008) on cosine distance. Keeps
            neighbourhoods; distances between far-apart groups mean little.
  * pca   — the first two principal components of the unit vectors. Keeps the
            two directions of greatest spread; crowds everything else.
  * tsne3d — t-SNE again, in three dimensions, scaled so 95% of words sit in the unit sphere,
            not packed; the page rotates it with perspective.
  * wordle — the positions from ../03-word-clouds, where place means nothing.
            Read from that project's layout file and rescaled to this field.

For tsne and pca, each projected point is a *target*. Words are placed
biggest first. Each starts on its target and, if it overlaps a word already
placed, walks out along Wordle's Archimedean spiral until it is clear. The
distance walked is recorded per word, so the page can show how far packing
pulled a word from where the vectors put it.

Size is count, linear, as in Wordle. Colour is a k-means cluster of the
300-dimensional vectors (not of the 2-D picture), so colour now carries
information: words of one colour are near each other in the model's space.

Deterministic code; same seed, same layout.

Usage
  python3 V2_lay-out-semantic.py vectors.json --out layout.json
        [--wordle-layout ../03-word-clouds/outputs/preface-layout.json]
        [--clusters 7] [--perplexity 10] [--seed 298]
        [--width 1400 --height 860] [--min-size 24 --max-size 150]
"""
import argparse, json, math, sys
from pathlib import Path

import numpy as np
from PIL import ImageFont
from sklearn.manifold import TSNE

# Categorical slots, fixed order. Validated with the dataviz palette checker
# (light surface): lightness, chroma, contrast pass; worst adjacent colour-blind
# pair is aqua/orange at ΔE 7.0, carried by the legend and spatial grouping.
PALETTE = ["#2a78d6", "#d95926", "#14875f", "#6250d6", "#a87300", "#c2457a", "#4d6b1f"]
BASE = 100          # the size every <text> is drawn at; layouts scale from it


def find_font() -> str:
    import matplotlib
    return str(Path(matplotlib.__file__).parent / "mpl-data/fonts/ttf/DejaVuSans-Bold.ttf")


def spiral(cx, cy, step=1.6, turn=0.3):
    t = 0.0
    while True:
        r = step * t
        yield cx + r * math.cos(t), cy + r * math.sin(t), r
        t += turn / (1 + 0.02 * r)


def kmeans(U, k, seed, n_init=50, iters=300):
    """Lloyd's k-means with k-means++ starts, best of n_init by inertia. Plain NumPy:
    scikit-learn's KMeans trips over an old threadpoolctl in some Anaconda installs."""
    rng = np.random.default_rng(seed)
    best = None
    for _ in range(n_init):
        C = [U[rng.integers(len(U))]]
        for _ in range(k - 1):
            d = np.min(((U[:, None] - np.array(C)[None]) ** 2).sum(-1), axis=1)
            C.append(U[rng.choice(len(U), p=d / d.sum())])
        C = np.array(C)
        for _ in range(iters):
            lab = ((U[:, None] - C[None]) ** 2).sum(-1).argmin(1)
            new = np.array([U[lab == j].mean(0) if (lab == j).any() else C[j] for j in range(k)])
            if np.allclose(new, C):
                break
            C = new
        inertia = ((U - C[lab]) ** 2).sum()
        if best is None or inertia < best[0]:
            best = (inertia, lab)
    return best[1]


def pca2(U):
    """First two principal components by SVD; returns coordinates and variance ratios."""
    X = U - U.mean(0)
    _, S, Vt = np.linalg.svd(X, full_matrices=False)
    var = S ** 2 / (S ** 2).sum()
    return X @ Vt[:2].T, var[:2]


def fit(points, W, H, margin):
    """Stretch each axis to the field, minus a margin. Axes of a projection carry no units."""
    p = points - points.min(axis=0)
    p = p / np.where(p.max(axis=0) == 0, 1, p.max(axis=0))
    return np.c_[margin[0] + p[:, 0] * (W - 2 * margin[0]), margin[1] + p[:, 1] * (H - 2 * margin[1])]


def pack(words, targets, sizes, boxes, W, H, pad):
    """Biggest first; each from its own target along a spiral until its box is clear."""
    placed = []                                 # (x0, y0, x1, y1)
    out = [None] * len(words)
    order = sorted(range(len(words)), key=lambda i: (-sizes[i], i))
    for i in order:
        w, h = boxes[i][0] * sizes[i] / BASE + 2 * pad, boxes[i][1] * sizes[i] / BASE + 2 * pad
        tx, ty = targets[i]
        for x, y, r in spiral(tx, ty):
            x0, y0, x1, y1 = x - w / 2, y - h / 2, x + w / 2, y + h / 2
            inside = x0 >= 0 and y0 >= 0 and x1 <= W and y1 <= H
            if (inside or r > max(W, H)) and not any(x0 < b[2] and b[0] < x1 and y0 < b[3] and b[1] < y1 for b in placed):
                placed.append((x0, y0, x1, y1))
                out[i] = {"x": round(x, 1), "y": round(y, 1), "tx": round(float(tx), 1), "ty": round(float(ty), 1),
                          "moved": round(r, 1)}
                break
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("vectors")
    ap.add_argument("--out", required=True)
    ap.add_argument("--wordle-layout")
    ap.add_argument("--clusters", type=int, default=7)
    ap.add_argument("--perplexity", type=float, default=10)
    ap.add_argument("--seed", type=int, default=298)
    ap.add_argument("--width", type=int, default=1400)
    ap.add_argument("--height", type=int, default=860)
    ap.add_argument("--min-size", type=int, default=24)
    ap.add_argument("--max-size", type=int, default=150)
    ap.add_argument("--pad", type=float, default=2.5)
    ap.add_argument("--font", default=None)
    a = ap.parse_args()

    data = json.loads(Path(a.vectors).read_text(encoding="utf-8"))
    rows = data["words"]
    words = [r["word"] for r in rows]
    M = np.array([r["vec"] for r in rows])
    U = M / np.linalg.norm(M, axis=1, keepdims=True)
    W, H = a.width, a.height

    # Sizes and measured text boxes (at BASE size, horizontal).
    counts = [r["count"] for r in rows]
    lo, hi = min(counts), max(counts)
    sizes = [a.max_size if hi == lo else a.min_size + (c - lo) / (hi - lo) * (a.max_size - a.min_size) for c in counts]
    sizes = [round(s, 1) for s in sizes]
    font_path = a.font or find_font()
    font = ImageFont.truetype(font_path, BASE)
    boxes, glyph = [], []
    for w in words:
        l, t, r, b = font.getbbox(w, anchor="ls")
        boxes.append((r - l, b - t))
        glyph.append({"dx": round(-(l + r) / 2, 1), "dy": round(-(t + b) / 2, 1), "len": r - l})

    # Clusters in the full space.
    raw = kmeans(U, a.clusters, a.seed)
    # Number clusters by their heaviest word's count so colour order is stable.
    weight = {c: sum(counts[i] for i in range(len(rows)) if raw[i] == c) for c in set(raw)}
    rank = {c: k for k, c in enumerate(sorted(weight, key=lambda c: -weight[c]))}
    labels = [rank[c] for c in raw]
    clusters = []
    for k in range(a.clusters):
        members = sorted([i for i in range(len(rows)) if labels[i] == k], key=lambda i: (-counts[i], words[i]))
        clusters.append({"id": k, "colour": PALETTE[k % len(PALETTE)], "size": len(members),
                         "name": " · ".join(words[i] for i in members[:3])})

    margin = (a.max_size * 1.3, a.max_size * 0.45)
    layouts, notes = {}, {}

    tsne = TSNE(n_components=2, metric="cosine", perplexity=a.perplexity, init="pca",
                random_state=a.seed, learning_rate="auto").fit_transform(U)
    pca, var = pca2(U)
    pca[:, 1] *= -1                             # SVG's y runs down; flip so PC2 runs up
    notes["pca_variance_explained"] = [round(float(v), 4) for v in var]

    for name, pts in (("tsne", tsne), ("pca", pca)):
        targets = fit(pts, W, H, margin)
        placed = pack(words, targets, sizes, boxes, W, H, a.pad)
        layouts[name] = [{**p, "size": sizes[i], "rot": 0} for i, p in enumerate(placed)]
        moved = [p["moved"] for p in placed]
        notes[f"{name}_moved_median_px"] = round(float(np.median(moved)), 1)
        notes[f"{name}_moved_max_px"] = round(float(max(moved)), 1)

    # A third t-SNE axis, for the rotating view. No packing: the page projects it
    # with perspective, and rotation is what separates words that overlap.
    t3 = TSNE(n_components=3, metric="cosine", perplexity=a.perplexity, init="pca",
              random_state=a.seed, learning_rate="auto").fit_transform(U)
    t3 = t3 - t3.mean(axis=0)
    # Scale so 95% of words fall inside the unit sphere. t-SNE can throw a word
    # far out (here *even*); pull any beyond 1.15 back to that radius, and say so.
    r = np.linalg.norm(t3, axis=1)
    t3 = t3 / np.percentile(r, 95)
    r = np.linalg.norm(t3, axis=1)
    far = r > 1.15
    t3[far] *= (1.15 / r[far])[:, None]
    notes["tsne3d_pulled_in"] = [[words[i], round(float(r[i]), 2)] for i in np.where(far)[0]]
    layouts["tsne3d"] = [{"X": round(float(x), 4), "Y": round(float(-y), 4), "Z": round(float(z), 4), "size": sizes[i]}
                         for i, (x, y, z) in enumerate(t3)]

    if a.wordle_layout:
        wl = json.loads(Path(a.wordle_layout).read_text())
        IW, IH = wl["image"]
        k = min(W / IW, H / IH)
        ox, oy = (W - IW * k) / 2, (H - IH * k) / 2
        by = {w["word"]: w for w in wl["words"]}
        layouts["wordle"] = []
        for i, w in enumerate(words):
            o = by.get(w)
            if o is None:
                layouts["wordle"].append({"x": W / 2, "y": H / 2, "size": 0.01, "rot": 0, "hidden": True})
                continue
            layouts["wordle"].append({"x": round(ox + (o["x"] + o["w"] / 2) * k, 1),
                                      "y": round(oy + (o["y"] + o["h"] / 2) * k, 1),
                                      "size": round(o["size"] * k, 1), "rot": -90 if o["rotated"] else 0})
        notes["wordle_scale"] = round(k, 4)

    out = {
        "source_vectors": a.vectors, "model": data["model"], "dimensions": data["dimensions"],
        "field": [W, H], "base_size": BASE, "font": Path(font_path).name, "seed": a.seed,
        "perplexity": a.perplexity, "clusters_k": a.clusters, "size_range": [a.min_size, a.max_size],
        "notes": notes, "clusters": clusters,
        "words": [{"word": r["word"], "count": r["count"], "cluster": labels[i], "glyph": glyph[i],
                   "route": r["route"], "keys": r["keys"],
                   "text_neighbours": r["text_neighbours"], "model_neighbours": r["model_neighbours"]}
                  for i, r in enumerate(rows)],
        "layouts": layouts,
    }
    Path(a.out).write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(words)} words, {a.clusters} clusters -> {a.out}")
    for c in clusters:
        print(f"  {c['colour']}  {c['size']:3d}  {c['name']}")
    print("  ", notes)


if __name__ == "__main__":
    main()
