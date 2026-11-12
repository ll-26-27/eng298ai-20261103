#!/usr/bin/env python3
"""V3 — Build the page.

One self-contained HTML file: the cloud, three layouts to move between
(t-SNE, PCA, and the Wordle from ../03-word-clouds), the clusters as a legend,
and for any word you click its nearest neighbours in the Preface, its nearest
neighbours in the whole word2vec vocabulary, and the sentences it comes from.
Deterministic code; no model.

Usage
  python3 V3_build-page.py layout.json --excerpt ../inputs/wilde-dorian-gray-preface.md --out index.html
"""
import argparse, html, json, re
from pathlib import Path

WORD = re.compile(r"(?:[^\W_]|[@+])+(?:[-’']+(?:[^\W_]|[@+])+)*")


def text_of(path: Path) -> str:
    t = path.read_text(encoding="utf-8")
    t = re.sub(r"^---\n.*?\n---\n", "", t, flags=re.S)
    return re.sub(r"^#+\s.*$", "", t, flags=re.M).strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("layout")
    ap.add_argument("--excerpt", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    L = json.loads(Path(a.layout).read_text(encoding="utf-8"))
    text = text_of(Path(a.excerpt))
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    sentences = [s for p in paras for s in re.split(r"(?<=[.!?])\s+", p)]
    def marked(s, word):
        out, last = [], 0
        for m in WORD.finditer(s):
            if m.group(0).lower() == word:
                out += [html.escape(s[last:m.start()]), f"<mark>{html.escape(m.group(0))}</mark>"]
                last = m.end()
        return "".join(out) + html.escape(s[last:]) if out else None
    quotes = {w["word"]: [q for q in (marked(s, w["word"]) for s in sentences) if q] for w in L["words"]}
    unfound = [w for w, v in quotes.items() if not v]

    W, H = L["field"]
    B = L["base_size"]
    start = L["layouts"]["tsne"]
    g = []
    for i, w in enumerate(L["words"]):
        p = start[i]
        col = L["clusters"][w["cluster"]]["colour"]
        g.append(f'<g class="w" data-i="{i}" tabindex="0" role="button" aria-label="{html.escape(w["word"])}, {w["count"]}" '
                 f'style="transform:translate({p["x"]}px,{p["y"]}px) scale({p["size"] / B:.4f})">'
                 f'<text x="{w["glyph"]["dx"]}" y="{w["glyph"]["dy"]}" font-size="{B}" fill="{col}" '
                 f'textLength="{w["glyph"]["len"]}" lengthAdjust="spacingAndGlyphs">{html.escape(w["word"])}</text></g>')

    data = {"words": L["words"], "layouts": L["layouts"], "clusters": L["clusters"], "base": B,
            "quotes": quotes}
    legend = "".join(f'<button class="key" data-c="{c["id"]}"><i style="background:{c["colour"]}"></i>{html.escape(c["name"])}'
                     f'<span>{c["size"]}</span></button>' for c in L["clusters"])
    by_cluster = sorted(L["words"], key=lambda w: (w["cluster"], -w["count"], w["word"]))
    table = "".join(f'<tr><td>{html.escape(w["word"])}</td><td>{w["count"]}</td>'
                    f'<td>{html.escape(L["clusters"][w["cluster"]]["name"])}</td>'
                    f'<td>{html.escape(", ".join(n for n, _ in w["text_neighbours"][:3]))}</td>'
                    f'<td>{html.escape(", ".join(n for n, _ in w["model_neighbours"][:4]))}</td></tr>' for w in by_cluster)
    excerpt = "\n".join(f"<p>{html.escape(p)}</p>" for p in paras)
    n = L["notes"]
    routes = {}
    for w in L["words"]:
        routes.setdefault(w["route"], []).append(w["word"])
    route_note = "; ".join(f"{k}: {len(v)}" + ("" if k == "exact" else f" ({', '.join(v)})") for k, v in sorted(routes.items()))
    pv = n["pca_variance_explained"]

    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wilde's Preface, by Meaning</title>
<meta name="description" content="The words of the Preface to The Picture of Dorian Gray, placed by their word2vec vectors instead of at random, with size still set by count.">
<style>
:root {{ --ink:#243d33; --paper:#f7f8f4; --accent:#244d42; --muted:#5c665f; --rule:#cbd6cd; --card:#ffffff; --kicker:#365f52; --hi:#fff3c4; }}
* {{ box-sizing:border-box; }}
body {{ color:var(--ink); background:var(--paper); margin:0; font:18px/1.65 Georgia, 'Times New Roman', serif; }}
main {{ max-width:1240px; margin:auto; padding:60px 36px 48px; }}
header {{ border-top:5px solid var(--accent); padding-top:24px; margin-bottom:24px; max-width:900px; }}
.kicker,.meta,figcaption,footer,summary,table,.steps,.controls,.panel,.legend {{ font-family:Arial,sans-serif; }}
.kicker {{ color:var(--kicker); font-size:12px; letter-spacing:2px; font-weight:bold; text-transform:uppercase; }}
h1 {{ font-size:clamp(38px,5vw,64px); font-weight:normal; margin:14px 0; line-height:1.06; letter-spacing:-1.5px; }}
h2 {{ font-size:30px; font-weight:normal; margin:44px 0 16px; line-height:1.2; }}
.meta {{ font-size:14px; color:var(--muted); margin:0; }}
.intro {{ max-width:760px; margin:18px 0 0; font-size:19px; }}
.controls {{ display:flex; flex-wrap:wrap; gap:10px 18px; align-items:center; margin:8px 0 12px; font-size:14px; }}
.seg {{ display:inline-flex; border:1px solid var(--rule); border-radius:8px; overflow:hidden; background:var(--card); }}
.seg button {{ font:inherit; border:0; background:none; padding:8px 14px; cursor:pointer; color:var(--ink); }}
.seg button + button {{ border-left:1px solid var(--rule); }}
.seg button[aria-pressed=true] {{ background:var(--accent); color:#fff; }}
label.toggle {{ display:inline-flex; gap:6px; align-items:center; cursor:pointer; }}
.stage {{ display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:20px; align-items:start; }}
figure.cloud {{ margin:0; background:var(--card); border:1px solid #d9e1d7; border-radius:8px; padding:12px; }}
figure.cloud svg {{ width:100%; height:auto; display:block; font-family:'DejaVu Sans',Verdana,sans-serif; font-weight:bold; }}
.w {{ transition:transform .9s cubic-bezier(.6,0,.25,1), opacity .25s; cursor:pointer; outline:none; }}
.w:hover text, .w:focus-visible text {{ stroke:var(--ink); stroke-width:1.5px; paint-order:stroke; stroke-opacity:.25; }}
svg.dim .w {{ opacity:.13; }}
svg.dim .w.on {{ opacity:1; }}
svg.dim .w.sel {{ opacity:1; }}
.w.sel text {{ text-decoration:underline; text-decoration-thickness:6px; }}
#links line {{ stroke:var(--ink); stroke-opacity:.35; stroke-width:2; }}
#drift line {{ stroke:var(--muted); stroke-opacity:.45; stroke-width:1.2; }}
#drift circle {{ fill:var(--muted); fill-opacity:.7; }}
#drift.hide, #links.hide {{ display:none; }}
svg.live .w {{ transition:none; }}
svg.three {{ cursor:grab; }}
svg.three:active {{ cursor:grabbing; }}
#axes line {{ stroke:var(--rule); stroke-width:1.5; }}
#axes text {{ fill:var(--muted); font:13px Arial,sans-serif; }}
[hidden] {{ display:none !important; }}
figcaption {{ font-size:13px; color:var(--muted); margin-top:10px; }}
.legend {{ display:flex; flex-wrap:wrap; gap:6px; margin:12px 0 0; }}
.key {{ font:13px Arial,sans-serif; border:1px solid var(--rule); background:var(--card); color:var(--ink); border-radius:999px; padding:4px 10px; cursor:pointer; display:inline-flex; gap:6px; align-items:center; }}
.key i {{ width:10px; height:10px; border-radius:50%; display:inline-block; }}
.key span {{ color:var(--muted); }}
.key[aria-pressed=true] {{ border-color:var(--ink); box-shadow:inset 0 0 0 1px var(--ink); }}
.panel {{ background:var(--card); border:1px solid #d9e1d7; border-radius:8px; padding:18px 18px 8px; font-size:14px; line-height:1.5; position:sticky; top:16px; }}
.panel h3 {{ font:normal 30px/1.1 Georgia,serif; margin:0 0 4px; }}
.panel h4 {{ font-size:11px; letter-spacing:1.2px; text-transform:uppercase; color:var(--kicker); margin:16px 0 6px; }}
.panel .sub {{ color:var(--muted); margin:0; }}
.nb {{ display:grid; grid-template-columns:96px 1fr 38px; gap:6px; align-items:center; margin:3px 0; }}
.nb button {{ font:inherit; text-align:left; background:none; border:0; padding:0; color:var(--ink); cursor:pointer; text-decoration:underline; text-decoration-color:var(--rule); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }}
.bar {{ height:8px; background:#e6ece6; border-radius:4px; overflow:hidden; }}
.bar b {{ display:block; height:100%; background:var(--accent); border-radius:4px; }}
.nb span {{ text-align:right; font-variant-numeric:tabular-nums; color:var(--muted); }}
.model {{ color:var(--ink); }}
.quote {{ font:16px/1.5 Georgia,serif; margin:0 0 10px; padding-left:10px; border-left:3px solid var(--rule); }}
mark {{ background:var(--hi); color:inherit; padding:0 2px; }}
.two {{ display:grid; grid-template-columns:minmax(0,3fr) minmax(0,2fr); gap:36px; align-items:start; }}
.excerpt p {{ margin:0 0 1em; }}
.excerpt p:last-child {{ font-variant:small-caps; letter-spacing:1px; }}
.steps {{ font-size:15px; line-height:1.7; max-width:820px; }}
.steps ol {{ padding-left:20px; }}
.note {{ border-left:4px solid var(--kicker); background:#e9f0e9; padding:18px 22px; font-size:16px; margin-top:24px; }}
table {{ border-collapse:collapse; font-size:13px; width:100%; }}
th,td {{ text-align:left; padding:5px 8px; border-bottom:1px solid var(--rule); vertical-align:top; }}
th {{ color:var(--kicker); font-size:11px; letter-spacing:1.2px; text-transform:uppercase; border-bottom:2px solid var(--kicker); }}
td:nth-child(2) {{ text-align:right; font-variant-numeric:tabular-nums; }}
details {{ border-top:1px solid var(--rule); padding:18px 0; margin-top:12px; }}
summary {{ font-size:15px; font-weight:bold; cursor:pointer; }}
.tablewrap {{ overflow-x:auto; }}
footer {{ border-top:1px solid var(--rule); margin-top:36px; padding-top:20px; font-size:12px; line-height:1.6; color:var(--muted); }}
a {{ color:inherit; }}
@media (max-width:900px) {{ .stage {{ grid-template-columns:1fr; }} .panel {{ position:static; }} }}
@media (max-width:760px) {{ main {{ padding:28px 16px; }} .two {{ grid-template-columns:1fr; }} h2 {{ font-size:27px; }} }}
@media (prefers-reduced-motion:reduce) {{ .w {{ transition:none; }} }}
</style></head>
<body><main>
<header>
<p class="kicker">ENGLISH 298AI · _writing · 04 · vector word cloud</p>
<h1>Those who go beneath the surface</h1>
<p class="meta">The Preface to <em>The Picture of Dorian Gray</em> (1891), each word placed by its word2vec vector. Size is still the count.</p>
<p class="intro">In a Wordle, where a word lands is chance. Here it is placed by meaning, or at least by what three million words of Google News taught a 2013 neural network about meaning. Each word of the Preface is a point in a 300-dimensional space, and words used in similar contexts sit close together. That space is flattened to the page, and words of one colour are a cluster in the full space. Switch to <em>As Wordle placed them</em> to watch the same words go back to chance.</p>
</header>

<div class="controls">
<div class="seg" role="group" aria-label="Layout">
<button data-l="tsne" aria-pressed="true">By meaning · t-SNE</button><button data-l="pca" aria-pressed="false">By meaning · PCA</button><button data-l="tsne3d" aria-pressed="false">In 3D · t-SNE</button>{'<button data-l="wordle" aria-pressed="false">As Wordle placed them</button>' if 'wordle' in L['layouts'] else ''}
</div>
<label class="toggle"><input type="checkbox" id="drift-t"> Show where the vectors put each word</label>
<label class="toggle"><input type="checkbox" id="links-t" checked> Lines to nearest neighbours</label>
<label class="toggle" id="spin-l" hidden><input type="checkbox" id="spin-t" checked> Rotate (or drag to turn)</label>
</div>

<div class="stage">
<figure class="cloud">
<svg id="cloud" viewBox="0 0 {W} {H}" role="img" aria-label="Semantic word cloud of the Preface">
<g id="axes"></g><g id="drift" class="hide"></g><g id="links"></g>
{''.join(g)}
</svg>
<figcaption id="cap"></figcaption>
<div class="legend" aria-label="Clusters">{legend}</div>
</figure>
<aside class="panel" id="panel" aria-live="polite"></aside>
</div>

<div class="two">
<section class="excerpt">
<h2>The text</h2>
{excerpt}
</section>
<section class="steps">
<h2>How it works</h2>
<ol>
<li><strong>Count.</strong> The counts are exactly those of the <a href="../../03-word-clouds/outputs/index.html">Wordle page</a>: {len(L['words'])} words after stop words, with size set linearly by count.</li>
<li><strong>Embed.</strong> Each word is looked up in <code>{html.escape(L['model'])}</code>, the vectors Mikolov and colleagues released with word2vec in 2013: {L['dimensions']} numbers per word, learned by predicting words from their neighbours across about 100 billion words of news. Lookup routes: {html.escape(route_note)}. (<code>V1_embed-words.py</code>)</li>
<li><strong>Cluster.</strong> k-means with k = {L['clusters_k']} on the unit vectors, in all {L['dimensions']} dimensions. The colours show these clusters. Each legend entry is named after the cluster's three most frequent words.</li>
<li><strong>Flatten.</strong> <em>t-SNE</em> (cosine distance, perplexity {L['perplexity']:g}, seed {L['seed']}) keeps local neighbourhoods but not the distances between groups. <em>PCA</em> keeps the two directions of greatest spread, which hold {pv[0]*100:.1f}% and {pv[1]*100:.1f}% of the variance; the remaining {100-sum(pv)*100:.0f}% is flattened out. Each axis is stretched to fill the frame, so the axes have no units. <em>In 3D</em> runs t-SNE again with three output dimensions and draws it with perspective: nearer words are larger and darker. It is not packed, because turning it separates the words that overlap.{' The 3D view pulls in ' + ', '.join(f'<em>{html.escape(w)}</em> (from {r}× the radius)' for w, r in n.get('tsne3d_pulled_in', [])) + ', which t-SNE threw far from the rest, to the edge of the sphere.' if n.get('tsne3d_pulled_in') else ''}</li>
<li><strong>Pack.</strong> Biggest word first, each word starts at its projected point and walks out along Wordle's spiral until it overlaps nothing. Median distance walked: {n['tsne_moved_median_px']} px for t-SNE and {n['pca_moved_median_px']} px for PCA (largest {n['tsne_moved_max_px']} and {n['pca_moved_max_px']}) on a {W}-px-wide field. Tick <em>Show where the vectors put each word</em> to see the walk. (<code>V2_lay-out-semantic.py</code>)</li>
</ol>
<div class="note"><strong>What the neighbours measure.</strong> Similarity is cosine similarity between the vectors, so 1 means the same direction. It reflects the company a word keeps in news writing, not in Wilde. In Google News, <em>vice</em> sits next to <em>chairman</em> and <em>deputy</em>, not <em>virtue</em> (0.14). <em>Glass</em> sits next to <em>Plexiglas</em>, and <em>face</em> next to <em>confront</em>. Some pairs come out the way Wilde set them: <em>surface</em> and <em>beneath</em> (0.42), <em>useless</em> and <em>useful</em> (0.53), and <em>Caliban</em> beside Prospero. The lines and the neighbour lists use the full 300 dimensions. The picture is a flattening, and two words can look close on the page and be far apart in the space; click one to check.</div>
</section>
</div>

<details><summary>Every word as a table: cluster, nearest words in the Preface, nearest in the model</summary>
<div class="tablewrap"><table><thead><tr><th>word</th><th>count</th><th>cluster</th><th>nearest in the Preface</th><th>nearest in Google News</th></tr></thead><tbody>{table}</tbody></table></div>
</details>

<footer>
<p>Text: Oscar Wilde, <em>The Picture of Dorian Gray</em>, 1891 book edition, Project Gutenberg #174, via <code>context/course-readings/</code>. Public domain.<br>
Vectors: Tomas Mikolov, Kai Chen, Greg Corrado and Jeffrey Dean, "Efficient Estimation of Word Representations in Vector Space" (2013), and Mikolov et al., "Distributed Representations of Words and Phrases and their Compositionality," <em>NeurIPS</em> 2013; pretrained GoogleNews vectors, Apache 2.0, via gensim-data.<br>
Projection: L. van der Maaten and G. Hinton, "Visualizing Data using t-SNE," <em>JMLR</em> 9 (2008); scikit-learn. Packing spiral after Jonathan Feinberg, "Wordle," in <em>Beautiful Visualization</em> (O'Reilly, 2010).<br>
Built by Claude Code (Opus 5.5) with three Python scripts, November 3, 2026; 3D view added the same day. Font: DejaVu Sans Bold.{' Words not found in the text by the sentence matcher: ' + html.escape(', '.join(unfound)) + '.' if unfound else ''}</p>
</footer>
</main>
<script>
const D = {json.dumps(data, ensure_ascii=False)};
const svg = document.getElementById('cloud'), gs = [...svg.querySelectorAll('.w')];
const links = document.getElementById('links'), drift = document.getElementById('drift'), panel = document.getElementById('panel');
const NS = 'http://www.w3.org/2000/svg';
const idx = Object.fromEntries(D.words.map((w, i) => [w.word, i]));
let layout = 'tsne', sel = idx['artist'] ?? 0, cluster = null, timer = null, cur = [];
const W3 = {W}, H3 = {H}, R3 = Math.min(W3, H3) * 0.44, CAM = 3.2;
let yaw = 0.6, pitch = -0.3, raf = null, liveTimer = null, drag = null, dragged = false, tick = 0;
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const spin = document.getElementById('spin-t'), axes = document.getElementById('axes');
spin.checked = !reduce;
const CAPS = {{
  tsne: 'Placed by t-SNE on cosine distance between word2vec vectors. Size is count. Colour is a k-means cluster in the full 300 dimensions. Click a word for its neighbours.',
  pca: 'Placed by the first two principal components of the vectors. Size is count. Colour is the same k-means cluster.',
  tsne3d: 'The same t-SNE, run in three dimensions and left unpacked: turning it is what separates words that overlap. Drag to turn it. Nearer words are larger and darker. Size still scales with count, and the lines to neighbours still use all 300 dimensions.',
  wordle: 'The positions, sizes and rotations from the Wordle page (../03-word-clouds), rescaled. There, place and colour were random. The colours here are still the semantic clusters.'
}};
const el = (t, a) => {{ const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; }};
const esc = s => s.replace(/[&<>"]/g, c => ({{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}}[c]));

function proj(X, Y, Z) {{
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = X * cy + Z * sy, z1 = -X * sy + Z * cy;
  const y2 = Y * cp - z1 * sp, z2 = Y * sp + z1 * cp;
  const f = CAM / (CAM - z2);
  return {{x: W3 / 2 + x1 * R3 * f, y: H3 / 2 + y2 * R3 * f, z: z2, f}};
}}

function frame3d(order) {{
  cur = D.layouts.tsne3d.map(p => {{ const c = proj(p.X, p.Y, p.Z); c.size = p.size * 0.6 * c.f; return c; }});
  gs.forEach((g, i) => {{
    const c = cur[i];
    g.style.transform = `translate(${{c.x.toFixed(1)}}px,${{c.y.toFixed(1)}}px) scale(${{(c.size / D.base).toFixed(4)}})`;
    g.firstChild.style.opacity = (0.28 + 0.72 * (c.z + 1) / 2).toFixed(3);
  }});
  if (order) [...gs].sort((a, b) => cur[a.dataset.i].z - cur[b.dataset.i].z).forEach(g => svg.appendChild(g));
  axes.innerHTML = '';
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(([X, Y, Z]) => {{
    const a = proj(-X, -Y, -Z), b = proj(X, Y, Z);
    axes.append(el('line', {{x1: a.x, y1: a.y, x2: b.x, y2: b.y}}));
  }});
  drawLinks();
}}

function loop() {{
  if (spin.checked && !drag) yaw += 0.003;
  frame3d(++tick % 4 === 0);
  raf = requestAnimationFrame(loop);
}}

function place() {{
  cancelAnimationFrame(raf); clearTimeout(liveTimer); svg.classList.remove('live');
  const three = layout === 'tsne3d';
  svg.classList.toggle('three', three);
  svg.style.touchAction = three ? 'none' : '';
  document.getElementById('spin-l').hidden = !three;
  document.getElementById('drift-t').disabled = three;
  axes.innerHTML = '';
  if (three) {{
    document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.l === layout));
    document.getElementById('cap').textContent = CAPS[layout];
    drift.innerHTML = '';
    frame3d(false); links.innerHTML = '';
    liveTimer = setTimeout(() => {{ svg.classList.add('live'); loop(); }}, reduce ? 0 : 900);
    return;
  }}
  gs.forEach(g => g.firstChild.style.opacity = '');
  const P = cur = D.layouts[layout];
  gs.forEach((g, i) => {{
    const p = P[i];
    g.style.transform = `translate(${{p.x}}px,${{p.y}}px) rotate(${{p.rot || 0}}deg) scale(${{p.size / D.base}})`;
    g.style.visibility = p.hidden ? 'hidden' : '';
  }});
  document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.l === layout));
  document.getElementById('cap').textContent = CAPS[layout];
  links.innerHTML = ''; drift.innerHTML = '';
  clearTimeout(timer); timer = setTimeout(() => {{ drawDrift(); drawLinks(); }}, matchMedia('(prefers-reduced-motion:reduce)').matches ? 0 : 900);
}}

function drawDrift() {{
  drift.innerHTML = '';
  if (layout === 'wordle' || layout === 'tsne3d') return;
  D.layouts[layout].forEach(p => {{
    if (p.moved > 1) drift.append(el('line', {{x1: p.tx, y1: p.ty, x2: p.x, y2: p.y}}));
    drift.append(el('circle', {{cx: p.tx, cy: p.ty, r: 3}}));
  }});
}}

function drawLinks() {{
  links.innerHTML = '';
  if (sel == null || cluster != null) return;
  const a = cur[sel];
  D.words[sel].text_neighbours.forEach(([w]) => {{
    const b = cur[idx[w]];
    links.append(el('line', {{x1: a.x, y1: a.y, x2: b.x, y2: b.y}}));
  }});
}}

function highlight() {{
  const on = new Set();
  if (cluster != null) D.words.forEach((w, i) => w.cluster === cluster && on.add(i));
  else if (sel != null) {{ on.add(sel); D.words[sel].text_neighbours.forEach(([w]) => on.add(idx[w])); }}
  svg.classList.toggle('dim', on.size > 0);
  gs.forEach((g, i) => {{ g.classList.toggle('on', on.has(i)); g.classList.toggle('sel', i === sel && cluster == null); }});
  document.querySelectorAll('.key').forEach(k => k.setAttribute('aria-pressed', +k.dataset.c === cluster));
  drawLinks();
}}

function bars(list, clickable) {{
  return list.map(([w, s]) => `<div class="nb">${{clickable ? `<button data-w="${{esc(w)}}">${{esc(w)}}</button>` : `<span class="model" style="text-align:left">${{esc(w)}}</span>`}}<div class="bar"><b style="width:${{Math.max(0, s) * 100}}%"></b></div><span>${{s.toFixed(2)}}</span></div>`).join('');
}}

function show(i) {{
  const w = D.words[i], c = D.clusters[w.cluster];
  const quotes = (D.quotes[w.word] || []).map(q => `<p class="quote">${{q}}</p>`).join('');
  const route = w.route === 'exact' ? '' : ` · looked up as ${{w.keys.map(esc).join(' + ')}} (${{esc(w.route)}})`;
  panel.innerHTML = `<h3>${{esc(w.word)}}</h3>
    <p class="sub">${{w.count}} × in the Preface · <i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${{c.colour}}"></i> ${{esc(c.name)}}${{route}}</p>
    <h4>Nearest in the Preface</h4>${{bars(w.text_neighbours, true)}}
    <h4>Nearest in Google News</h4>${{bars(w.model_neighbours, false)}}
    <h4>Where Wilde uses it</h4>${{quotes || '<p class="sub">Not matched in a sentence.</p>'}}`;
  panel.querySelectorAll('button[data-w]').forEach(b => b.onclick = () => select(idx[b.dataset.w]));
}}

function select(i) {{ sel = i; cluster = null; show(i); highlight(); }}

gs.forEach((g, i) => {{
  g.addEventListener('click', () => {{ if (!dragged) select(i); }});
  g.addEventListener('keydown', e => {{ if (e.key === 'Enter' || e.key === ' ') {{ e.preventDefault(); select(i); }} }});
  g.append(Object.assign(document.createElementNS(NS, 'title'), {{textContent: `${{D.words[i].word}} · ${{D.words[i].count}}`}}));
}});
document.querySelectorAll('.seg button').forEach(b => b.onclick = () => {{ layout = b.dataset.l; place(); }});
document.querySelectorAll('.key').forEach(k => k.onclick = () => {{ cluster = cluster === +k.dataset.c ? null : +k.dataset.c; highlight(); }});
document.getElementById('drift-t').onchange = e => drift.classList.toggle('hide', !e.target.checked);
document.getElementById('links-t').onchange = e => links.classList.toggle('hide', !e.target.checked);
svg.addEventListener('click', e => {{ if (e.target === svg && !dragged) {{ sel = null; cluster = null; highlight(); }} }});
svg.addEventListener('pointerdown', e => {{
  dragged = false;
  if (layout === 'tsne3d') drag = {{x: e.clientX, y: e.clientY, yaw, pitch}};
}});
addEventListener('pointermove', e => {{
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
  yaw = drag.yaw + dx * 0.008;
  pitch = Math.max(-1.4, Math.min(1.4, drag.pitch - dy * 0.008));
}});
addEventListener('pointerup', () => {{ drag = null; }});
place(); select(sel);
</script>
</body></html>
"""
    Path(a.out).write_text(page, encoding="utf-8")
    print(f"wrote {a.out} ({len(page.encode()) // 1024} KB); {len(sentences)} sentences; unmatched: {unfound or 'none'}")


if __name__ == "__main__":
    main()
