# Pangram checks

Two actual API checks were run on November 3, 2026: the earlier expanded draft and the complete rewrite. Both retain their quoted source material. Each check excludes the title, bibliography, and method note. Percentages below are rounded to two decimal places; raw responses retain the returned precision.

| Draft | Body words | Pangram version | Headline | AI fraction | AI-assisted fraction | Human fraction |
|---|---:|---|---|---:|---:|---:|
| [Earlier expansion](01-before-close-reading/report.html) | 5,450 | 4.1 | AI Generated | 100.00% | 0.00% | 0.00% |
| [Complete rewrite](02-complete-rewrite/report.html) | 4,992 | 4.1 | AI Generated | 100.00% | 0.00% | 0.00% |

Each run folder contains `draft.md`, `input.txt`, `paragraphs.json`, `manifest.json`, the submitted task record, `response.json`, `summary.md`, and `report.html`. The manifest records hashes of the source and submitted text. HTML reports show the provider's window labels alongside the affected paragraph numbers.

The complete rewrite remains classified as AI Generated. Its substantive changes are documented in the [argument audit](../academic-prose-audit.md): a narrower claim, worked textual examples, explicit premises, and corrected inferences. No detector label has been presented as a measure of those changes.

To repeat the operation, follow [W09b](../../notebook/W09b_prose-and-pangram.md). The integration uses Pangram's documented [inference API](https://pangram.readthedocs.io/en/latest/api/rest.html), with `public_dashboard_link` set to false. Credentials remain in the ignored root `.env`.

The current paper has a subsequent edit to its opening paragraph only (5,013 body words). The remaining text is identical to the complete rewrite checked above. These saved results refer to their archived drafts; Pangram was not rerun for the opening-only edit.
