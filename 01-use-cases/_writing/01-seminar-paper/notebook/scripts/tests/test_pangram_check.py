import importlib.util
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'pangram_check.py'
spec = importlib.util.spec_from_file_location('pangram_check', SCRIPT)
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)


class PangramCheckTests(unittest.TestCase):
    def test_extracts_body_and_preserves_inline_words(self):
        text, paragraphs = check.extract_essay('# A title\n\nThe *first* claim.\n\nA [source](https://example.com) follows.\n\n## Works Cited\n\nA reference.\n\n## Note on method\n\nA note.')
        self.assertEqual(text, 'The first claim.\n\nA source follows.')
        self.assertEqual([text[p['start']:p['end']] for p in paragraphs], ['The first claim.', 'A source follows.'])

    def test_excludes_method_without_bibliography(self):
        text, _ = check.extract_essay('# Title\n\nBody.\n\n## Note on method\n\nMetadata.')
        self.assertEqual(text, 'Body.')

    def test_maps_unicode_and_cross_paragraph_window(self):
        text, paragraphs = check.extract_essay('# T\n\nPlato’s claim.\n\nGrice’s answer.')
        window = {'text': text[5:22], 'start_index': 5, 'end_index': 22}
        self.assertEqual(check.paragraph_ids(window, text, paragraphs), [1, 2])

    def test_ambiguous_unmatched_offsets_are_not_guessed(self):
        text, paragraphs = check.extract_essay('# T\n\nSame.\n\nSame.')
        self.assertEqual(check.paragraph_ids({'text': 'Same.', 'start_index': 100, 'end_index': 105}, text, paragraphs), [])

    def test_provider_collapses_blank_lines(self):
        text, paragraphs = check.extract_essay('# T\n\nFirst paragraph.\n\nSecond paragraph.')
        returned = text.replace('\n\n', '\n')
        window = {'text': returned, 'start_index': 0, 'end_index': len(returned)}
        self.assertEqual(check.paragraph_ids(window, text, paragraphs), [1, 2])

    def test_unique_text_recovers_provider_offset_mismatch(self):
        text, paragraphs = check.extract_essay('# T\n\nFirst.\n\nSecond.')
        self.assertEqual(check.paragraph_ids({'text': 'Second.', 'start_index': 100, 'end_index': 107}, text, paragraphs), [2])

    def test_report_escapes_provider_text(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory)
            manifest = {'word_count': 1, 'created_at': 'test', 'input_sha256': 'test'}
            result = {'headline': '<script>alert(1)</script>', 'windows': [{'text': '<img src=x onerror=alert(1)>', 'label': 'test'}]}
            check.render_report(out, result, manifest, 'text', [])
            page = (out / 'report.html').read_text()
            self.assertNotIn('<script>', page)
            self.assertNotIn('<img ', page)
            self.assertIn('&lt;script&gt;', page)
            self.assertIn('Paragraph alignment unavailable', page)


if __name__ == '__main__':
    unittest.main()
