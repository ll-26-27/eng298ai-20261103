#!/usr/bin/env python3
"""One persona per API call; each reply becomes the next call's input.

Default: validate and render the saved example, with no API calls.
--live: generate 20 turns into a new outputs/runs/<timestamp>-<id>/ folder.
Python 3.10+. Live mode also requires anthropic and ANTHROPIC_API_KEY.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import uuid

CASE = Path(__file__).resolve().parents[1]
REPO = CASE.parents[1]
STOP = set('the and that this with from have will would could should into your their there what which when where about they them for are was were can our you not but one its has how who all any only'.split())


def read(path):
    return path.read_text(encoding='utf-8')


def save(path, value):
    # Replace atomically so an interrupted run leaves readable JSON.
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(path)


def inside(root, value):
    path = (root / value).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError('Input paths must stay inside their documented root.')
    return path


def section(text, name):
    match = re.search(r'^## ' + re.escape(name) + r'\n+(.*?)(?=^## |\Z)', text, re.M | re.S)
    if not match or not match[1].strip():
        raise ValueError('Missing Markdown section: ' + name)
    return match[1].strip()


def read_cards(path):
    cards = []
    for id, title, body in re.findall(r'^## ([A-Z][A-Z0-9-]*) \| ([^\n]+)\n(.*?)(?=^## |\Z)', read(path), re.M | re.S):
        def field(label):
            match = re.search(r'^' + label + r': (.+)$', body, re.M)
            if not match: raise ValueError(f'{id}: missing {label}')
            return match[1]
        quote = '\n'.join(re.findall(r'^> ?(.*)$', body, re.M)).strip()
        if not quote: raise ValueError(f'{id}: missing quote')
        source = field('Source')
        if source != 'authored':
            source_text = read(inside(REPO, source))
            if re.sub(r'\s+', ' ', quote) not in re.sub(r'\s+', ' ', source_text):
                raise ValueError(f'{id}: quote does not match its source')
        cards.append(dict(id=id, title=title, source=source, locator=field('Locator'), quote=quote, reading=field('Reading')))
    if not cards or len({c['id'] for c in cards}) != len(cards):
        raise ValueError('Knowledge packet needs at least one uniquely named card.')
    return cards


def read_persona(path):
    text = read(path)
    match = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    if not match: raise ValueError('Persona needs frontmatter: id, name, knowledge.')
    fields = dict(line.split(':', 1) for line in match[1].splitlines() if ':' in line)
    fields = {k.strip(): v.strip() for k, v in fields.items()}
    if not all(fields.get(k) for k in ('id', 'name', 'knowledge')):
        raise ValueError('Persona needs id, name, knowledge.')
    if not re.fullmatch(r'[a-z][a-z0-9-]*', fields['id']):
        raise ValueError('Persona id must use lowercase letters, numbers or hyphens.')
    return dict(id=fields['id'], name=fields['name'], file=str(path.relative_to(CASE)),
                role=section(text, 'Public role'), system=section(text, 'System prompt'),
                cards=read_cards(inside(CASE, fields['knowledge'])), knowledge=fields['knowledge'])


def tokens(text):
    return set(re.findall(r'[a-z]{3,}', text.lower())) - STOP


def retrieve(cards, query, count):
    words = tokens(query)
    scored = [{**card, 'score': len(words & tokens(card['title'] + ' ' + card['quote'] + ' ' + card['reading']))} for card in cards]
    return sorted(scored, key=lambda c: (-c['score'], c['id']))[:count]


def revealed(events, turn):
    return [e for e in events if e['turn'] <= turn]


def resolve_timing(config, events, roster_size):
    """Optional full rounds keep classroom prompts aligned when a student joins."""
    config = dict(config)
    events = [dict(e) for e in events]
    if 'rounds' in config:
        rounds = config['rounds']
        if not isinstance(rounds, int) or not 1 <= rounds * roster_size <= 100:
            raise ValueError('Full rounds must produce 1–100 total turns.')
        config['turns'] = rounds * roster_size
        for event in events:
            if not isinstance(event.get('round'), int) or not 1 <= event['round'] <= rounds:
                raise ValueError('A round-based seminar prompt needs a valid round number.')
            event['turn'] = 1 + (event['round'] - 1) * roster_size
    return config, events


def validate_response(data, supplied):
    if not isinstance(data, dict) or set(data) != {'utterance', 'cites', 'memory'}:
        raise ValueError('Expected exactly utterance, cites and memory.')
    if not isinstance(data['utterance'], str) or not 40 <= len(data['utterance'].split()) <= 150:
        raise ValueError('Reply must contain 40–150 words (target 60–110).')
    if not isinstance(data['memory'], str) or not 1 <= len(data['memory'].split()) <= 60:
        raise ValueError('Memory memo must contain 1–60 words (target at most 45).')
    if not isinstance(data['cites'], list) or not all(isinstance(c, str) for c in data['cites']):
        raise ValueError('Cites must be a list of card IDs.')
    allowed = {c['id'] for c in supplied}
    if len(set(data['cites'])) != len(data['cites']) or any(c not in allowed for c in data['cites']):
        raise ValueError('Citations must be unique and drawn from the supplied cards.')


def validate_run(data):
    roster = data['personas']
    turns = data['turns']
    if data['status'] != 'complete' or len(turns) != data['config']['turns']:
        raise ValueError('This run is incomplete; inspect conversation.json and raw/ before retrying.')
    memories = {}
    for number, turn in enumerate(turns, 1):
        person = roster[(number - 1) % len(roster)]
        if turn['number'] != number or turn['speaker'] != person['id']:
            raise ValueError('Turn order is inconsistent with the roster.')
        if turn['memory_before'] != memories.get(person['id'], ''):
            raise ValueError('Persona memory continuity is broken.')
        if turn['events'] != revealed(data['events'], number):
            raise ValueError('Future events leaked into an earlier turn.')
        expected = retrieve(person['cards'], turn['retrieval_query'], data['config']['cards_per_turn'])
        if turn['supplied_cards'] != expected:
            raise ValueError('Retrieval record does not match the supplied cards.')
        validate_response({k: turn[k] for k in ('utterance', 'cites', 'memory')}, turn['supplied_cards'])
        memories[person['id']] = turn['memory']


def load_env():
    path = REPO / '.env'
    if path.exists():
        for line in read(path).splitlines():
            key, sep, value = line.partition('=')
            if sep and key.strip() in {'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL'}:
                os.environ.setdefault(key.strip(), value.strip().strip('\"\''))


def live(args):
    load_env()
    if not os.environ.get('ANTHROPIC_API_KEY'):
        raise ValueError('Set ANTHROPIC_API_KEY in the environment or repository-root .env.')
    from anthropic import Anthropic
    config_path = CASE / 'inputs/config.json'
    config = json.loads(read(config_path))
    if not isinstance(config['turns'], int) or not 1 <= config['turns'] <= 100:
        raise ValueError('Use 1–100 total turns.')
    if not isinstance(config['cards_per_turn'], int) or config['cards_per_turn'] < 1:
        raise ValueError('cards_per_turn must be positive.')
    paths = [inside(CASE, p) for p in config['personas'] + args.add_persona]
    personas = [read_persona(p) for p in paths]
    if not personas or len({p['id'] for p in personas}) != len(personas):
        raise ValueError('The roster needs unique persona IDs.')
    events = json.loads(read(CASE / 'inputs/events.json'))
    config, events = resolve_timing(config, events, len(personas))
    if any(not isinstance(e['turn'], int) or not 1 <= e['turn'] <= config['turns'] for e in events):
        raise ValueError('Event turn falls outside the conversation.')
    scenario = read(CASE / 'inputs/scenario.md')
    system_template = read(CASE / 'operations/prompts/system.md')
    turn_template = read(CASE / 'operations/prompts/turn.md')
    now = datetime.now(timezone.utc)
    out = CASE / 'outputs/runs' / (now.strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:6])
    (out / 'raw').mkdir(parents=True)
    snapshot = out / 'input-snapshot'
    snapshot.mkdir()
    input_paths = paths + [inside(CASE, p['knowledge']) for p in personas] + [config_path, CASE/'inputs/scenario.md', CASE/'inputs/events.json', CASE/'operations/prompts/system.md', CASE/'operations/prompts/turn.md']
    hashes = {}
    for path in input_paths:
        relative = path.relative_to(CASE)
        target = snapshot / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(path.read_bytes())
        hashes[str(relative)] = hashlib.sha256(path.read_bytes()).hexdigest()
    model = args.model or os.environ.get('ANTHROPIC_MODEL', 'claude-sonnet-5-5')
    data = dict(title=config['title'], status='running', created=now.isoformat(), model_requested=model,
                config=config, scenario=scenario, events=events, personas=personas, input_hashes=hashes,
                turn_unit='One API-generated utterance; 20 total in the default configuration.',
                retrieval='Unique lowercase keyword overlap; top k, ties by card ID. Query: scenario, revealed events, last three utterances. No embeddings.',
                turns=[], calls=[], totals={'input_tokens': 0, 'output_tokens': 0})
    save(out / 'conversation.json', data)
    print('Run folder: ' + str(out.relative_to(REPO)), flush=True)
    client = Anthropic(timeout=90, max_retries=1)
    memories = {}
    try:
        for number in range(1, config['turns'] + 1):
            person = personas[(number-1) % len(personas)]
            active_events = revealed(events, number)
            query = scenario + '\n' + '\n'.join(e['text'] for e in active_events) + '\n' + '\n'.join(t['utterance'] for t in data['turns'][-3:])
            cards = retrieve(person['cards'], query, config['cards_per_turn'])
            memory = memories.get(person['id'], '')
            shared = [{k: t[k] for k in ('number', 'speaker', 'name', 'utterance', 'cites')} for t in data['turns']]
            payload = dict(instructions=turn_template.format(name=person['name'], turn=number, total=config['turns']),
                           scenario=scenario, public_roster=[{'name': p['name'], 'role': p['role']} for p in personas],
                           revealed_events=active_events, your_previous_memo=memory, supplied_knowledge=cards, conversation=shared)
            system = system_template + '\n\nYOUR PERSONA\n' + person['system']
            request = json.dumps(payload, ensure_ascii=False, indent=2)
            save(out/'raw'/f'{number:02d}-request.json', {'system': system, 'user': payload})
            for attempt in (1, 2):
                response = client.messages.create(model=model, max_tokens=1200, system=system,
                                                 messages=[{'role': 'user', 'content': request}])
                raw = response.model_dump(mode='json')
                save(out/'raw'/f'{number:02d}-response-{attempt}.json', raw)
                usage = {'input_tokens': response.usage.input_tokens, 'output_tokens': response.usage.output_tokens}
                data['calls'].append(dict(turn=number, attempt=attempt, id=response.id, model=response.model, stop_reason=response.stop_reason, usage=usage))
                for key, count in usage.items(): data['totals'][key] += count
                save(out / 'conversation.json', data)
                try:
                    if response.stop_reason != 'end_turn': raise ValueError('Response did not finish normally.')
                    answer = json.loads('\n'.join(block.text for block in response.content if block.type == 'text'))
                    validate_response(answer, cards)
                    break
                except (ValueError, TypeError) as error:
                    if attempt == 2: raise ValueError('Two invalid responses; inspect the saved raw responses.') from error
                    request += '\n\nYour previous response failed validation: ' + str(error) + '\nReturn a fresh valid JSON object. Do not change the speaker or turn.'
                    save(out/'raw'/f'{number:02d}-retry-request.json', {'system': system, 'user_text': request})
            turn = dict(number=number, speaker=person['id'], name=person['name'], events=active_events,
                        retrieval_query=query, supplied_cards=cards, memory_before=memory, **answer)
            data['turns'].append(turn)
            memories[person['id']] = answer['memory']
            save(out / 'conversation.json', data)
            print(f'Turn {number:02d}/{config["turns"]}: {person["name"]} · {len(answer["utterance"].split())} words', flush=True)
        data['status'] = 'complete'
        data['completed'] = datetime.now(timezone.utc).isoformat()
        validate_run(data)
        save(out / 'conversation.json', data)
    except Exception as error:
        data['status'] = 'failed'
        data['error_type'] = type(error).__name__
        save(out / 'conversation.json', data)
        raise
    finally:
        client.close()
    from render import render
    render(out / 'conversation.json', case=CASE)
    print('Complete: ' + str(out / 'index.html'), flush=True)


def main(default_case=None):
    global CASE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--case', type=Path, default=default_case, help='Use another simulation folder (relative to the repository root, or absolute).')
    parser.add_argument('--live', action='store_true')
    parser.add_argument('--model')
    parser.add_argument('--add-persona', action='append', default=[], metavar='CASE_RELATIVE_PATH')
    parser.add_argument('--replay', type=Path, help='Validate/render another saved conversation.json; no API calls.')
    args = parser.parse_args()
    if args.case:
        CASE = inside(REPO, args.case)
    if args.live and args.replay: parser.error('--live and --replay cannot be combined.')
    if not args.live and (args.add_persona or args.model): parser.error('--add-persona and --model require --live.')
    try:
        if args.live:
            live(args)
        else:
            path = args.replay or CASE / 'outputs/conversation.json'
            data = json.loads(read(path))
            validate_run(data)
            from render import render
            render(path, case=CASE)
            print(f'Validated {len(data["turns"])} saved turns. No API calls. Open {path.parent / "index.html"}')
    except Exception as error:
        # Provider errors can contain request details. Keep logs free of credentials.
        print('Stopped: ' + (str(error) if isinstance(error, (ValueError, FileNotFoundError)) else type(error).__name__))
        raise SystemExit(1)


if __name__ == '__main__':
    main()
