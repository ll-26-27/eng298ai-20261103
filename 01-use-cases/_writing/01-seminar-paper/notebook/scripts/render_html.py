#!/usr/bin/env python3
"""Render a markdown paper to a self-contained, print-ready HTML page.

usage: render_html.py <in.md> <out.html> [--title T] [--author A] [--course C] [--double]
"""
import argparse, html, re
from pathlib import Path
import markdown

CSS = """
:root{--ink:#1a1a1a;--muted:#5c5c5c;--rule:#d9d9d9;--bg:#fff;--accent:#8b0000}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--ink:#e8e6e1;--muted:#a8a49c;--rule:#333;--bg:#141414;--accent:#e07070}}
:root[data-theme=dark]{--ink:#e8e6e1;--muted:#a8a49c;--rule:#333;--bg:#141414;--accent:#e07070}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Source Serif 4","Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-size:12pt;line-height:LINEHEIGHT}
main{max-width:6.5in;margin:0 auto;padding:1in 16px}
header{text-align:center;margin-bottom:2em}
header h1{font-size:16pt;margin:0 0 .3em;font-weight:600;letter-spacing:.01em;line-height:1.35;text-wrap:balance}
header .byline{color:var(--muted);font-size:11pt}
header .byline span+span::before{content:" · "}
h2{font-size:12.5pt;font-weight:700;margin:1.8em 0 .4em;text-transform:none}
h3{font-size:12pt;font-weight:600;font-style:italic;margin:1.4em 0 .3em}
p{margin:0;text-indent:.5in;text-align:left;orphans:3;widows:3}
h2+p,h3+p,header+p,p.noindent{text-indent:0}
.paper-body>p:first-child{text-indent:0}
blockquote{margin:1em 0 1em .5in;padding:0;color:var(--ink);font-size:11.5pt;line-height:1.5}
blockquote p{text-indent:0}
ul,ol{margin:.5em 0 .5em .5in;padding:0}
li{margin:.2em 0}
table{border-collapse:collapse;margin:1em 0;font-size:11pt;width:100%}
th,td{border-bottom:1px solid var(--rule);padding:.3em .5em;text-align:left;vertical-align:top}
th{border-bottom:2px solid var(--ink)}
hr{border:0;border-top:1px solid var(--rule);margin:2em 0}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.works p{text-indent:-.5in;padding-left:.5in;margin-bottom:.5em;overflow-wrap:anywhere}
.provenance p{text-indent:0;margin-bottom:.7em}
code{font-size:.85em;overflow-wrap:anywhere}
.provenance{margin-top:3em;padding-top:1em;border-top:1px solid var(--rule);color:var(--muted);font-size:10.5pt;line-height:1.4}
@media print{body{font-size:12pt;background:#fff;color:#1a1a1a;--ink:#1a1a1a;--muted:#555;--rule:#ddd;--bg:#fff}main{padding:0;max-width:none}a{color:inherit}@page{margin:1in}}
"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--title"); ap.add_argument("--author", default="")
    ap.add_argument("--course", default=""); ap.add_argument("--date", default="")
    ap.add_argument("--double", action="store_true", help="double-space body (default 1.6)")
    a = ap.parse_args()
    md = Path(a.src).read_text()
    lines = md.splitlines()
    title = a.title
    if lines and lines[0].startswith("# "):
        title = title or lines[0][2:].strip()
        md = "\n".join(lines[1:])
    body = markdown.markdown(md, extensions=["extra", "smarty", "sane_lists", "toc"])
    # Give each section its own boundary: bibliography styles must not leak
    # into the method note. Keep the continuous essay in one article.
    sections = re.split(r'(?=<h2\b)', body)
    body = f'<article class="paper-body">{sections[0]}</article>'
    section_classes = {"works-cited": "works", "provenance": "provenance",
                       "how-this-paper-was-written": "provenance",
                       "note-on-method": "provenance"}
    for section in sections[1:]:
        heading = re.match(r'<h2\b[^>]*\bid="([^"]+)"', section)
        cls = section_classes.get(heading.group(1) if heading else "", "paper-section")
        body += f'\n<section class="{cls}">{section}</section>'
    title_html = markdown.markdown(html.escape(title or Path(a.src).stem))
    title_html = title_html.removeprefix("<p>").removesuffix("</p>")
    title_plain = re.sub(r'<[^>]+>', '', title_html)
    byline = "".join(f"<span>{html.escape(x)}</span>" for x in (a.author, a.course, a.date) if x)
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title_plain}</title>
<style>{CSS.replace('LINEHEIGHT', '2' if a.double else '1.6')}</style></head>
<body><main><header><h1>{title_html}</h1><div class="byline">{byline}</div></header>
{body}
</main></body></html>"""
    Path(a.out).write_text(page)
    print(f"wrote {a.out}")

if __name__ == "__main__":
    main()
