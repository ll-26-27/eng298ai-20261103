#!/usr/bin/env python3
"""Render one saved conversation as Markdown and a standalone HTML page."""
from html import escape
import json
import os
from pathlib import Path
import re

CASE = Path(__file__).resolve().parents[1]
REPO = CASE.parents[1]


def link_from(out, target):
    return Path(os.path.relpath(target, out)).as_posix()


def render(path, case=None):
    case = case or CASE
    data = json.loads(path.read_text(encoding='utf-8'))
    if data['status'] != 'complete':
        raise ValueError('Only complete runs can be published as finished transcripts.')
    out = path.parent
    people = {p['id']: p for p in data['personas']}
    colors = ['#20635b', '#964618', '#63478a', '#2b5a8a', '#835324', '#7c3c58']
    color = {p: colors[i % len(colors)] for i, p in enumerate(people)}
    e = lambda value: escape(str(value), quote=True)
    guide = link_from(out, case/'README.md')
    event_label = data['config'].get('event_label', 'World event')
    md = [f'# {data["title"]}: conversation\n',
          f'Fictional, model-generated meeting · {len(data["turns"])} total turns · {len(people)} personas.\n',
          f'Model requested: `{data["model_requested"]}`. Created: {data["created"]}.\n',
          'Each turn was generated in a separate API call. The dialogue follows authored personas, selected readings and a shared scenario. The complete request and response record accompanies it.\n',
          f'[HTML view](index.html) · [Complete run data](conversation.json) · [Workshop guide]({guide})\n',
          '## Starting situation\n', data['scenario'].split('\n',1)[1].strip()+'\n']
    articles = []
    for turn in data['turns']:
        events = [event for event in data['events'] if event['turn'] == turn['number']]
        for event in events:
            md += [f'### {event_label} before turn {turn["number"]}: {event["title"]}\n', event['text']+'\n']
            articles.append(f'<aside class="event"><span class="eyebrow">{e(event_label)} · before turn {turn["number"]:02d}</span><h3>{e(event["title"])}</h3><p>{e(event["text"])}</p><small>Authored scenario input, revealed at this turn.</small></aside>')
        cites = ', '.join(turn['cites']) or 'none'
        supplied = ', '.join(f'{c["id"]} (score {c["score"]})' for c in turn['supplied_cards'])
        md += [f'## {turn["number"]:02d} · {turn["name"]}\n', turn['utterance']+'\n',
               f'*Cards cited: {cites}. Cards supplied: {supplied}.*\n',
               '<details>\n<summary>Continuity memo for this persona’s next turn</summary>\n', turn['memory']+'\n', '</details>\n']
        cards = []
        for card in turn['supplied_cards']:
            cited = card['id'] in turn['cites']
            source = ('Authored workshop material' if card['source'] == 'authored' else
                      f'<a href="{e(link_from(out, REPO/card["source"]))}">Read source</a>')
            cards.append(f'''<section class="knowledge-card"><div class="card-label">{e(card['id'])} · {'Cited by speaker' if cited else 'Supplied, not cited'} <span>keyword score {card['score']}</span></div>
<h4>{e(card['title'])}</h4><blockquote>{e(card['quote'])}</blockquote><p class="locator">{e(card['locator'])} · {source}</p><p><b>Workshop reading:</b> {e(card['reading'])}</p></section>''')
        articles.append(f'''<article class="turn" data-speaker="{e(turn['speaker'])}" style="--speaker:{color[turn['speaker']]}" id="turn-{turn['number']}">
<div class="turn-meta"><a href="#turn-{turn['number']}" class="turn-number" aria-label="Turn {turn['number']}">{turn['number']:02d}</a><strong>{e(turn['name'])}</strong><span>{e(people[turn['speaker']]['role'])}</span></div>
<div class="speech"><p class="utterance">{e(turn['utterance'])}</p><p class="citations">Cards cited: {e(cites)}</p>
<details class="inspect"><summary>See this turn’s inputs &amp; memo</summary><p class="explain">The speaker received the shared conversation, revealed events, its own persona and memo, and these {len(turn['supplied_cards'])} cards. Citations record which supplied cards the speaker used. Open the source to follow the connection.</p>{''.join(cards)}
<div class="memo"><h4>Previous memo</h4><p>{e(turn['memory_before']) if turn['memory_before'] else 'First turn: no previous memo.'}</p><h4>Memo saved for next turn</h4><p>{e(turn['memory'])}</p><small>A short continuity record, visible here for inspection.</small></div>
<p class="raw-link"><a href="raw/{turn['number']:02d}-request.json">Exact request</a> · <a href="conversation.json">Complete run data</a></p></details></div></article>''')
    md += ['## Knowledge-card key\n', 'Quotes were checked against their source files before the run. “Reading” is a workshop interpretation, not part of the quotation.\n']
    for person in data['personas']:
        for card in person['cards']:
            source = 'Authored workshop material' if card['source']=='authored' else f'[Source]({link_from(out, REPO/card["source"])})'
            md += [f'### {card["id"]} · {card["title"]} ({person["name"]})\n', '> '+card['quote'].replace('\n','\n> ')+'\n', f'{card["locator"]} {source}\n', f'Reading: {card["reading"]}\n']
    md += ['## Run record\n', f'{len(data["calls"])} completed API calls (including validation retries). {data["totals"]["input_tokens"]:,} input tokens; {data["totals"]["output_tokens"]:,} output tokens. No dollar estimate is inferred from token counts.\n', 'Speaker order is round-robin. Retrieval uses keyword overlap, with ties broken by card ID. All personas use the same model with separate prompts and continuity memos. See conversation.json and input-snapshot/ for the exact configuration and source hashes.\n']
    (out/'conversation.md').write_text('\n'.join(md), encoding='utf-8')
    profiles = ''.join(f'''<details class="person" style="--speaker:{color[p['id']]}"><summary><span class="avatar">{e(p['name'][0])}</span><span><b>{e(p['name'])}</b><small>{e(p['role'])}</small></span></summary><p>{e(p['system'])}</p><a href="{e(link_from(out, case/p['file']))}">Edit persona</a> · <a href="{e(link_from(out, case/p['knowledge']))}">Read knowledge cards</a><small class="snapshot-note">Prompt shown above is the saved run’s version; edit links open current inputs.</small></details>''' for p in data['personas'])
    filters = '<button type="button" data-filter="all" aria-pressed="true">Everyone</button>' + ''.join(f'<button type="button" data-filter="{e(p["id"])}" aria-pressed="false">{e(p["name"])}</button>' for p in data['personas'])
    seats = ''.join(f'<button type="button" class="seat" data-filter="{e(p["id"])}" aria-pressed="false" style="--speaker:{color[p["id"]]}"><span class="avatar">{e(p["name"][0])}</span><b>{e(p["name"])}</b><small>{e(p["role"])}</small></button>' for p in data['personas'])
    template = (case/'operations/page.html').read_text(encoding='utf-8')
    values = {'TITLE':e(data['title']), 'TURN_COUNT':str(len(data['turns'])), 'PERSON_COUNT':str(len(people)),
              'EVENT_COUNT':str(len(data['events'])), 'PROFILES':profiles, 'FILTERS':filters, 'ARTICLES':''.join(articles), 'SEATS':seats,
              'GUIDE':e(guide), 'MODEL':e(data['model_requested']), 'DATE':e(data['created'][:10]),
              'EXAMPLE_NOTES':e(link_from(out, case/'outputs/reading-notes.md')),
              'CALLS':str(len(data['calls'])), 'INPUT_TOKENS':f'{data["totals"]["input_tokens"]:,}',
              'OUTPUT_TOKENS':f'{data["totals"]["output_tokens"]:,}',
              'SCENARIO':''.join('<p>'+e(p)+'</p>' for p in data['scenario'].split('\n',1)[1].strip().split('\n\n'))}
    # One substitution pass: inserted model text can never become a template token.
    html = re.sub(r'\{\{([A-Z_]+)\}\}', lambda match: values[match[1]], template)
    (out/'index.html').write_text(html, encoding='utf-8')
    return out/'index.html'


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('conversation', type=Path)
    print(render(parser.parse_args().conversation))
