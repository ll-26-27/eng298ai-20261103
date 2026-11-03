#!/usr/bin/env python3
"""C3 — Build the page.

Puts the clouds, the text they were counted from, and the counts on one
self-contained HTML page, so a reader can check the picture against the
numbers and the numbers against the text. Deterministic code; no model.

Usage
  python3 C3_build-page.py --out ../paper/index.html \
      --main-svg ../paper/preface-wordle.svg --main-counts ../paper/preface-counts.json \
      --excerpt ../books/wilde-dorian-gray-preface.md \
      --second-svg ../paper/common-room-wordle.svg --second-counts ../paper/common-room-counts.json
"""
import argparse, html, json, re
from pathlib import Path


def svg_inline(path: Path) -> str:
    s = path.read_text(encoding="utf-8")
    # drop fixed width/height so CSS can size it; keep the viewBox
    s = re.sub(r'\s(width|height)="\d+"', "", s, count=2)
    return s


def excerpt_html(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"^---\n.*?\n---\n", "", text, flags=re.S)
    text = re.sub(r"^#+\s.*$", "", text, flags=re.M)
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    return "\n".join(f"<p>{html.escape(p)}</p>" for p in paras)


def counts_table(data: dict, n: int) -> str:
    rows = "\n".join(f"<tr><td>{html.escape(w['word'])}</td><td>{w['count']}</td></tr>" for w in data["words"][:n])
    return (f"<table><thead><tr><th>word</th><th>count</th></tr></thead><tbody>{rows}</tbody></table>")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--main-svg", required=True); ap.add_argument("--main-counts", required=True)
    ap.add_argument("--excerpt", required=True)
    ap.add_argument("--second-svg"); ap.add_argument("--second-counts")
    a = ap.parse_args()

    main_counts = json.loads(Path(a.main_counts).read_text())
    second = ""
    if a.second_svg:
        sc = json.loads(Path(a.second_counts).read_text())
        second = f"""
<h2>The same machine on something we made</h2>
<p class="intro">For contrast, the transcript of the <a href="../../../simulation/outputs/index.html">Common Room</a> simulation: four fictional committee members, twenty turns, no decision. Nothing here is from the course; it is the output of another use case, fed back in as an input.</p>
<figure class="cloud second">{svg_inline(Path(a.second_svg))}
<figcaption>{sc['tokens_total']} tokens, {sc['tokens_after_stop_words']} after stop words, top {min(100, sc['distinct_words'])} shown.</figcaption></figure>
<details><summary>The counts behind it</summary>{counts_table(sc, 40)}</details>
"""

    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wilde's Preface, as a Wordle</title>
