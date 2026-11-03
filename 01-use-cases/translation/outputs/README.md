# Outputs

Open the [annotated page](example/annotated-translation.html)
in a browser. It is a standalone HTML file: no server or installation is needed.
The English translation aligns with the French by segment, and four notes
make specific decisions available for discussion. Click a highlighted phrase
to reach its note; use the buttons to hide French or highlights. The layout
shows parallel columns on a larger screen and stacks each pair on a phone.

`example/` contains the actual responses from a live Anthropic API run:
source check, lexicon, context/rhythm, draft, critique, revision, comparison,
final edit, and annotations. `translation.json` combines the final segments
and notes; the renderer makes the HTML and Markdown from that single record.
`run.json` records the model, stages, token usage, and hashes. See
`example/review.md` for the subsequent source and presentation checks.

The same model wrote and critiqued the translation. This is a worked AI example,
not a certified scholarly translation or evidence of a student’s review.

Fresh runs go under `runs/` and leave the example intact. Compare the first
draft and revision before deciding whether another loop would help.

The final operation turns a structured result into a page for a reader. Reuse
that pattern in the next use case: change the inputs, change the operations,
and decide how the HTML should help someone inspect the result.

The [Markdown companion](example/annotated-translation.md) remains available
for reading the translation as plain text.
