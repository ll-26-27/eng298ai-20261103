#!/usr/bin/env python3
"""Build LLM-readable paper Markdown from matching arXiv HTML editions.

Usage: python extract-ai-papers.py --source-dir /path/to/cached-html --pdf-dir /path/to/pdfs
Requires beautifulsoup4. HTML files are named <arxiv_id><version>.html.
PDFs retain the original long filenames; their hashes verify the source edition.
Downloads are separate so rebuilding never silently changes the source material.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urljoin
from bs4 import BeautifulSoup, NavigableString, Tag, Comment

ROOT = Path(__file__).resolve().parents[2]
PACK = ROOT / 'context' / 'LL-readings'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def compact(text):
    return re.sub(r'\s+', ' ', text.replace('\xa0', ' ').replace('\u200b', '').replace('\u00ad', '')).strip()


class Markdown:
    def __init__(self, source_url):
        self.url = source_url
        self.notes = []
        self.note_ids = {}
        self.note_marks = {}
        self.counts = Counter()

    def children(self, node):
        return ''.join(self.render(c) for c in node.children)

    def cell(self, node):
        return re.sub(r'\n\s*\n', '<br>', self.children(node).strip()).replace('\n', ' ').replace('|', '&#124;')

    def table(self, node):
        self.counts['tables'] += 1
        rows = [r for r in node.find_all('tr') if r.find_parent('table') is node]
        grid = []
        spans = {}
        for r, row in enumerate(rows):
            values = {}
            for (rr, cc), value in spans.items():
                if rr == r:
                    values[cc] = value
            c = 0
            for cell in row.find_all(['td', 'th'], recursive=False):
                while c in values:
                    c += 1
                value = self.cell(cell)
                cols = int(cell.get('colspan', 1))
                nrows = int(cell.get('rowspan', 1))
                for cc in range(c, c + cols):
                    values[cc] = value if cc == c else ''
                    for rr in range(r + 1, r + nrows):
                        spans[(rr, cc)] = value if cc == c and len(value) < 120 else ''
                c += cols
            if values:
                grid.append([values.get(c, '') for c in range(max(values) + 1)])
        if not grid or not any(any(row) for row in grid):
            return ''
        width = max(map(len, grid))
        grid = [row + [''] * (width - len(row)) for row in grid]
        if width == 1:
            return '\n\n' + '\n\n'.join(row[0].replace('<br>', '\n\n') for row in grid if row[0]) + '\n\n'
        output = ['| ' + ' | '.join(grid[0]) + ' |', '| ' + ' | '.join(['---'] * width) + ' |']
        output += ['| ' + ' | '.join(row) + ' |' for row in grid[1:]]
        return '\n\n' + '\n'.join(output) + '\n\n'

    def equation(self, node):
        rows = node.find_all('tr') if node.name == 'table' else [node]
        result = []
        for row in rows:
            math = row.find_all('math')
            if not math:
                # Preserve non-mathematical labels in equation layouts too.
                label = compact(row.get_text(' ', strip=True))
                if label:
                    result.append(label)
                continue
            tex = ' '.join(self.math(m) for m in math)
            tag = row.select_one('.ltx_tag_equation')
            if tag:
                tex += r' \tag{' + compact(tag.get_text()).strip('()') + '}'
            result.append('$$\n' + tex + '\n$$')
        return '\n\n' + '\n\n'.join(result) + '\n\n'

    def math(self, node):
        self.counts['math'] += 1
        annotation = node.find('annotation', attrs={'encoding': 'application/x-tex'})
        tex = node.get('alttext') or (annotation.get_text() if annotation else '')
        if not tex:
            raise ValueError('Math without a source TeX representation')
        return compact(tex)

    def render(self, node):
        if isinstance(node, Comment):
            return ''
        if isinstance(node, NavigableString):
            # HTML source line wraps are whitespace, never paragraph breaks.
            return re.sub(r'\s+', ' ', str(node).replace('\xa0', ' ').replace('\u200b', '').replace('\u00ad', ''))
        if not isinstance(node, Tag):
            return ''
        name = node.name
        classes = node.get('class', [])
        if name in ['script', 'style', 'nav', 'noscript']:
            return ''
        if 'ltx_note' in classes:
            content = node.select_one('.ltx_note_content')
            if content is None:
                return self.children(node)
            key = compact(content.get_text(' ', strip=True))
            mark_node = node.select_one('.ltx_note_mark')
            mark = compact(mark_node.get_text()) if mark_node else ''
            if 'ltx_role_footnotemark' in classes:
                number = self.note_marks.get(mark)
                if number is None and mark.isdigit() and 0 < int(mark) <= len(self.notes):
                    number = int(mark)
                return f'[^{number}]' if number is not None else mark
            if key in self.note_ids:
                return f'[^{self.note_ids[key]}]'
            number = len(self.notes) + 1
            self.note_ids[key] = number
            if mark:
                self.note_marks[mark] = number
            self.notes.append('')
            self.notes[number - 1] = self.children(content).strip()
            return f'[^{number}]'
        if 'ltx_note_mark' in classes or 'ltx_tag_note' in classes:
            return ''
        if 'ltx_tag_item' in classes and compact(node.get_text()) in ['•', '–', '◦', '▪']:
            return ''
        if name == 'math':
            tex = self.math(node)
            return '\n\n$$\n' + tex + '\n$$\n\n' if node.get('display') == 'block' else '$' + tex + '$'
        if name == 'table' and ('ltx_equation' in classes or 'ltx_equationgroup' in classes):
            return self.equation(node)
        if name == 'table':
            return self.table(node)
        if name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            self.counts['headings'] += 1
            level = int(name[1])
            if 'ltx_title_abstract' in classes or 'ltx_title_bibliography' in classes:
                level = 2
            return '\n\n' + '#' * level + ' ' + compact(self.children(node)) + '\n\n'
        if name == 'img' or name == 'object' and node.get('data'):
            self.counts['images'] += 1
            alt = compact(node.get('alt', ''))
            if not alt or alt == 'Refer to caption':
                alt = 'Figure image; see caption'
            return '\n\n![' + alt.replace('[', '').replace(']', '') + '](' + urljoin(self.url, node.get('src') or node.get('data', '')) + ')\n\n'
        if name == 'a':
            text = self.children(node).strip()
            href = node.get('href', '')
            # Keep source cross-reference labels; avoid hundreds of repeated URLs.
            if not href or href == 'mailto:' or '#' in href and not re.match(r'https?://', href):
                return text
            return f'[{text}]({urljoin(self.url, href)})' if text else ''
        if name == 'br':
            return '\n'
        if name == 'pre':
            return '\n\n```text\n' + node.get_text().strip() + '\n```\n\n'
        if name == 'code':
            return '`' + node.get_text().strip() + '`'
        if name in ['ul', 'ol']:
            return '\n\n' + self.children(node) + '\n\n'
        if name == 'li':
            self.counts['list_items'] += 1
            if 'ltx_bibitem' in classes:
                self.counts['references'] += 1
            content = self.children(node).strip()
            return '\n- ' + content.replace('\n', '\n  ') + '\n'
        if name == 'blockquote':
            return '\n\n' + '\n'.join('> ' + s for s in self.children(node).strip().splitlines()) + '\n\n'
        content = self.children(node)
        if name == 'figcaption':
            self.counts['captions'] += 1
            return '\n\n' + content.strip() + '\n\n'
        if name in ['b', 'strong'] or 'ltx_font_bold' in classes:
            return '**' + content.strip() + '**' if content.strip() else ''
        if name in ['i', 'em'] or 'ltx_font_italic' in classes:
            return '*' + content.strip() + '*' if content.strip() else ''
        if name == 'sup':
            return '^(' + content.strip() + ')'
        if name == 'sub':
            return '_(' + content.strip() + ')'
        if name in ['p', 'section', 'figure', 'article'] or 'ltx_para' in classes:
            return '\n\n' + content.strip() + '\n\n'
        if 'ltx_bibblock' in classes or 'ltx_creator' in classes:
            return content.strip() + ' '
        if name == 'div':
            return '\n\n' + content.strip() + '\n\n'
        return content

    def convert(self, article):
        text = self.render(article)
        if self.notes:
            text += '\n\n## Footnotes\n\n'
            for i, note in enumerate(self.notes, 1):
                text += f'[^{i}]: ' + note.replace('\n', '\n    ') + '\n\n'
        text = re.sub(r'[ \t]+\n', '\n', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip() + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--pdf-dir', type=Path, required=True)
    args = parser.parse_args()
    manifest = []
    pending = []
    for md in sorted((PACK / 'papers-on-ai-md').glob('*.md')):
        original = md.read_text()
        metadata = original.split('---', 2)[1]
        metadata = re.sub(r'^(source_html|text_format):.*\n', '', metadata, flags=re.M)
        version = md.name.split('--')[0]
        url = f'https://arxiv.org/html/{version}'
        source = args.source_dir / (version + '.html')
        soup = BeautifulSoup(source.read_text(), 'html.parser')
        article = soup.select_one('article.ltx_document')
        if article is None:
            raise ValueError(f'{version}: no full paper in HTML')
        for navigation in article.find_all('nav'):
            navigation.decompose()
        pdf = args.pdf_dir / (md.stem + '.pdf')
        pdf_hash = digest(pdf.read_bytes())
        expected = re.search(r'^sha256: "([0-9a-f]{64})"$', metadata, re.M).group(1)
        if pdf_hash != expected:
            raise ValueError(f'{version}: PDF version hash mismatch')
        converter = Markdown(url)
        body = converter.convert(article)
        seen_notes = set()
        expected_math = len(article.find_all('math'))
        for note in article.select('.ltx_note'):
            content = note.select_one('.ltx_note_content')
            if content is not None:
                key = compact(content.get_text(' ', strip=True))
                if key in seen_notes:
                    expected_math -= len(content.find_all('math'))
                seen_notes.add(key)
        if converter.counts['math'] != expected_math:
            raise ValueError(f'{version}: lost math ({converter.counts["math"]}/{expected_math})')
        expected_headings = len(article.find_all(re.compile('^h[1-6]$')))
        if converter.counts['headings'] != expected_headings:
            raise ValueError(f'{version}: lost section headings')
        for selector, key in [('.ltx_bibitem', 'references'), ('figcaption', 'captions'), ('img, object[data]', 'images')]:
            if len(article.select(selector)) != converter.counts[key]:
                raise ValueError(f'{version}: lost {key}')
        if len(body) < 15000:
            raise ValueError(f'{version}: unexpectedly short full text')
        result = '---' + metadata + f'source_html: "{url}"\ntext_format: "structured full-text Markdown with LaTeX math"\n---\n\n' + body
        info = subprocess.check_output(['pdfinfo', str(pdf)], text=True)
        pages = int(re.search(r'^Pages:\s+(\d+)', info, re.M).group(1))
        manifest.append({
            'markdown': str(md.relative_to(PACK)),
            'source_html': url,
            'source_html_sha256': digest(source.read_bytes()),
            'source_pdf': f'https://arxiv.org/pdf/{version}',
            'source_pdf_sha256': pdf_hash,
            'source_pdf_pages': pages,
            'source_headings': expected_headings,
            'source_math_expressions': expected_math,
            'converted': dict(converter.counts),
            'footnotes': len(converter.notes),
            'markdown_characters': len(result),
            'markdown_sha256': digest(result.encode()),
        })
        pending.append((md, result))
        print(version, f'{pages} PDF pages, {len(result):,} Markdown characters, {expected_headings} headings, {expected_math} equations/expressions', flush=True)
    for path, result in pending:
        path.write_text(result)
    (PACK / 'extraction-manifest.json').write_text(json.dumps({'method': 'Matching arXiv HTML edition converted to Markdown; source PDFs checked by SHA-256.', 'papers': manifest}, indent=2) + '\n')
    print(f'Wrote {len(pending)} cleaned full-text papers.')


if __name__ == '__main__':
    main()