<meta name="description" content="The Preface to The Picture of Dorian Gray laid out by a Python rewrite of Jonathan Feinberg's Wordle algorithm, with the counts beside it.">
<style>
:root {{ --ink:#243d33; --paper:#f7f8f4; --accent:#244d42; --muted:#5c665f; --rule:#cbd6cd; --card:#ffffff; --kicker:#365f52; }}
* {{ box-sizing:border-box; }}
body {{ color:var(--ink); background:var(--paper); margin:0; font:18px/1.65 Georgia, 'Times New Roman', serif; }}
main {{ max-width:1160px; margin:auto; padding:60px 36px 48px; }}
header {{ border-top:5px solid var(--accent); padding-top:24px; margin-bottom:32px; max-width:900px; }}
.kicker,.meta,figcaption,footer,summary,table,.steps {{ font-family:Arial,sans-serif; }}
.kicker {{ color:var(--kicker); font-size:12px; letter-spacing:2px; font-weight:bold; text-transform:uppercase; }}
h1 {{ font-size:clamp(38px,5vw,64px); font-weight:normal; margin:14px 0; line-height:1.06; letter-spacing:-1.5px; }}
h2 {{ font-size:30px; font-weight:normal; margin:44px 0 16px; line-height:1.2; }}
.meta {{ font-size:14px; color:var(--muted); margin:0; }}
.intro {{ max-width:720px; margin:18px 0 0; font-size:19px; }}
figure.cloud {{ margin:28px 0; background:var(--card); border:1px solid #d9e1d7; border-radius:8px; padding:18px; }}
figure.cloud svg {{ width:100%; height:auto; display:block; }}
figure.cloud svg text {{ cursor:default; }}
figure.cloud svg text:hover {{ opacity:.55; }}
figcaption {{ font-size:13px; color:var(--muted); margin-top:12px; }}
.two {{ display:grid; grid-template-columns:minmax(0,3fr) minmax(0,2fr); gap:36px; align-items:start; }}
.excerpt p {{ margin:0 0 1em; }}
.excerpt p:last-child {{ font-variant:small-caps; letter-spacing:1px; }}
table {{ border-collapse:collapse; font-size:14px; width:100%; max-width:360px; }}
th,td {{ text-align:left; padding:5px 10px; border-bottom:1px solid var(--rule); }}
td:last-child,th:last-child {{ text-align:right; font-variant-numeric:tabular-nums; }}
th {{ color:var(--kicker); font-size:11px; letter-spacing:1.2px; text-transform:uppercase; border-bottom:2px solid var(--kicker); }}
details {{ border-top:1px solid var(--rule); padding:18px 0; margin-top:12px; }}
summary {{ font-size:15px; font-weight:bold; cursor:pointer; }}
pre {{ background:var(--card); border:1px solid #d9e1d7; border-radius:8px; padding:16px 20px; font-size:14px; line-height:1.5; overflow:auto; }}
.steps {{ font-size:15px; line-height:1.7; max-width:800px; }}
.steps ol {{ padding-left:20px; }}
.caveat {{ border-left:4px solid var(--kicker); background:#e9f0e9; padding:18px 22px; font-size:16px; margin-top:28px; }}
footer {{ border-top:1px solid var(--rule); margin-top:36px; padding-top:20px; font-size:12px; line-height:1.6; color:var(--muted); }}
a {{ color:inherit; }}
@media (max-width:760px) {{ main {{ padding:28px 16px; }} .two {{ grid-template-columns:1fr; }} h2 {{ font-size:27px; }} }}
</style></head>
<body><main>
<header>
<p class="kicker">ENGLISH 298AI · _writing · 03 · word clouds</p>
<h1>All art is quite useless</h1>
<p class="meta">The Preface to <em>The Picture of Dorian Gray</em> (1891), counted and laid out by a Python rewrite of Jonathan Feinberg's Wordle (2008).</p>
<p class="intro">Wordle was a Java applet. You pasted text, clicked once, and got a cloud in which "words that appear more frequently in the source text" are bigger. Browsers stopped running Java and the site went dark, but Feinberg published the algorithm in 2010. This is it, run on the shortest text in the course that is complete in itself.</p>
</header>

<figure class="cloud">{svg_inline(Path(a.main_svg))}
<figcaption>{main_counts['tokens_total']} tokens in the Preface; {main_counts['tokens_after_stop_words']} after stop words; {main_counts['distinct_words']} distinct words, all shown. Size is count, on a linear scale. Colour means nothing. Hover a word for its count.</figcaption></figure>

<div class="two">
<section class="excerpt">
<h2>The text</h2>
{excerpt_html(Path(a.excerpt))}
</section>
<section>
<h2>The counts</h2>
{counts_table(main_counts, 30)}
<p class="meta" style="margin-top:10px">Everything after the thirtieth word appears once. The full list is in <code>preface-counts.json</code>.</p>
</section>
</div>

<h2>How Wordle works</h2>
<div class="steps">
<p>Feinberg's own summary, from <em>Beautiful Visualization</em> (2010), p. 52:</p>
<pre>For each word w in sorted words:
    placementStrategy.place(w)
    while w intersects any previously placed words:
        move w a little bit along a spiral path</pre>
<ol>
<li><strong>Count.</strong> A word is letters and digits, optionally joined by hyphens or apostrophes. Stop words come out. <em>Weight = word count.</em> (<code>operations/C1_count-words.py</code>)</li>
<li><strong>Lay out.</strong> Biggest word first. Each starts near the horizontal centre line, scattered at random, and walks out along a spiral until it touches nothing. The field's rectangle holds it in while the spiral is small. A "randomized greedy algorithm." (<code>operations/C2_lay-out-wordle.py</code>)</li>
<li><strong>Page.</strong> This file. (<code>operations/C3_build-page.py</code>)</li>
</ol>
<div class="caveat"><strong>How the visual encoding works.</strong> At the same frequency, a longer word occupies more space. Colour is assigned for visual variety. And "merely counting words does not permit meaningful comparisons of like texts": a cloud of every book of the New Testament is a page of "Lord." The size of <em>artist</em> here tells you that Wilde used the word eleven times in five hundred. It does not tell you what he thought of artists.</div>
</div>
{second}
<footer>
<p>Text: Oscar Wilde, <em>The Picture of Dorian Gray</em>, 1891 book edition, Project Gutenberg #174, via <code>context/course-readings/</code>. Public domain.<br>
Algorithm: Jonathan Feinberg, "Wordle," in <em>Beautiful Visualization</em>, ed. Julie Steele and Noah Iliinsky (Sebastopol, CA: O'Reilly, 2010), 37–58. The original tool, wordle.net (2008–), is offline; see <a href="https://teachdh.sdsu.edu/tools/wordle/">SDSU's Digital Humanities page on Wordle</a>.<br>
Built by Claude Code (Fable 5.1) with three Python scripts, November 3, 2026. Font: DejaVu Sans Bold. Seed 298.</p>
</footer>
</main></body></html>
"""
    Path(a.out).write_text(page, encoding="utf-8")
    print(f"wrote {a.out} ({len(page.encode()) // 1024} KB)")


if __name__ == "__main__":
    main()
