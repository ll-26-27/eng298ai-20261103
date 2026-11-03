#!/usr/bin/env python3
"""Save a reproducible Pangram check of a Markdown essay (body only).

Uses Pangram's asynchronous inference API. Requires the same `markdown`
package as render_html.py. Credentials come from the environment or .env.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

import markdown

ENDPOINT = 'https://text.external-api.pangram.com/task'
REPO = Path(__file__).resolve().parents[5]
CASE = Path(__file__).resolve().parents[2]


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, text):
        self.parts.append(text)

    def handle_starttag(self, tag, attrs):
        if tag == 'br':
            self.parts.append(' ')


def extract_essay(source):
    body = re.sub(r'\A\s*# [^\n]+\n', '', source, count=1)
    body = re.split(r'^##\s+(?:Works Cited|References|Bibliography|Note on method|How this paper was written|Provenance)\s*$', body, maxsplit=1, flags=re.M | re.I)[0]
    paragraphs = []
    offset = 0
    for block in re.split(r'\n\s*\n', body.strip()):
        parser = PlainText()
        parser.feed(markdown.markdown(block))
        text = re.sub(r'\s+', ' ', ''.join(parser.parts)).strip()
        if not text:
            continue
        paragraphs.append({'paragraph': len(paragraphs) + 1, 'start': offset,
                           'end': offset + len(text), 'text': text})
        offset += len(text) + 2
    return '\n\n'.join(p['text'] for p in paragraphs), paragraphs


def get_key():
    key = os.environ.get('PANGRAM_API_KEY', '').strip()
    if key:
        return key
    env = REPO / '.env'
    if env.exists():
        for line in env.read_text().splitlines():
            match = re.match(r'^\s*(?:export\s+)?PANGRAM_API_KEY\s*=\s*(.*?)\s*$', line)
            if match:
                return match[1].strip('\'"')
    return ''


def save_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def request_json(url, key, payload=None):
    request = Request(url, data=json.dumps(payload).encode() if payload is not None else None,
                      headers={'x-api-key': key, 'Content-Type': 'application/json'})
    try:
        with urlopen(request, timeout=45) as response:
            return json.load(response)
    except HTTPError as error:
        # Do not copy request headers or provider error bodies into logs.
        explanations = {401: 'API key rejected', 402: 'insufficient Pangram credits',
                        403: 'access denied', 429: 'rate limit reached'}
        raise RuntimeError(f'Pangram HTTP {error.code}: {explanations.get(error.code, "request failed")}') from None
    except URLError as error:
        raise RuntimeError(f'Pangram network error: {error.reason}') from None


def paragraph_ids(window, text, paragraphs):
    start, end = window.get('start_index'), window.get('end_index')
    snippet = window.get('text', '')
    if not (isinstance(start, int) and isinstance(end, int) and
            0 <= start < end <= len(text) and text[start:end] == snippet):
        # Pangram can collapse blank lines in its returned text. Match the
        # words exactly after whitespace normalization, retaining an index
        # back to the submitted text. Never guess between repeated matches.
        chars, positions = [], []
        for match in re.finditer(r'\s+|\S+', text):
            token = match.group()
            if token.isspace():
                chars.append(' ')
                positions.append(match.start())
            else:
                chars.extend(token)
                positions.extend(range(match.start(), match.end()))
        normalized = ''.join(chars)
        needle = re.sub(r'\s+', ' ', snippet).strip()
        if not needle or normalized.count(needle) != 1:
            return []
        found = normalized.index(needle)
        start = positions[found]
        end = positions[found + len(needle) - 1] + 1
    return [p['paragraph'] for p in paragraphs if p['start'] < end and p['end'] > start]


def render_report(out, result, manifest, text, paragraphs):
    esc = lambda value: html.escape(str(value))
    metrics = ''.join(f'<li>{esc(field)}: <strong>{esc(result.get(field, "not returned"))}</strong></li>'
                      for field in ('fraction_ai', 'fraction_ai_assisted', 'fraction_human'))
    windows = []
    for i, window in enumerate(result.get('windows', []), 1):
        ids = paragraph_ids(window, text, paragraphs)
        label = f'Paragraphs {", ".join(map(str, ids))}' if ids else 'Paragraph alignment unavailable'
        windows.append(f'<section><h2>Window {i}: {esc(window.get("label", "unlabeled"))}</h2>'
                       f'<p>{esc(label)} · Confidence: {esc(window.get("confidence", "not returned"))}</p>'
                       f'<blockquote>{esc(window.get("text", ""))}</blockquote></section>')
    page = f'''<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pangram check — {esc(out.name)}</title>
<style>body{{max-width:850px;margin:3rem auto;padding:0 1rem;font:17px/1.6 Georgia,serif;color:#202020;background:#faf9f6}}h1,h2{{line-height:1.25}}h2{{font-size:1.2rem}}section{{border-top:1px solid #bbb;margin-top:2rem;padding-top:1rem}}blockquote{{margin:1rem 0;white-space:pre-wrap}}code{{overflow-wrap:anywhere;font-size:.8em}}a{{color:#8b1d24}}</style>
<h1>{esc(result.get('headline', 'Pangram result'))}</h1>
<p>Essay body: {manifest['word_count']} words. Pangram version: {esc(result.get('version', 'not returned'))}.
Run: {esc(manifest['created_at'])}.</p>
<p>{esc(result.get('prediction', ''))}</p><ul>{metrics}</ul>
<p>The fractions describe text classified by Pangram. The paper's argument and evidence are reviewed in the academic prose audit.</p>
<p>Paragraph locations match the returned wording to the submitted text, allowing for normalized whitespace.</p>
<p>Input SHA-256: <code>{manifest['input_sha256']}</code></p>
<p><a href="input.txt">Exact submitted text</a> · <a href="response.json">Raw response</a> · <a href="manifest.json">Run record</a></p>
{''.join(windows) if windows else '<p>No window-level results returned.</p>'}</html>'''
    (out / 'report.html').write_text(page)
    summary = f'''# Pangram check: {out.name}

- Status: completed
- Headline: {result.get('headline', 'not returned')}
- Prediction: {result.get('prediction_short', 'not returned')}
- Version: {result.get('version', 'not returned')}
- Body word count: {manifest['word_count']}
- Input SHA-256: `{manifest['input_sha256']}`
- fraction_ai: {result.get('fraction_ai', 'not returned')}
- fraction_ai_assisted: {result.get('fraction_ai_assisted', 'not returned')}
- fraction_human: {result.get('fraction_human', 'not returned')}

[Annotated result](report.html) · [Exact submitted text](input.txt) · [Raw response](response.json)
'''
    (out / 'summary.md').write_text(summary)


def run(args):
    out = args.out.resolve()
    if args.resume:
        manifest = json.loads((out / 'manifest.json').read_text())
        text = (out / 'input.txt').read_text()
        paragraphs = json.loads((out / 'paragraphs.json').read_text())
        if hashlib.sha256(text.encode()).hexdigest() != manifest['input_sha256']:
            raise RuntimeError('Saved input changed; create a new run directory.')
    else:
        if out.exists() and any(out.iterdir()):
            raise RuntimeError('Output directory is not empty; use a new path or --resume.')
        source = args.source.read_text()
        text, paragraphs = extract_essay(source)
        if not text:
            raise RuntimeError('The essay body is empty.')
        out.mkdir(parents=True, exist_ok=True)
        (out / 'input.txt').write_text(text)
        save_json(out / 'paragraphs.json', paragraphs)
        manifest = {'status': 'prepared', 'created_at': datetime.now(timezone.utc).isoformat(),
                    'source': str(args.source.resolve().relative_to(REPO)) if args.source.resolve().is_relative_to(REPO) else str(args.source.resolve()),
                    'source_sha256': hashlib.sha256(source.encode()).hexdigest(),
                    'input_sha256': hashlib.sha256(text.encode()).hexdigest(),
                    'word_count': len(re.findall(r"\b[\w]+(?:[’'-][\w]+)*\b", text)),
                    'scope': 'Essay body; title, bibliography and method note excluded; quotations retained.',
                    'endpoint': ENDPOINT, 'public_dashboard_link': False}
        save_json(out / 'manifest.json', manifest)
    if args.prepare_only:
        print(f'Prepared {manifest["word_count"]} words in {out}; no API call made.')
        return
    if manifest['status'] == 'completed':
        render_report(out, json.loads((out / 'response.json').read_text()), manifest, text, paragraphs)
        print(f'Rendered existing result: {out / "report.html"}')
        return
    key = get_key()
    if not key:
        raise RuntimeError('PANGRAM_API_KEY is missing. Add it to the ignored root .env, then rerun with --resume.')
    if not manifest.get('task_id'):
        submitted = request_json(ENDPOINT, key, {'text': text, 'public_dashboard_link': False})
        save_json(out / 'submission.json', submitted)
        if not submitted.get('task_id'):
            raise RuntimeError('Pangram did not return a task ID; inspect submission.json before retrying.')
        manifest.update(task_id=submitted['task_id'], status='submitted')
        save_json(out / 'manifest.json', manifest)
    deadline = time.monotonic() + args.wait_seconds
    while True:
        result = request_json(ENDPOINT + '/' + quote(manifest['task_id'], safe=''), key)
        save_json(out / 'last-poll.json', result)
        if result.get('stage') == 'STAGE_FAILED':
            manifest['status'] = 'failed'
            save_json(out / 'manifest.json', manifest)
            raise RuntimeError('Pangram task failed; inspect last-poll.json.')
        if result.get('stage') == 'STAGE_SUCCESS':
            save_json(out / 'response.json', result)
            manifest.update(status='completed', completed_at=datetime.now(timezone.utc).isoformat())
            save_json(out / 'manifest.json', manifest)
            render_report(out, result, manifest, text, paragraphs)
            print(f'{result.get("headline", "Completed")}; report: {out / "report.html"}')
            return
        if time.monotonic() >= deadline:
            raise RuntimeError('Task still processing. Resume with the same --out and --resume; no new submission is needed.')
        time.sleep(2)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, nargs='?', default=CASE / 'paper/final.md')
    parser.add_argument('--out', type=Path, required=True, help='A new directory for this draft/check')
    parser.add_argument('--prepare-only', action='store_true', help='Save exact input without calling Pangram')
    parser.add_argument('--resume', action='store_true', help='Resume saved task or submit prepared input')
    parser.add_argument('--wait-seconds', type=float, default=240)
    args = parser.parse_args()
    try:
        run(args)
    except (RuntimeError, OSError, ValueError) as error:
        parser.exit(1, str(error) + '\n')


if __name__ == '__main__':
    main()
