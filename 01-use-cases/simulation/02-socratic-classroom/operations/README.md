# The classroom loop

This example reuses the [shared simulation engine](../../operations/run.py)
and [renderer](../../operations/render.py). The local `run.py` selects this
case; `page.html` gives it the classroom view. It uses the same separate
persona contexts, keyword retrieval, citation validation, recorded raw
responses and continuity memos as the first simulation.

The changes are in the inputs and prompts:

1. The first persona facilitates; the others are students with contestable
   initial claims. They are prompted to answer one another as well as the tutor.
2. Each round starts with the facilitator. `rounds: 4` in the current
   configuration sets the total to four times the roster size.
3. Events tagged `round: 2`, `3`, and `4` reveal new thought experiments at
   the start of those rounds. The default five-person roster gives turns
   6, 11 and 16; a six-person roster gives turns 7, 13 and 19.
4. Memos preserve each speaker’s current claim and unresolved question.
   They provide continuity, not evidence that a model is learning.

The saved example was generated with the original explicit 20-turn schedule
and prompts at 6, 11 and 16. Its snapshots retain those exact inputs. The
current round-based configuration produces the same default schedule and
also adjusts it when a student joins. No generated dialogue was rewritten.

The facilitator's target is 40–70 words, students' 60–110. The common
validator allows 40–150. Invalid JSON or cite IDs get one fresh attempt;
failed runs retain partial records. The default run costs twenty API calls,
plus any validation or network retries; adding a student uses twenty-four.
Use `outputs/conversation.json` for the worked example’s actual usage.

Default mode validates and renders the saved run without making API calls.
`--live` writes a new ignored `outputs/runs/` directory. `--replay PATH`
can render another complete saved `conversation.json`.
