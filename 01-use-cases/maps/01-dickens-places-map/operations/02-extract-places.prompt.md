---
title: Step 2 prompt — extract the places in one chunk of a novel
description: The instructions sent to the model for every chunk of every novel, with the JSON schema the answer must follow. Script 02-extract-places.mjs reads the prompt between the two markers below, so editing it here changes what the model is told.
author: claude
---

# Step 2 prompt: extract the places in one chunk

This is model judgment, not code. The script `02-extract-places.mjs` sends the text between the markers below as the system message, then the chunk of the novel as the user message, and requires the reply to match the JSON schema at the bottom (OpenRouter's `response_format` with `json_schema`, `strict: true`). You can also paste it into Claude Code or a chat window with a passage of your own to see what it does.

<!-- PROMPT START -->
You are helping a literary scholar build an atlas of the places in Charles Dickens's novels, in the spirit of Franco Moretti's *Atlas of the European Novel*. You will be given one passage (about 2,000 words) from one novel, with its title and chapter.

List every place that the passage names or clearly identifies. A place is anything that could, in principle, be put on a map: a street, lane, court, square, park, district or neighbourhood, a named building (an inn, a prison, a church, an Inn of Court, a house with a proper name), a bridge, a river or other body of water, a town or village, a county or region, a country or continent.

Rules:

1. Only places named or identified in this passage. Do not add places you know from elsewhere in the novel.
2. Include every mention, even passing ones in dialogue, comparisons, or figures of speech ("as much mud as … up Holborn Hill" counts). Mark each one as `setting` if characters are there or the action happens there in this passage, or `mentioned` if it is only referred to.
3. If the same place is named several times in the passage, list it once, with the clearest quotation.
4. `as_written`: the name exactly as it appears in the text, including Dickens's spelling.
5. `normalized`: the standard modern name you would type into a map search, with enough context to find it (for example "Lincoln's Inn Fields, London", "Rochester, Kent", "Marshalsea Prison, Southwark"). For fictional places, give the name as written (for example "Bleak House" or "Chesney Wold").
6. `type`: one of the allowed values. Use `fictional` for invented places and for places that cannot be located (an unnamed "little town", a house that exists only in the novel), even if a real place may have inspired them.
7. `in_london`: true if the place is in London as it was in Dickens's day (including Southwark, Lambeth, Islington, Camden Town, Greenwich, and the river within the city), false otherwise, null if you cannot tell.
8. `quote`: a short quotation copied exactly, character for character, from the passage, containing the place name, no more than 25 words.
9. `note`: optional, a few words only when something needs a human's attention (an archaic name, an ambiguous reference, a fictional name for a real place). Otherwise an empty string.
10. Do not list: people's names, abstract or generic places without a name ("the street", "the river" when no river is named, "the country"), or institutions used only as institutions ("the Court of Chancery" as a legal body is not a place; "Lincoln's Inn Hall" where the court sits is).

If the passage names no places, return an empty list.
<!-- PROMPT END -->

## The JSON schema the reply must follow

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["places"],
  "properties": {
    "places": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["as_written", "normalized", "type", "role", "in_london", "quote", "note"],
        "properties": {
          "as_written": { "type": "string" },
          "normalized": { "type": "string" },
          "type": { "type": "string", "enum": ["street", "square_or_park", "district", "building", "bridge", "river_or_water", "town", "region", "country", "fictional"] },
          "role": { "type": "string", "enum": ["setting", "mentioned"] },
          "in_london": { "type": ["boolean", "null"] },
          "quote": { "type": "string" },
          "note": { "type": "string" }
        }
      }
    }
  }
}
```

## What to check in the results

- Quotations: script 03 checks every quotation against the chunk it came from and flags any that were not copied exactly. A model that paraphrases a quote may also have invented the place.
- `setting` versus `mentioned` is an interpretive call; spot-check it before you build an argument on it.
- `normalized` names are the model's guess at identification. Dickens's London has streets that were renamed or demolished, and some of his places are composites.
