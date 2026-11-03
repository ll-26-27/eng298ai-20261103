"""Verify the live record, private contexts and round scheduling offline."""
from pathlib import Path
from unittest.mock import patch
import hashlib
import json
import sys
import unittest

CASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(CASE.parent/'operations'))
import run as engine


class ClassroomTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((CASE/'outputs/conversation.json').read_text())

    def test_live_record_and_transcript_are_unedited(self):
        engine.validate_run(self.data)
        self.assertEqual(len(self.data['turns']),20)
        self.assertEqual([t['speaker'] for t in self.data['turns'][::5]],['socrates']*4)
        for t in self.data['turns']:
            calls=[c for c in self.data['calls'] if c['turn']==t['number']]
            raw=json.loads((CASE/f'outputs/raw/{t["number"]:02d}-response-{calls[-1]["attempt"]}.json').read_text())
            accepted=json.loads('\n'.join(b['text'] for b in raw['content'] if b['type']=='text'))
            self.assertEqual(accepted,{k:t[k] for k in ('utterance','cites','memory')})
            self.assertIn(t['utterance'],(CASE/'outputs/conversation.md').read_text())
        self.assertEqual(self.data['totals'],{k:sum(c['usage'][k] for c in self.data['calls']) for k in ('input_tokens','output_tokens')})

    def test_prompts_are_private_and_future_cases_withheld(self):
        for t in self.data['turns']:
            request=json.loads((CASE/f'outputs/raw/{t["number"]:02d}-request.json').read_text())
            for p in self.data['personas']:
                self.assertEqual(p['system'] in request['system'],p['id']==t['speaker'])
            payload=request['user']
            self.assertEqual(payload['revealed_events'],engine.revealed(self.data['events'],t['number']))
            self.assertEqual(payload['your_previous_memo'],t['memory_before'])
            self.assertEqual(len(payload['conversation']),t['number']-1)
            self.assertTrue(all('memory' not in old for old in payload['conversation']))

    def test_original_sources_and_snapshots(self):
        for path,digest in self.data['input_hashes'].items():
            self.assertEqual(hashlib.sha256((CASE/'outputs/input-snapshot'/path).read_bytes()).hexdigest(),digest)
        source=json.loads((CASE/'inputs/readings/source.json').read_text())
        self.assertEqual(hashlib.sha256((CASE/'inputs/readings/phaedrus.md').read_bytes()).hexdigest(),source['sha256'])
        with patch.object(engine,'CASE',CASE):
            for p in self.data['personas']:
                self.assertEqual(len(engine.read_persona(CASE/p['file'])['cards']),3)
            self.assertEqual(len(engine.read_cards(CASE/'inputs/templates/knowledge.md')),2)

    def test_added_student_keeps_four_complete_rounds(self):
        config=json.loads((CASE/'inputs/config.json').read_text())
        events=json.loads((CASE/'inputs/events.json').read_text())
        baseline,base_events=engine.resolve_timing(config,events,5)
        added,added_events=engine.resolve_timing(config,events,6)
        self.assertEqual(baseline['turns'],20)
        self.assertEqual([e['turn'] for e in base_events],[6,11,16])
        self.assertEqual(added['turns'],24)
        self.assertEqual([e['turn'] for e in added_events],[7,13,19])
        self.assertEqual(config['turns'],20)  # Input config is not mutated.
        with self.assertRaises(ValueError): engine.resolve_timing(config,events,26)
        fixed={'turns':20}
        self.assertEqual(engine.resolve_timing(fixed,[],5),(fixed,[]))


if __name__=='__main__': unittest.main()
