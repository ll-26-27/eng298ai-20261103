# Simulation workshop instructions

Read README.md, inputs/scenario.md, inputs/config.json and operations/README.md.
This example extends the previous system-prompt-plus-knowledge chatbot task
into a 20-turn shared conversation. Keep the inputs/operations/outputs layout.

Start by showing the saved outputs/index.html and explaining one turn's
persona, supplied cards, cited cards and continuity memo. The exact loop is
operations/run.py; use it for live runs rather than composing a transcript
and presenting it as twenty separate model calls.

When asked to add a student's chatbot, create a new Markdown persona and
knowledge packet using inputs/templates/. Preserve their intended role and
voice. Verify quotes against local sources. Clearly mark invented scenario
material as authored. Add the persona with --add-persona, so the default
roster and worked example remain available. Twenty turns is the total,
not the number of turns per persona.

Live mode uses the existing environment or ignored repository-root .env.
Never print, paste into artifacts or commit credentials. If no key is
available, explain the missing setup; do not fabricate a successful run.
One live run is normally twenty calls, plus possible validation/network
retries. Save it in the new outputs/runs/ directory the runner creates.

Validate the completed run and render both Markdown and standalone HTML.
Inspect the conversation for unsupported claims as well as schema validity.
Do not edit generated dialogue silently: change inputs and rerun, or label
editorial commentary separately. Retain raw replies and snapshots.

Invite comparison: what changed with the new persona, what stayed fixed,
what remained unresolved, and how much could be model variability? Describe the
model, roles, turn order and retrieval method used in the run. When comparing
with the research papers, identify the specific mechanisms each system uses.
