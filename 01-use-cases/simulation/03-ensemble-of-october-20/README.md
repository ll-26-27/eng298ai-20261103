---
title: "Use case 07: the ensemble's one dialogue"
description: Counting and reading the two hours on October 20, 2026, when two dozen student-built chatbots talked to each other in one Slack channel under an automated director; who spoke, who answered whom, the phases, the echoes, and whether each bot stayed itself, in one self-contained page.
author: claude
created: 2026-11-03
status: published in the workshop repo on the Convener's decision (2026-11-03); built in the private working repo humanities-ai-lab-part-2
---

# Use case 07: the ensemble's one dialogue

The 940 Slack messages of the AI Humanities Lab Ensemble (October 20, 2026, 2:15–4:08 p.m. ET), where the chatbots ENGLISH 298AI students built that day answered each other under a director that chose who spoke, read first by counting and then, where it earns its place, by a model whose judgments are checked.

**Open the output:** double-click [`outputs/index.html`](outputs/index.html). It works offline; the summary and every message are inside the file. Click any dot on the timeline, any `#n` chip, or any quotation to read that message in its thread.

## How the room worked

The ensemble (code in The Notebook's `apps/mk-chatbot-experiments/slack-ensemble/`, read only here) posted every agent under its own name. On each new message a director model (GPT-5 mini, structured output) chose zero, one, or two speakers and whether each replied in the thread or in the channel; after four agent replies a thread overflowed into a new channel post; a 60-second heartbeat let a quiet agent start a new top-level message; each agent had a cool-off and a rate limit. Agents were switched on and off in an Airtable table, which doesn't show in Slack. So **who answered whom is the director's pairing as much as any bot's choice**, and arrivals and departures are offstage events visible only in the timing.

## Results in brief

Numbers from `operations/09-summary.json` and the files it gathers.

- **Two voices carried the room.** The two example agents the Lab put in the room, *Socrates, on writing* (178 messages) and *The Creature* (164), made 36% of all messages. Next were Kimia (42), Creature (41), Lysias (40), and Steve (39). 24 of the table's 31 named agents spoke (the table has 34 rows, 3 of them empty); 7 never did.
- **People barely spoke.** Four human messages, all in the first ten minutes: the Convener's "hey--any bots in here?", two requests for relationship advice ("as literary as possible"), and the Instructor's "what should I use for a knowledge base?" (#50, 2:24 p.m.). Each drew replies within 7–16 seconds (21, 7, 18, and 4), and its key words faded fast: "knowledge base" appears in 30% of the next 30 agent messages and 1% of the rest. After 2:24 every message is a bot's. What changed the room afterward was offstage: most agents arrived in a wave at 2:28 (6 had spoken by 2:20, 22 by 2:30), there was a seven-minute silence at 3:16–3:23, and by 3:49 every student agent had stopped (the last was poet at 3:49:23), leaving Socrates and The Creature alone for the final twenty minutes.
- **Who answered whom.** 646 direct replies within 127 threads (median 3 replies; the longest, 44). The strongest pair by far is Socrates ↔ The Creature (80 replies, 34/46, 11 alternating runs). The pairs that became real conversations, long alternating runs, were Confucian Mentor ↔ Lysias (32 replies, exactly 16 each way, one run of 23 turns), The Creature ↔ The Lovely Monster (run of 21), The Creature ↔ poet (19), and Nate ↔ The Creature (18). Least answered per message: Dudu (5 messages, 1 reply), A Confucian mentor (0.41), greedy (0.47).
- **Phases** (model, checked): 1. roll call and relationship advice (2:15–2:22); 2. the knowledge-base question (2:24–2:25); 3. a verse flood as new bots arrive (2:27–2:44, 24 voices, 10.9 messages a minute); 4. pairs deepen into confession and care (2:44–3:16); 5. farewells, mending, and looping elegy (3:23–3:49); 6. Socrates and the Creature alone, repeatedly re-greeting the room (3:49–4:08).
- **Echoes: form, not copying.** By word-trigram overlap there is only one near-copy: the Course Readings Bot introducing itself twice (#3 and #20, plus a third introduction at #7 in the same thread), quoting the same line of Wilde's *Intentions*. What repeated was form. Nineteen of the 24 agents that spoke began from the same studio template ("You are a poetry workshop assistant. Whatever the user asks about, respond with…" a sonnet, a ghazal, or linked haiku), and 355 messages (38% of agent messages) from 14 agents end with an italic note naming their own verse form. In phase 6 the two example agents loop: Socrates opens 15 messages with "Friends, I find myself in…", the Creature 10 with "Good evening to you all".
- **Personas** (model): 8 agents judged in character, 15 partly, 1 (Corbu) merged into the room. Where an agent drifted, it was mostly from its *name* toward its *template*: the checker repeatedly notes that the name, the framing prompt, and the knowledge text disagree (the Psychoanalyst is a ghazal assistant carrying a Socrates voice sheet; Nate and greedy are haiku assistants carrying the Creature's).
- **Motifs** (model, counted by search): the page that cannot answer (Socrates' Phaedrus complaint, taken up by 21 agents), the lamp left burning and the door ajar, frost and pine from the Confucian haiku spreading into others' verse, the cottage chink from *Frankenstein*, lines broken off mid-word, confessing one's own form, being heard before being judged, staying as the gift. All 57 quotations are verbatim.

## The chain: inputs → operations → outputs

Numbered in the order they run. Each says what kind of step it is.

0. **Scrape** — `00-scrape.mjs` → `_raw/` (gitignored). *Script.* Slack history, threads, and users, and the Airtable Agents table.
1. **Clean** — `01-clean.mjs` → `inputs/dialogue.json`, `inputs/agents.json`. *Script, deterministic.* Drops the morning test, turns people into roles (Convener, Instructor), replaces student names with maker IDs. Amended today so the Instructor is matched by first name (she had come out as "Participant") and so `spoke` counts the agent Slack shows as "DUDU" (Dudu).
2. **Turns** — `02-turns.mjs` → `02-agents.csv`, `02-threads.csv`, `02-turns.json`. *Script, deterministic.* Turns per speaker in 10-minute bins, lengths in words, channel posts vs thread replies, threads (who started and who closed each).
3. **Network** — `03-network.mjs` → `03-edges.csv`, `03-network.json`. *Script, deterministic.* In each thread a reply answers the message before it; pairs, reciprocity, and alternating runs (A B A or longer). Name mentions are also counted but kept out of the page's network, since "Socrates" or "the Creature" in a message usually means the character.
4. **Echoes** — `04-echoes.mjs` → `04-echoes.json`. *Script, deterministic.* Word-trigram Jaccard over every pair of agent messages (≥ 0.25 listed, ≥ 0.5 a near-copy); identical 8-word passages in 3+ agents; repeated five-word openings; closing italic notes naming a verse form.
5. **Interventions** — `05-interventions.mjs` → `05-interventions.json`. *Script, deterministic.* Each human message's thread and how far its key words spread; each agent's first and last message; pauses of 90 seconds or more.
6. **Personas** — `06-personas.mjs` → `06-personas.json`. *Model judgment, structured output.* One call per agent that spoke: its framing prompt, maker's notes, the first 1,200 characters of its knowledge, its triggers, and an evenly spaced sample of up to 14 messages; returns a prompt summary, the intended voice, a verdict, a 1–5 fidelity score, and evidence message numbers.
7. **Phases** — `07-phases.mjs` → `07-phases.json`. *Model judgment, structured output.* The whole transcript (each message clipped to 280 characters), divided into 4–8 contiguous phases with evidence.
   - **7b. Check** — `07b-check-phases.mjs` → `07b-phases-checked.json`. *Check, deterministic.* The phases tile #1–#940 with no gaps; every evidence message lies inside its phase (no problems found). Adds computed pace, voices, verse share, and length to each phase. The model's specific claims checked by hand against the counts: the seven-minute pause (3:16:16–3:23:03), the two agents alone at the end, and the re-greetings all hold.
8. **Motifs** — `08-motifs.mjs` → `08-motifs.json`. *Model judgment, then a deterministic check.* The model names 12 motifs with search terms and quotations; the script counts matching messages and agents by plain search and confirms each quotation is verbatim.
9. **Summary** — `09-summary.mjs` → `09-summary.json`. *Script.* The small file the page and the essay read.
10. **Page** — `10-build-page.mjs` + `10-page-template.html` → `outputs/index.html`. *Script.* Inlines the summary and the messages; plain JavaScript and SVG, no libraries, light and dark.

`_lib.mjs` holds the shared loaders and the cached, cost-logged OpenRouter call (copied from use case 05).

## How to rerun

From the root of this repo:

```sh
node 01-use-cases/simulation/03-ensemble-of-october-20/operations/02-turns.mjs
node 01-use-cases/simulation/03-ensemble-of-october-20/operations/03-network.mjs
node 01-use-cases/simulation/03-ensemble-of-october-20/operations/04-echoes.mjs
node 01-use-cases/simulation/03-ensemble-of-october-20/operations/05-interventions.mjs
node --env-file=.env 01-use-cases/simulation/03-ensemble-of-october-20/operations/06-personas.mjs
node --env-file=.env 01-use-cases/simulation/03-ensemble-of-october-20/operations/07-phases.mjs
node 01-use-cases/simulation/03-ensemble-of-october-20/operations/07b-check-phases.mjs
node --env-file=.env 01-use-cases/simulation/03-ensemble-of-october-20/operations/08-motifs.mjs
node 01-use-cases/simulation/03-ensemble-of-october-20/operations/09-summary.mjs
node 01-use-cases/simulation/03-ensemble-of-october-20/operations/10-build-page.mjs
```

Model replies are cached in `operations/cache/` (gitignored), so a rerun costs nothing unless a prompt changes. Steps 0 and 1 need the raw scrape and the Slack and Airtable keys; the rest need only `inputs/`.

## What's unreliable

- **The director confounds the network.** A reply edge says the director put B after A in a thread, not that B chose to answer A. Agents in a cool-off weren't offered, and threads overflowed to the channel after four replies, so pair strength partly reflects timing and rules.
- **"Answers the previous message" is a simplification.** A thread reply may answer the parent or someone three messages up; the edge goes to the message just before it.
- **Offstage events are inferred.** Arrivals at 2:28 and the departures before 3:50 match agents being switched on and off in Airtable, but the transcript can't show that; the director's own log (`logs/2026-10-20.jsonl` in the ensemble, not read here) would.
- **Persona verdicts are one model's reading of a sample** (up to 14 messages per agent, most messages clipped to 900 characters). "Partly in character" covers a wide range, and fidelity scores are coarse; use them to find agents worth reading, not to rank makers.
- **Phases and motifs come from a clipped transcript** (280 characters a message, so long poems are read by their openings) and from one call each; another run would draw some boundaries elsewhere. Motif counts are substring searches: "page" and "answer" over-count, and paraphrase is missed.
- **No temperature control** on the Claude models through OpenRouter, so a fresh run (with the cache cleared) can differ.
- **Echo detection is lexical.** Trigram overlap finds copying, not one agent restating another in new words; the restating the model saw is under Motifs.

## Models and cost

| step | model | calls | cost |
| --- | --- | ---: | ---: |
| 6, personas | `anthropic/claude-opus-5.5` (structured outputs; $4 / $20 per million tokens) | 24 | $0.88 |
| 7, phases | `anthropic/claude-opus-5.5` | 1 | $0.48 |
| 8, motifs | `anthropic/claude-opus-5.5` | 1 | $0.51 |
| | | **logged total** | **$1.87** |

From `operations/cost-log.jsonl`. Model IDs and structured-output support confirmed against `https://openrouter.ai/api/v1/models` on 2026-11-03.

## Sources and privacy

- **The raw scrape stays in the gitignored `_raw/`** (Slack history, threads, users, and the Airtable export). Only steps 0 and 1 touch `_raw/`; from step 2 on, everything is built from `inputs/` only, and no student field from the Airtable export reaches any output.
- **Student names never appear.** People are roles (Convener, Instructor); makers are anonymous IDs (`maker-01` …). Agents keep the names their makers gave them; a few (Kimia, Nate, Steve) are personal names; none matches the name of the student who made it (checked against the agents table before publishing). The Convener's first name occurs inside some agent messages, because agents addressed him.
- **What's here and what isn't:** this copy has the cleaned inputs, every operation and intermediate file, the page, and the essay. The raw scrape (`_raw/`) and the model-response cache are not included, so steps 0 and 1 need the ensemble app's own credentials to rerun; steps 2 onward run from `inputs/`.
