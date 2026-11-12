---
title: Step 2 prompt — extract the places in one chunk of Frankenstein
description: The instructions sent to the model for every chunk of both texts, with the JSON schema the answer must follow. Script 02-extract-places.mjs reads the prompt between the two markers below, so editing it here changes what the model is told.
author: claude
---

# Step 2 prompt: extract the places in one chunk

This is model judgment, not code. The script `02-extract-places.mjs` sends the text between the markers below as the system message, then the chunk as the user message (with its edition, chapter, and narrator), and requires the reply to match the JSON schema at the bottom (OpenRouter's `response_format` with `json_schema`, `strict: true`). You can also paste it into Claude Code or a chat window with a passage of your own to see what it does.

<!-- PROMPT START -->
You are helping a literary scholar build an atlas of the places in Mary Shelley's *Frankenstein*, in the spirit of Franco Moretti's *Atlas of the European Novel*. You will be given one passage (about 1,000 words) from the 1818 or the 1831 text, with its chapter and its narrator (Walton, Victor Frankenstein, or the Creature).

List every place that the passage names or clearly identifies. A place is anything that could, in principle, be put on a map: a town or city, a village, a country, a region or mountain range, a mountain or glacier, a lake, river, sea, or ocean, an island, a valley, a named house or estate, a university, a church or other named building, a street or district.

Rules:

1. Only places named or identified in this passage. Do not add places you know from elsewhere in the novel.
2. Include every mention, even passing ones in dialogue, comparisons, books the characters read, or figures of speech. Mark each one as `setting` if the narrator or characters are there or the action happens there in this passage (including travel through it), or `mentioned` if it is only referred to.
3. If the same place is named several times in the passage, list it once, with the clearest quotation.
4. `as_written`: the name exactly as it appears in the text, including Shelley's spelling ("Strasburgh", "Chamounix", "Montanvert", "Archangel").
5. `normalized`: the standard modern name you would type into a map search, with the country or region for context (for example "Strasbourg, France", "Chamonix, France", "Montenvers, Chamonix, France", "Arkhangelsk, Russia", "Mer de Glace, Chamonix, France"). For fictional places, give the name as written (for example "Belrive").
6. `type`: one of the allowed values. Use `fictional` for invented places and for places that cannot be located (an unnamed "remotest of the Orkneys" island, a hovel, a cottage in Germany), even if a real place may have inspired them. Use `mountain_or_glacier` for peaks, glaciers, passes, and ranges such as the Alps or the Jura; `region` for provinces, counties, and named areas such as Tartary or Cumberland; `water` for lakes, rivers, seas, and oceans.
7. `quote`: a short quotation copied exactly, character for character, from the passage, containing the place name, no more than 25 words.
8. `note`: optional, a few words only when something needs a human's attention (an archaic name, an ambiguous reference, a place that has since changed its name). Otherwise an empty string.
9. Do not list: people's names, nationalities used as adjectives ("an English lady", "the German language"), abstract or generic places without a name ("the cottage", "the lake" when no lake is named, "the north" as a direction), or celestial places ("heaven", "hell", "the moon") unless used as a name for somewhere on earth.

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
        "required": ["as_written", "normalized", "type", "role", "quote", "note"],
        "properties": {
          "as_written": { "type": "string" },
          "normalized": { "type": "string" },
          "type": { "type": "string", "enum": ["street", "district", "building", "town", "region", "country", "mountain_or_glacier", "water", "island", "fictional"] },
          "role": { "type": "string", "enum": ["setting", "mentioned"] },
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
- `setting` versus `mentioned` is an interpretive call, and in a frame tale it is a subtle one: the De Lacey family's Paris is a setting of the story the Creature overheard, not of the Creature's own scenes. Spot-check it before you build an argument on it.
- `normalized` names are the model's identification. Shelley's spellings (Strasburgh, Mayence, Servox) are older forms of real places; "Belrive" is the Frankenstein estate and has no certain site.
