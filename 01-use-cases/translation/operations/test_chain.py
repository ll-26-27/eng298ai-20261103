"""Offline checks for source retention and editorial-output integrity."""
import copy
import json
from pathlib import Path
from types import SimpleNamespace
import unittest
from chain import CASE, read_inputs, build_request, call_model, validate_translation, validate_notes


class ChainChecks(unittest.TestCase):
    def setUp(self):
        self.inputs = read_inputs()
        self.final = json.loads((CASE / 'outputs/example/translation.json').read_text())

    def test_revisions_keep_source_and_comparison_is_withheld(self):
        state = {'draft': 'A deliberately incomplete draft', 'critique': 'Check against source'}
        request = build_request('06-revise', self.inputs, state)
        for segment in self.inputs['segments']:
            self.assertIn(segment['french'], request)
        self.assertNotIn(self.inputs['reference'], request)
        self.assertIn(self.inputs['reference'], build_request('07-compare', self.inputs, state))

    def test_reject_missing_segment_and_invented_annotation_quote(self):
        bad = copy.deepcopy(self.final)
        bad['segments'].pop()
        with self.assertRaises(ValueError): validate_translation(bad, self.inputs)
        bad = copy.deepcopy(self.final)
        bad['notes'][0]['source_quote'] = 'not in Bergson'
        with self.assertRaises(ValueError): validate_notes(bad, self.final, self.inputs)

    def test_truncated_response_is_not_a_completed_translation(self):
        client = SimpleNamespace(messages=SimpleNamespace(create=lambda **kwargs:
                                 SimpleNamespace(stop_reason='max_tokens')))
        with self.assertRaises(RuntimeError): call_model(client, 'test-model', 'request')

    def test_actual_live_result_obeys_contract(self):
        validate_translation(self.final, self.inputs)
        validate_notes(self.final, self.final, self.inputs)


if __name__ == '__main__':
    unittest.main()
