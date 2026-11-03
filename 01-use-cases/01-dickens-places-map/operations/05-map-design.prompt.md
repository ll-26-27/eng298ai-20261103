---
title: Step 5 prompt — design the map
description: The short design brief given to Claude Code to build the map from the geocoded inventory; it says what the map should make visible before it says how it should look.
author: claude
---

# Step 5 prompt: design the map

This step is a conversation, not a script: the brief below is what was given to Claude Code to write `06-map-template.html` and `06-build-map.mjs`. Change the questions and you get a different map. Moretti's point was that a map is a question asked of a text, so start from what you want to see.

## The brief

> Build a single self-contained HTML page (it must open by double-clicking, so embed the data inline) that maps the places in `04-places-geocoded.csv` and the mentions in `data/03-mentions.jsonl`. Use Leaflet 1.9.4 and OpenStreetMap tiles, with the required attribution.
>
> The map should make these things visible:
>
> 1. **Which parts of London each novel lives in.** One colour per novel; filter by novel; a circle's size grows with the number of mentions (by area, not radius, so big places don't swamp small ones).
> 2. **Where the action happens versus what is only talked about.** A toggle to count only mentions where the model judged the scene is set there.
> 3. **The City, the West End, the East End, the river, and south of it.** Open on central London, where the Thames does the orienting; give one-click views for London, Britain, and the wider world.
> 4. **How sure we are.** Gazetteer coordinates drawn solid; model estimates drawn dashed and switchable off; places that couldn't be located listed beside the map rather than silently dropped.
> 5. **The evidence.** Click a place to see every mention: novel, chapter, whether it is a setting, and the quoted words.
>
> Areas (districts, towns, counties, countries) should read as lighter than points (streets, buildings, bridges), because a circle for "Southwark" means something different from a circle for "the Marshalsea". Keep it clean, serious, and readable: serif headings, plenty of white space, no chart junk.

## What a scholar should ask of the result

- Are the clusters about Dickens's London, or about which places the gazetteer could find? Unresolved places skew towards demolished and renamed ones, which skews towards the poorer parts of the city.
- Does counting mentions measure importance? One long scene in a single place may weigh more than twenty passing references.
