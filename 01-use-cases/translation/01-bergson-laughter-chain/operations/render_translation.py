#!/usr/bin/env python3
"""Render a validated translation JSON as a responsive bilingual HTML page and Markdown companion."""
from html import escape
import json
import os
from pathlib import Path
import sys
from chain import CASE, read_inputs, validate_translation, validate_notes


def marked(text, notes, key):
    # Escape first, then mark exact quoted phrases; never insert model-authored HTML.
    result = escape(text)
    for note in notes:
        quote = escape(note[key])
        result = result.replace(quote, f'<a class="annotation" href="#note-{note["id"]}"><mark>{quote}</mark><sup>{note["id"]}</sup></a>', 1)
    return result


def render(path):
    path = Path(path)
    data = json.loads(path.read_text())
    inputs = read_inputs()
    validate_translation(data, inputs)
    validate_notes(data, data, inputs)
    pairs = list(zip(inputs['segments'], data['segments']))
    rows = []
    md = ['# Translating Bergson\n', '*Le Rire*, Chapter I · French → English\n',
          'A worked AI translation for discussion. Segment labels and notes are editorial.\n',
          '| Segment | French source | New English translation |', '|---|---|---|']
    for source, target in pairs:
        notes = [n for n in data['notes'] if n['segment'] == source['id']]
        rows.append(f'<article class="segment" aria-label="Segment {source["id"]}"><span class="segment-id">{source["id"]}</span><div class="source" lang="fr"><span class="mobile-label">French source</span><p>{marked(source["french"], notes, "source_quote")}</p></div><div class="translation"><span class="mobile-label">English translation</span><p>{marked(target["english"], notes, "english_quote")}</p></div></article>')
        refs = ''.join(f' [{n["id"]}]' for n in notes)
        md.append(f'| {source["id"]} | {source["french"].replace(chr(124), "&#124;")} | {target["english"].replace(chr(124), "&#124;")}{refs} |')
    note_html = []
    md += ['\n## Four choices to inspect\n']
    for note in data['notes']:
        md.append(f'{note["id"]}. **{note["segment"]}: {note["source_quote"]} → {note["english_quote"]}.** {note["text"]}\n')
        note_html.append(f'<div class="note" id="note-{note["id"]}" tabindex="-1"><b class="note-number">{note["id"]}</b><div><strong>{escape(note["source_quote"])} → {escape(note["english_quote"])}</strong><p>{escape(note["text"])}</p></div></div>')
    guide_href = Path(os.path.relpath(CASE / 'README.md', path.parent)).as_posix()
    source_url = inputs['sources']['french_url']
    reference_url = inputs['sources']['reference']['url']
    md += ['## Discuss\n', 'Which choice would you change—and what would your version gain or lose?\n',
           f'Source: [Bergson, French edition, 1938]({source_url}). Comparison: [Brereton and Rothwell, 1911]({reference_url}). Excerpt ends at “grandir et s’épanouir.”\n',
           'The live run, drafts, critique, and comparison are saved alongside this page. The translation and critique use the same model; the saved stages show each revision.\n']
    (path.parent/'annotated-translation.md').write_text('\n'.join(md))
    html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Translating Bergson · AI Humanities Lab</title>
