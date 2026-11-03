# Socratic classroom

Read README.md and operations/README.md. This case extends the first
simulation's system-prompt-plus-knowledge architecture into a classroom.
The local instructions here take precedence over the parent case's library
scenario and fixed 20-turn rule.

Use the local operations/run.py to select the classroom. It imports the
shared engine; do not run the parent script without --case pointing here.
Default mode replays the saved dialogue. --live makes actual separate
Claude calls, then renders a Markdown transcript and standalone HTML page.
Never invent a run and label it API-generated. Keep original outputs intact.

Socrates facilitates a contemporary seminar inspired by the dialogue form.
Students begin with distinct claims that can develop through the exchange. Invite genuine disagreement within the fiction;
do not force all of them to arrive at the same conclusion or praise the tutor.

Help students adapt inputs/templates/ and add the persona with --add-persona.
The current config uses four complete rounds: five participants = 20 turns;
six = 24. Seminar prompts move to the start of their round. The baseline
snapshots retain the original equivalent fixed-turn configuration.

Verify source quotations and keep authored cards labeled. Keep keys in the
existing environment or ignored root .env; never print or save them in
artifacts. Missing credentials should be explained, not worked around by
fabricating a transcript. Live API usage is separate from a subscription.

Read the generated dialogue for actual counterexamples, revisions and open
questions. Preserve raw responses and snapshots. Editorial interpretation
belongs outside the speakers' words. Use the memos to track each
speaker’s position, revisions and unresolved questions across the run.
