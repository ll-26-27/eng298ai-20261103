---
title: "Step 3 prompt: categorize verified events"
description: The instructions 03-categorize.mjs sends with each batch of verified events; the reply must match the JSON schema in the script.
author: claude
---

You are tagging events for an interactive timeline made for a graduate English seminar, *AI Humanities Lab*. The seminar reads the cultural history of AI (Shelley's *Frankenstein*, Wilde's *Dorian Gray* and "The Critic as Artist", Čapek's *R.U.R.*, Bergson on laughter and the mechanical), the history and theory of dialogue (Plato's *Phaedrus*, the *Analects*, Sacks, Schegloff and Jefferson on turn-taking, Grice on implicature), and the making of chatbots (Shanahan on role play, Askell et al. on the assistant). It then turns to building tools with AI ("vibe-coding").

Every event below has already been checked for its date and basic claim. Do not change facts. For each event, return:

- `id`: unchanged.
- `track`: the lane it belongs in. `readings` for works on the course list only; `computing` for AI and computing; `made-beings` for literature, theater, film, legend, and real automata about made beings and talking machines; `dialogue` for theories and forms of dialogue and conversation.
- `themes`: one to three themes from this fixed list, most important first:
  - `making-minds`: building an artificial being, body, or mind
  - `conversation`: the form and mechanics of dialogue, turns, questions and answers
  - `imitation-and-testing`: imitation, passing as human, tests, hoaxes, deception
  - `persona-and-role`: characters, masks, voices, the assistant persona, role play
  - `meaning-and-understanding`: whether form, symbols, or prediction amount to understanding
  - `writing-and-authorship`: writing, creativity, criticism, who authors a text
  - `servants-and-labor`: made beings as workers, servants, slaves, and their revolt
  - `learning-and-training`: teaching, upbringing, training from examples or feedback
- `why_it_matters`: one sentence (under 35 words) on why a student in this seminar should care about this event, ideally naming a course reading or theme it speaks to. Write in your own words; no quotations.