<style>
* {{ box-sizing:border-box; }}
html {{ scroll-behavior:smooth; }}
body {{ color:#243d33; background:#f7f8f4; margin:0; font:18px/1.65 Georgia, 'Times New Roman', serif; }}
main {{ max-width:1160px; margin:auto; padding:60px 36px 48px; }}
header {{ border-top:5px solid #244d42; padding-top:24px; margin-bottom:32px; max-width:900px; }}
.kicker,.meta,.controls,.segment-id,.column-labels,.mobile-label,.question,footer,summary,.workflow {{ font-family:Arial,sans-serif; }}
.kicker {{ color:#365f52; font-size:12px; letter-spacing:2px; font-weight:bold; text-transform:uppercase; }}
h1 {{ font-size:clamp(38px,5vw,64px); font-weight:normal; margin:14px 0; line-height:1.06; letter-spacing:-1.5px; }}
.meta {{ font-size:14px; color:#5c665f; margin:0; }}
.intro {{ max-width:720px; margin:18px 0 0; font-size:19px; }}
.controls {{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin:24px 0; }}
button {{ font:14px Arial,sans-serif; color:#244d42; border:1px solid #b0c3b7; border-radius:30px; padding:10px 16px; background:white; cursor:pointer; }}
button:hover {{ background:#e7eee8; }}
button:focus-visible,a:focus-visible,summary:focus-visible {{ outline:3px solid #aa7119; outline-offset:4px; }}
.controls[hidden] {{ display:none; }}
.controls span {{ font-size:13px; color:#65736a; }}
.column-labels,.segment {{ display:grid; grid-template-columns:34px minmax(0,1fr) minmax(0,1fr); gap:24px; }}
.column-labels {{ color:#365f52; font-size:12px; text-transform:uppercase; letter-spacing:1.2px; border-bottom:2px solid #365f52; padding-bottom:12px; }}
.segment {{ padding:24px 0; border-bottom:1px solid #d6dfd6; }}
.segment-id {{ color:#738276; font-size:12px; padding-top:6px; }}
.segment p {{ margin:0; }} .source {{ color:#57655b; }}
.mobile-label {{ display:none; }}
mark {{ color:inherit; background:#f0e4b9; padding:1px 0; }}
.annotation {{ text-decoration:none; color:inherit; border-bottom:1px solid #bfa86b; }}
.annotation:hover mark {{ background:#e3cf87; }}
sup {{ font:11px Arial,sans-serif; color:#27624e; font-weight:bold; margin-left:2px; }}
h2 {{ font-size:30px; font-weight:normal; margin:44px 0 20px; line-height:1.2; }}
.notes {{ display:grid; grid-template-columns:1fr 1fr; gap:18px; font-size:16px; line-height:1.55; }}
.note {{ display:flex; gap:12px; padding:22px; background:white; border:1px solid #d9e1d7; border-radius:8px; scroll-margin-top:24px; }}
.note:target {{ border-color:#a78228; background:#fffbee; }}
.note-number {{ font:13px Arial,sans-serif; color:#244d42; border:1px solid #adc1b6; border-radius:50%; width:24px; height:24px; text-align:center; line-height:22px; flex-shrink:0; }}
.note p {{ margin:8px 0 0; }}
.question {{ border-left:4px solid #365f52; background:#e9f0e9; padding:22px 24px; font-size:16px; margin-top:32px; }}
details {{ border-top:1px solid #cbd6cd; padding:22px 0; margin-top:32px; }}
summary {{ font-size:15px; font-weight:bold; cursor:pointer; }}
.workflow {{ font-size:15px; line-height:1.7; max-width:800px; }}
.workflow ul {{ padding-left:20px; }}
footer {{ border-top:1px solid #cbd6cd; margin-top:20px; padding-top:20px; font-size:12px; line-height:1.6; color:#68736c; }}
a {{ color:inherit; }}
.english-only .source,.english-only .source-label {{ display:none; }}
.english-only .column-labels,.english-only .segment {{ grid-template-columns:34px minmax(0,1fr); }}
.english-only .segment {{ max-width:850px; }}
.no-highlights mark {{ background:transparent; }}
.no-highlights .annotation {{ border-bottom-color:transparent; }}
@media (max-width:700px) {{
 main {{ padding:28px 20px; }}
 header {{ margin-bottom:20px; }}
 .column-labels {{ display:none; }}
 .segment,.english-only .segment {{ grid-template-columns:28px minmax(0,1fr); gap:12px; padding:22px 0; }}
 .segment-id {{ grid-row:1 / span 2; }}
 .source,.translation {{ grid-column:2; }}
 .translation {{ margin-top:8px; }}
 .mobile-label {{ display:block; font-size:10px; color:#738276; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }}
 .notes {{ grid-template-columns:1fr; }}
 h2 {{ font-size:27px; }}
}}
@media (prefers-reduced-motion:reduce) {{ html {{ scroll-behavior:auto; }} }}
@media print {{ main {{ padding:0; }} .controls {{ display:none; }} }}
</style></head><body><main>
<header><div class="kicker">01 / Translation · AI Humanities Lab</div><h1>What does laughter mean?</h1><p class="meta">Henri Bergson · <i>Le Rire</i>, Chapter I · French → English</p><p class="intro">Read the French beside an AI translation. Follow a highlighted phrase to see the choice behind it—and decide what you would change.</p></header>
<div class="controls" hidden id="controls"><button type="button" id="source-toggle" aria-pressed="true">Hide French</button><button type="button" id="highlight-toggle" aria-pressed="true">Hide highlights</button><span>Highlighted phrases link to the notes below.</span></div>
<section aria-label="French source aligned with a new English translation"><div class="column-labels" aria-hidden="true"><span></span><span class="source-label">French source</span><span>New English translation</span></div>{''.join(rows)}</section>
<h2>Four choices to inspect</h2><section class="notes" aria-label="Translation annotations">{''.join(note_html)}</section>
<div class="question"><b>Your turn:</b> Which choice would you change—and what would your version gain or lose?</div>
<details><summary>From a source text to a readable page</summary><div class="workflow"><p>The French passage is the input. A chain of prompts produces a draft, a critique, a revision, and an annotated translation. A short Python script turns that result into this HTML page.</p><ul><li><a href="04-draft.md">Read the first draft</a> and <a href="06-revise-1.md">the revision</a>.</li><li><a href="07-compare.md">Compare with the published English translation</a>.</li><li><a href="review.md">Read the source-check and review notes</a>.</li><li><a href="{guide_href}">Try the use case</a>, then ask for a different way to present the result.</li></ul><p><b>The pattern to reuse:</b> inputs → operations → an HTML page someone else can read and explore.</p></div></details>
<footer>Source: <a href="{escape(source_url, quote=True)}">French edition, Félix Alcan, 1938</a>. Comparison: <a href="{reference_url}">Brereton &amp; Rothwell, 1911</a>.<br>Selection ends at “grandir et s’épanouir.” The translation and critique use the same model. Labels and notes record the editorial choices; the complete chain is saved alongside this page.</footer>
</main>
<script>
const controls = document.getElementById('controls');
controls.hidden = false;
document.getElementById('source-toggle').addEventListener('click', function() {{
 const hidden = document.body.classList.toggle('english-only');
 this.setAttribute('aria-pressed', String(!hidden));
 this.textContent = hidden ? 'Show French' : 'Hide French';
}});
document.getElementById('highlight-toggle').addEventListener('click', function() {{
 const hidden = document.body.classList.toggle('no-highlights');
 this.setAttribute('aria-pressed', String(!hidden));
 this.textContent = hidden ? 'Show highlights' : 'Hide highlights';
}});
</script></body></html>'''
    (path.parent/'annotated-translation.html').write_text(html)
    return path.parent/'annotated-translation.html'


if __name__ == '__main__':
    print(render(sys.argv[1]))
