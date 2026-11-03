# The Ensemble of October 20

Read README.md and summary.md. This case reads a multi-agent dialogue that already happened: the class's chatbots, together in one Slack channel on October 20. The library and classroom cases next door run a room; this one analyzes one.

Start by opening outputs/index.html and showing one phase, one strong pair in the network, and one agent whose messages drifted from its prompt. Then point to the essay in outputs/essay/ as an example of turning an analysis into an argument.

inputs/dialogue.json is the historical record: never edit a message. Interpretation belongs in operations' outputs, the page and the essay, labeled as such. Model judgments (personas, phases, motifs) come from the numbered scripts; rerun those rather than writing new judgments into the JSON by hand. Steps 0 and 1 need the ensemble app's Slack and Airtable credentials and the raw scrape, which are not in this repo; steps 2 onward run from inputs/ with an OpenRouter key in the ignored root .env.

Students' names are not in this folder and must not be added. The Convener and the Instructor are roles. Agents keep the names their makers gave them.

To study another dialogue, replace inputs/dialogue.json with messages in the same shape (n, time, thread, speaker, kind, text) and inputs/agents.json with the agents' prompts, then rerun steps 2–10.
