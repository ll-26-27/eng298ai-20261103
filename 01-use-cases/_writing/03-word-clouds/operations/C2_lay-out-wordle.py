#!/usr/bin/env python3
"""C2 — Lay the words out, the way Wordle did.

A Python rewrite of the layout half of Jonathan Feinberg's Wordle (2008),
following his own description in "Wordle," chapter 3 of *Beautiful
Visualization* (O'Reilly, 2010), pp. 49–54. His Java applet is gone from the
web; this is the algorithm he published, with Java2D replaced by Pillow.

  "Example 3-3. The secret Wordle algorithm revealed at last!
     For each word w in sorted words:
         placementStrategy.place(w)
         while w intersects any previously placed words:
             move w a little bit along a spiral path"

What is kept from his account:
  * weight = word count, normalized to a font size (linear, not square root:
    "scaling by the square root ... simply makes a Wordle look boring");
  * each word becomes a glyph shape at that size, here a bitmap mask;
  * the playing field is estimated from the summed bounding-box areas,
    proportioned to the target aspect ratio, and at least as big as the
    longest word;
  * words are placed in descending weight, biggest first ("greedy"), from a
    random start near the horizontal centre line ("randomized"), moving out
    along an Archimedean spiral until nothing intersects, with the field's
    rectangle as a soft constraint (Example 3-4);
  * the intersection test "swells" the shape a little so that the gap between
    words comes "for free";
  * colour "means absolutely nothing"; it is drawn from a palette at random.

What is different: Wordle tested spline outlines through hierarchical bounding
boxes and a quadtree; this tests pixel masks against one occupancy grid, which
is slower but shorter, and the result is the same picture. Fonts are whatever
TrueType file you point at; the default is DejaVu Sans Bold, which ships with
matplotlib, so the run is reproducible on any machine with the seed.

Deterministic code. No model is involved.

Usage
  python3 C2_lay-out-wordle.py counts.json --png out.png --svg out.svg
      [--max-words 100] [--width 1600 --height 1000] [--font FILE.ttf]
      [--layout mostly-horizontal|horizontal|vertical|half-and-half|any-which-way]
      [--placement centre-line|alphabetical] [--palette NAME] [--background #fff]
      [--seed 298] [--gap 3] [--min-size 14 --max-size 160]
"""
import argparse, json, math, random, sys
from pathlib import Path
from xml.sax.saxutils import escape

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Palettes. Wordle shipped named palettes of its own; these are ours, chosen to
# read on a white page. --palette NAME or a comma list of hex colours.
PALETTES = {
    "ink-and-brick": ["#1f2a44", "#9b2d20", "#2f6b5a", "#b88424", "#4a4a4a"],
    "wilde": ["#3b2d5c", "#8a2a45", "#2a6b6e", "#a8742e", "#1e1e1e"],
    "committee": ["#243d33", "#5c665f", "#aa7119", "#244d42", "#8b3a3a"],
    "greys": ["#111111", "#333333", "#555555", "#777777"],
}
ROTATION_SHARE = {"horizontal": 0.0, "mostly-horizontal": 0.25, "half-and-half": 0.5,
                  "mostly-vertical": 0.75, "vertical": 1.0, "any-which-way": None}


def find_default_font() -> str:
    try:
        import matplotlib
        p = Path(matplotlib.__file__).parent / "mpl-data/fonts/ttf/DejaVuSans-Bold.ttf"
        if p.exists():
            return str(p)
    except ImportError:
        pass
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/System/Library/Fonts/Supplemental/Verdana Bold.ttf", "C:/Windows/Fonts/verdanab.ttf"]:
        if Path(p).exists():
            return p
    sys.exit("No font found; pass --font FILE.ttf")


class WordShape:
    """Feinberg's Example 3-2: a word at a weight becomes a shape. Here, a mask."""

    def __init__(self, word, size, font_path, rotated, gap):
        self.word, self.size, self.rotated = word, size, rotated
        font = ImageFont.truetype(font_path, size)
        l, t, r, b = font.getbbox(word, anchor="ls")   # relative to the baseline origin
        self.text_w, self.text_h = r - l, b - t
        self.baseline_dx, self.baseline_dy = -l, -t      # where the baseline origin sits inside the box
        pad = gap
        img = Image.new("L", (self.text_w + 2 * pad, self.text_h + 2 * pad), 0)
        ImageDraw.Draw(img).text((pad - l, pad - t), word, font=font, fill=255, anchor="ls")
        self.glyph = img                                  # unrotated, with a transparent pad
        swollen = img.filter(ImageFilter.MaxFilter(2 * gap + 1)) if gap else img
        if rotated:
            img, swollen = img.rotate(90, expand=True), swollen.rotate(90, expand=True)
        self.mask = np.array(swollen) > 0
        self.h, self.w = self.mask.shape

    @property
    def area(self):
        return self.w * self.h


