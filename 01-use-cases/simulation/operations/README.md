# The loop, in plain sight

1. Load each Markdown persona and its knowledge packet; verify source quotes.
2. Choose the next speaker in roster order. Reveal any event scheduled for
   this turn. Other personas' private prompts and memos stay out of the call.
3. Retrieve two cards from that speaker's packet. The query is the scenario,
   revealed events and the last three replies. Score by the number of shared
   unique words, excluding a short stopword list; break ties by card ID.
4. Call Claude with the speaker's system prompt, cards, previous memo, public
   roster, and full conversation so far. Save the exact request and response.
5. Validate the JSON and citation IDs. Append the reply to shared history;
   save the new memo for that speaker. Repeat until there are twenty replies.
6. Render the same saved data as `conversation.md` and `index.html`.

The prompts are [`prompts/system.md`](prompts/system.md) and
[`prompts/turn.md`](prompts/turn.md). Persona-specific instructions live in
`inputs/personas/`. [`run.py`](run.py) is the loop; [`render.py`](render.py)
and [`page.html`](page.html) make the two views without further model calls.

The target reply length is 60–110 words; the validator accepts 40–150.
It allows a maximum 60-word memo (prompt target: 45). Invalid output gets
one fresh attempt, saved separately; after that the run stops. The SDK may
also retry a network request once. A failed run keeps its partial JSON and
raw files but is not published as a complete HTML transcript. Rerunning
`--live` starts a fresh meeting; there is no automatic resume.

The worked example has 20 accepted turns and 22 completed API calls,
including two validation retries. It used 102,811 input and 6,916 output
tokens. `conversation.json` is the usage record; raw provider responses
remain alongside it. Model prices are not assumed here.

The short memo is a continuity artifact, not hidden reasoning. A quoted
card is verified against a source before the run; a generated speaker's use
of that card still needs human interpretation. A valid cite ID is not an
entailment check. Full shared history grows with each turn, so longer
meetings also increase token use.

Offline checks, from the repository root:

```bash
python3 -m unittest discover -s 01-use-cases/simulation/operations -p 'test_*.py'
python3 01-use-cases/simulation/operations/run.py
```
