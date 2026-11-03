"""Offline checks for source integrity, context isolation and the saved live run."""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

import run
from render import render


class SimulationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((run.CASE/'outputs/conversation.json').read_text())

    def test_twenty_turns_with_valid_provenance(self):
        run.validate_run(self.data)
        self.assertEqual(len(self.data['turns']), 20)
        self.assertEqual({p['id']: sum(t['speaker']==p['id'] for t in self.data['turns']) for p in self.data['personas']},
                         {'mara': 5, 'jonas': 5, 'leila': 5, 'theo': 5})
        for relative, expected in self.data['input_hashes'].items():
            self.assertEqual(hashlib.sha256((run.CASE/'outputs/input-snapshot'/relative).read_bytes()).hexdigest(), expected)
        calls = self.data['calls']
        self.assertEqual(self.data['totals'], {key:sum(c['usage'][key] for c in calls) for key in ('input_tokens','output_tokens')})
        for call in calls:
            raw = json.loads((run.CASE/f'outputs/raw/{call["turn"]:02d}-response-{call["attempt"]}.json').read_text())
            self.assertEqual(raw['id'], call['id'])

    def test_requests_keep_private_context_separate_and_events_timed(self):
        for turn in self.data['turns']:
            request = json.loads((run.CASE/f'outputs/raw/{turn["number"]:02d}-request.json').read_text())
            own = next(p for p in self.data['personas'] if p['id']==turn['speaker'])
            self.assertIn(own['system'], request['system'])
            for other in self.data['personas']:
                if other['id'] != own['id']:
                    self.assertNotIn(other['system'], request['system'])
            user = request['user']
            self.assertEqual(user['your_previous_memo'], turn['memory_before'])
            self.assertEqual(user['supplied_knowledge'], turn['supplied_cards'])
            self.assertEqual(user['revealed_events'], run.revealed(self.data['events'], turn['number']))
            self.assertEqual(len(user['conversation']), turn['number']-1)
            for previous in user['conversation']:
                self.assertNotIn('memory', previous)
                self.assertNotIn('system', previous)
            for public in user['public_roster']:
                self.assertEqual(set(public), {'name','role'})

    def test_bad_citation_and_future_event_are_rejected(self):
        bad = deepcopy(self.data)
        bad['turns'][0]['cites'] = ['MADE-UP']
        with self.assertRaises(ValueError): run.validate_run(bad)
        bad = deepcopy(self.data)
        bad['turns'][0]['events'] = self.data['events']
        with self.assertRaises(ValueError): run.validate_run(bad)

    def test_all_quotes_match_and_full_papers_are_unchanged(self):
        for p in self.data['personas']:
            self.assertEqual(len(run.read_cards(run.CASE/p['knowledge'])), 3)
        for paper in json.loads((run.CASE/'inputs/papers/manifest.json').read_text()):
            path = run.CASE/paper['file']
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), paper['sha256'])
            self.assertGreater(len(path.read_text()), 15000)
            self.assertIn('References', path.read_text())

    def test_student_template_loads_and_fifth_person_gets_four_turns(self):
        # Assemble a copied template in a temporary case folder, without a live call.
        with tempfile.TemporaryDirectory(dir=run.CASE/'inputs') as directory:
            path = Path(directory)/'student.md'
            path.write_text((run.CASE/'inputs/templates/persona.md').read_text().replace('inputs/knowledge/student.md','inputs/templates/knowledge.md'))
            student = run.read_persona(path)
            self.assertEqual(student['id'], 'student')
            self.assertEqual(len(student['cards']), 2)
            roster = self.data['personas'] + [student]
            order = [roster[i % len(roster)]['id'] for i in range(20)]
            self.assertEqual(order.count('student'), 4)

    def test_render_preserves_dialogue_and_escapes_html(self):
        data = deepcopy(self.data)
        data['turns'][0]['utterance'] += ' <script>alert("example")</script> {{TITLE}}'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'conversation.json'
            path.write_text(json.dumps(data))
            page = render(path).read_text()
            md = (path.parent/'conversation.md').read_text()
            self.assertEqual(page.count('class="turn"'), 20)
            self.assertNotIn('<script>alert(', page)
            self.assertIn('&lt;script&gt;', page)
            self.assertIn('{{TITLE}}', page)  # No second template substitution.
            for turn in data['turns']:
                self.assertIn(turn['utterance'], md)


if __name__ == '__main__':
    unittest.main()
