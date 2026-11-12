---
title: Step 5 prompt — design the map
description: The short design brief for the Frankenstein map, adapted from the Dickens map's brief; it says what the map should make visible before it says how it should look.
author: claude
---

# Step 5 prompt: design the map

This step is a conversation, not a script: the brief below is what `06-map-template.html` and `06-build-map.mjs` were written to. It began as the Dickens map's brief (`../../01-dickens-places-map/operations/05-map-design.prompt.md`) and was changed where *Frankenstein* asks different questions: one novel in two texts instead of eight novels, a frame narrative instead of a single narrator, and a continent and an ocean instead of a city. Moretti's point was that a map is a question asked of a text, so start from what you want to see.

## The brief

> Build a single self-contained HTML page (it must open by double-clicking, so embed the data inline) that maps the places in `04-places-geocoded.csv` and the mentions in `data/03-mentions.jsonl`. Use Leaflet 1.9.4 and keyless Esri tiles, with the required attribution.
>
> The map should make these things visible:
>
> 1. **Whose story each place belongs to.** Walton, Victor, and the Creature each narrate a frame. Colour by narrator by default, with a switch to colour by edition; filter by either. A circle's size grows with the number of mentions (by area, not radius).
> 2. **What the 1831 revision changed.** List the places named in one text and not the other, and separate the differences in Shelley's text from differences in the model's reading of it (step 3c).
> 3. **Where the action happens versus what is only talked about.** A toggle to count only mentions where the model judged the scene is set there.
> 4. **The novel's itineraries.** Open on Europe; give one-click views for Geneva and the Alps, the Rhine journey, Britain (Oxford, Cumberland, Edinburgh, Perth, the Orkneys), the Arctic, and the world. Offer a shaded-relief layer for the mountains.
> 5. **How sure we are.** Gazetteer coordinates drawn solid; model estimates drawn dashed and switchable off; places that couldn't be located listed beside the map rather than silently dropped.
> 6. **The evidence.** Click a place to see every mention: edition, chapter, narrator, whether it is a setting, and the quoted words.
>
> Countries, continents, and seas should read as lighter than points (towns, peaks, glaciers, rivers), because a circle for "England" means something different from a circle for "the Mer de Glace"; let readers hide them. Keep it clean, serious, and readable: serif headings, plenty of white space, no chart junk.

## What a scholar should ask of the result

- Victor names most of the places. Is that because his story is the longest, or because his is the travelling narrative? The table "Who names which places" gives the counts; compare them with each narrator's share of the words (README).
- The Creature's places are mostly second-hand: Paris, Leghorn, and Constantinople belong to the De Lacey and Safie story he overhears. Toggle "only scenes set there" and see what is left of his geography.
- Does counting mentions measure importance? The Orkney island where Victor builds and destroys the second creature is unnamed, so it is not on the map at all.
