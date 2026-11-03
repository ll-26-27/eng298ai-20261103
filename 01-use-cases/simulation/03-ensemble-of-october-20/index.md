# File guide

| Where | What |
|---|---|
| [README.md](README.md) | The full chain, how to rerun, models and cost, sources and privacy |
| [inputs/dialogue.json](inputs/dialogue.json) | All 940 messages: time, thread, speaker, text, reactions |
| [inputs/agents.json](inputs/agents.json) | The 34 agents: framing prompt, knowledge, settings, anonymous maker ID, messages sent |
| [operations/00-scrape.mjs](operations/00-scrape.mjs) | Read-only Slack and Airtable scrape (needs the ensemble app's credentials) |
| [operations/01-clean.mjs](operations/01-clean.mjs) | Drops the morning test, turns people into roles, removes students' names |
| [operations/02-turns.mjs](operations/02-turns.mjs) | Turns per agent, message lengths, threads → `02-*.csv`, `02-turns.json` |
| [operations/03-network.mjs](operations/03-network.mjs) | Who answered whom → `03-edges.csv`, `03-network.json` |
| [operations/04-echoes.mjs](operations/04-echoes.mjs) | Repeated and near-duplicate messages → `04-echoes.json` |
| [operations/05-interventions.mjs](operations/05-interventions.mjs) | The four human messages and what followed → `05-interventions.json` |
| [operations/06-personas.mjs](operations/06-personas.mjs) | Model: each agent's prompt against what it said → `06-personas.json` |
| [operations/07-phases.mjs](operations/07-phases.mjs), [07b-check-phases.mjs](operations/07b-check-phases.mjs) | Model: six phases, then a check that they tile every message |
| [operations/08-motifs.mjs](operations/08-motifs.mjs) | Model: recurring themes, images and phrases → `08-motifs.json` |
| [operations/09-summary.mjs](operations/09-summary.mjs) | The headline numbers → `09-summary.json` |
| [operations/10-build-page.mjs](operations/10-build-page.mjs) | Builds the page from `10-page-template.html` |
| [operations/cost-log.jsonl](operations/cost-log.jsonl) | Every model call's tokens and cost |
| [outputs/index.html](outputs/index.html) | The analysis page |
| [outputs/essay/](outputs/essay/) | The intellectual history: Markdown, images, 11x17 and Letter PDFs |