def estimate_field(shapes, aspect):
    """Feinberg p. 50: sum the bounding boxes, fudge, proportion to the aspect ratio,
    and never smaller than the longest word."""
    area = sum(s.area for s in shapes) * 1.35
    w = math.sqrt(area * aspect)
    h = area / w
    w = max(w, max(s.w for s in shapes) * 1.05)
    h = max(h, max(s.h for s in shapes) * 1.05)
    return int(w), int(h)


def spiral(cx, cy, step=2.0, turn=0.28):
    """An Archimedean spiral from (cx, cy): r grows with the angle."""
    t = 0.0
    while True:
        r = step * t
        yield cx + r * math.cos(t), cy + r * math.sin(t), r
        t += turn / (1 + 0.02 * r)        # smaller angular steps as the radius grows


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("counts")
    ap.add_argument("--png"); ap.add_argument("--svg"); ap.add_argument("--layout-json")
    ap.add_argument("--max-words", type=int, default=100)
    ap.add_argument("--width", type=int, default=1600); ap.add_argument("--height", type=int, default=1000)
    ap.add_argument("--font", default=None)
    ap.add_argument("--font-family", default="DejaVu Sans, Verdana, sans-serif",
                    help="CSS font-family written into the SVG; should match --font")
    ap.add_argument("--layout", default="mostly-horizontal", choices=list(ROTATION_SHARE))
    ap.add_argument("--placement", default="centre-line", choices=["centre-line", "alphabetical"])
    ap.add_argument("--palette", default="ink-and-brick")
    ap.add_argument("--background", default="#ffffff")
    ap.add_argument("--seed", type=int, default=298)
    ap.add_argument("--gap", type=int, default=3, help="pixels the mask is swollen by; the gap between words")
    ap.add_argument("--min-size", type=int, default=14); ap.add_argument("--max-size", type=int, default=160)
    ap.add_argument("--margin", type=int, default=40)
    a = ap.parse_args()

    rng = random.Random(a.seed)
    font_path = a.font or find_default_font()
    palette = PALETTES.get(a.palette) or a.palette.split(",")
    data = json.loads(Path(a.counts).read_text())
    words = data["words"][: a.max_words]
    if not words:
        sys.exit("no words")

    # Weight -> font size. Linear, as Feinberg insists; the scale is arbitrary.
    counts = [w["count"] for w in words]
    lo, hi = min(counts), max(counts)
    def size_for(c):
        return a.max_size if hi == lo else int(round(a.min_size + (c - lo) / (hi - lo) * (a.max_size - a.min_size)))

    share = ROTATION_SHARE[a.layout]
    shapes = []
    for w in words:                          # already sorted by count, descending
        rotated = rng.random() < (0.5 if share is None else share)   # any-which-way: 0° or 90° only; Wordle did more
        shapes.append(WordShape(w["word"], size_for(w["count"]), font_path, rotated, a.gap))

    field_w, field_h = estimate_field(shapes, a.width / a.height)
    # One guard of ours: a rotated word taller than the field has nowhere to go
    # but out, so it lies down. Feinberg's field is sized for the longest word only.
    for i, s in enumerate(shapes):
        if s.rotated and s.h > 0.8 * field_h:
            shapes[i] = WordShape(s.word, s.size, font_path, False, a.gap)
    # The occupancy grid is larger than the field: Example 3-4 lets words leave
    # the rectangle once the spiral has grown "smallish" past it.
    slack = max(field_w, field_h) // 2
    grid_w, grid_h = field_w + 2 * slack, field_h + 2 * slack
    occupied = np.zeros((grid_h, grid_w), dtype=bool)
    fx0, fy0 = slack, slack                 # the field's origin inside the grid
    cx, cy = fx0 + field_w / 2, fy0 + field_h / 2

    alphabetical = sorted(range(len(shapes)), key=lambda i: shapes[i].word)
    rank = {i: k for k, i in enumerate(alphabetical)}

    placed = []
    for i, s in enumerate(shapes):
        # placementStrategy.place(w): near the centre line, scattered at random.
        if a.placement == "alphabetical":
            px = fx0 + (rank[i] + 0.5) / len(shapes) * field_w
        else:
            px = cx + rng.gauss(0, field_w / 6)
        py = cy + rng.gauss(0, field_h / 6)
        smallish = max(field_w, field_h) * 0.6
        done = False
        # Example 3-4: stay inside the rectangle while the spiral is "smallish".
        # If that never works, Wordle "relaxes that constraint"; we then walk the
        # same spiral again from the same start, taking the first free spot.
        for constrained in (True, False):
            for x, y, r in spiral(px, py):
                X, Y = int(x - s.w / 2), int(y - s.h / 2)
                if constrained and r > smallish:
                    break
                if X < 0 or Y < 0 or X + s.w > grid_w or Y + s.h > grid_h:
                    if r > 2 * slack:
                        break
                    continue
                inside = fx0 <= X and fy0 <= Y and X + s.w <= fx0 + field_w and Y + s.h <= fy0 + field_h
                if constrained and not inside:
                    continue
                if not (occupied[Y:Y + s.h, X:X + s.w] & s.mask).any():
                    occupied[Y:Y + s.h, X:X + s.w] |= s.mask
                    placed.append((s, X, Y, rng.choice(palette)))
                    done = True
                    break
            if done:
                break
        if not done:
            print(f"could not place {s.word!r}", file=sys.stderr)

    # Crop to what was placed, plus a margin.
    x0 = min(X for _, X, _, _ in placed) - a.margin; y0 = min(Y for _, _, Y, _ in placed) - a.margin
    x1 = max(X + s.w for s, X, _, _ in placed) + a.margin; y1 = max(Y + s.h for s, _, Y, _ in placed) + a.margin
    W, H = x1 - x0, y1 - y0

    if a.png:
        img = Image.new("RGB", (W, H), a.background)
        for s, X, Y, colour in placed:
            g = s.glyph.rotate(90, expand=True) if s.rotated else s.glyph
            img.paste(Image.new("RGB", g.size, colour), (X - x0, Y - y0), g)
        img.save(a.png)

    if a.svg:
        out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
               f'font-family="{escape(a.font_family)}" font-weight="bold">',
               f'<rect width="100%" height="100%" fill="{a.background}"/>']
        by_word = {w["word"]: w["count"] for w in words}
        for s, X, Y, colour in placed:
            gx, gy = X - x0, Y - y0                           # top-left of the (rotated) box
            bw, bh = s.glyph.size                             # unrotated box
            title = f"<title>{escape(s.word)} · {by_word[s.word]}</title>"
            if s.rotated:
                # The unrotated box, centred where the rotated one is, then turned 90° anticlockwise.
                ux, uy = gx + (s.w - bw) / 2, gy + (s.h - bh) / 2
                tx, ty = ux + a.gap + s.baseline_dx, uy + a.gap + s.baseline_dy
                out.append(f'<text x="{tx:.1f}" y="{ty:.1f}" font-size="{s.size}" fill="{colour}" '
                           f'textLength="{s.text_w}" lengthAdjust="spacingAndGlyphs" '
                           f'transform="rotate(-90 {gx + s.w / 2:.1f} {gy + s.h / 2:.1f})">{title}{escape(s.word)}</text>')
            else:
                tx, ty = gx + a.gap + s.baseline_dx, gy + a.gap + s.baseline_dy
                out.append(f'<text x="{tx:.1f}" y="{ty:.1f}" font-size="{s.size}" fill="{colour}" '
                           f'textLength="{s.text_w}" lengthAdjust="spacingAndGlyphs">{title}{escape(s.word)}</text>')
        out.append("</svg>")
        Path(a.svg).write_text("\n".join(out), encoding="utf-8")

    if a.layout_json:
        Path(a.layout_json).write_text(json.dumps({
            "source_counts": a.counts, "font": font_path, "seed": a.seed, "layout": a.layout,
            "placement": a.placement, "palette": palette, "field": [field_w, field_h], "image": [W, H],
            "words": [{"word": s.word, "size": s.size, "rotated": s.rotated, "x": X - x0, "y": Y - y0,
                       "w": s.w, "h": s.h, "colour": c} for s, X, Y, c in placed],
        }, indent=1), encoding="utf-8")
    print(f"placed {len(placed)}/{len(shapes)} words on a {field_w}x{field_h} field; image {W}x{H}; font {Path(font_path).name}")


if __name__ == "__main__":
    main()
