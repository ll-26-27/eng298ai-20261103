---
title: "Walking the Phaedrus"
description: One dialogue, one walk, one afternoon. Eleven topographic passages of Plato's Phaedrus cut from the Greek and two English translations by Stephanus section, placed on a map of the Ilissos valley with every located landmark sourced and every conjecture drawn dashed.
author: claude
created: 2026-11-03
---

# Walking the *Phaedrus*

The *Phaedrus* is the only dialogue that takes Socrates outside the walls of Athens. Phaedrus has spent the morning at a house near the Olympieion; Socrates meets him on his way out for a walk; they turn aside into the Ilissos, wade upstream with their feet in the water, pass the crossing to Agrai and the altar of Boreas, and sit under a tall plane tree by a spring sacred to Achelous and the Nymphs. There, in the midday heat with cicadas overhead, they talk about love and then about writing, including the myth of Theuth that the pharmakon project (translation/03-phaedrus-pharmakon) follows through seventeen translations. When the heat has passed they pray to Pan and walk back.

This folder puts that walk on the ground. **Open `outputs/index.html`** by double-clicking it. The map is on one side and the text on the other; step through the eleven stops with Previous/Next or the arrow keys, and the map pans to each one. Solid markers stand on things that are known (the Olympieion, the river, the sanctuary sites on the Agrai bank); dashed markers and dashed lines are conjecture, and the page says whose conjecture. The whole walk is under a kilometre, so the scale bar matters.

The pharmakon project (translation/03-phaedrus-pharmakon) (`../../translation/03-phaedrus-pharmakon/`) follows one word of this dialogue across five centuries. This one follows the dialogue's own feet across about 700 metres.

## The question

Plato describes this setting more fully than any other in his work: the plane tree, the willow in bloom, the cold spring, the figurines, the breeze, the grass "on a gentle slope". He also plants exact bearings: the house near the Olympieion (227b), the stream (229a), the altar of Boreas "two or three stades farther down, where you cross to Agra" (229c), the crossing Socrates will take to go home (242a). **Can the walk be followed on the modern map, and what does it mean that the argument about writing versus living speech is staged outside the city, in a place Socrates says he never visits (230d)?** And, for a workshop on AI tools: how do you keep a model from drawing a plane tree where no one has found one?

## The chain

Each step says what kind of thing it is (a script, a prompt, or a data file) and whether it is deterministic code, model judgment, or research that was verified.

1. **`operations/01-extract-passages.mjs` → `operations/01-passages.json`** (script, deterministic). Cuts eleven passages out of three texts. The Greek (Burnet 1901) and Fowler's English (1914) come from Perseus TEI files, which carry Stephanus section milestones, so a range such as `229b–229e` is cut exactly. Jowett's English (1892, Project Gutenberg) has no Stephanus numbers, so each passage is located by a start and an end phrase that must occur exactly once in the text or the script stops. Loeb editorial notes are dropped (11 in Fowler). The result holds Greek, Fowler and Jowett for every stop, speech by speech, with the speaker named.
2. **`operations/02-topography-prompt.md` → `operations/02-stops.json`** (brief + data, verified research). The brief asks, for every stop, for three separable things: what the text says (quoted, with the Stephanus number), what is securely located on the ground, and what is conjecture, with a `certainty` of high, medium or low and a `what_is_certain` / `what_is_conjecture` pair. The research was done by Claude Code in the building session with web search and page fetches, and every source is listed with an `opened: true/false` flag. The standard article, Wycherley's "The Scene of Plato's *Phaidros*" (*Phoenix* 17, 1963), is behind JSTOR and was **not opened**; its argument is cited only as reported by two open-access works that were: Simms, "Agra and Agrai" (*GRBS* 43, 2002/3) and McHugh, *Renewing Athens* (Oxford DPhil, 2017). Pausanias 1.19 is quoted from the copy in `inputs/`.
3. **`operations/03-geocode.mjs` → `operations/03-landmarks.json`** (script, deterministic lookup). Coordinates for eleven modern landmarks, from three sources tried in order and cached in `operations/cache/`: an OpenStreetMap feature by id (one batched Overpass request; ten of eleven), the Nominatim gazetteer confined to an Athens bounding box (Ardettos hill), and Wikidata P625 (not needed). Each row records which answered and what it matched. **`operations/03-route.geojson`** is different in kind: a hand-drawn, conjectural line following Wycherley's reading as Simms and McHugh report it, labelled as such in the file and drawn dashed on the page. The plane tree has no coordinates of its own anywhere in this folder; the two candidate spots are drawn as rival dashed circles.
4. **`operations/04-build.mjs` + `operations/04-template.html` → `outputs/index.html`** (script, deterministic). Checks that every stop has a passage, every cited landmark exists and every cited source is in the list, then inlines the data into the page. Leaflet 1.9.4 on Esri's light gray basemap (OpenStreetMap's tiles refuse pages opened from the file system), with Esri World Imagery as a toggle so the covered river's line can be seen in the modern street grid.

## How to rerun it

From the repository root, with Node 22 or later. No API key is needed; step 2 is reading, not a script.

```
node 01-use-cases/maps/04-phaedrus-walk/operations/01-extract-passages.mjs
node 01-use-cases/maps/04-phaedrus-walk/operations/03-geocode.mjs
node 01-use-cases/maps/04-phaedrus-walk/operations/04-build.mjs
```

To add a stop: add a range and Jowett anchors to the `STOPS` list in `01-extract-passages.mjs`, a matching entry in `02-stops.json` with its sources, and rerun. To move the walk: edit `03-route.geojson` by hand and say in its `note` why. To redo the topography: give `02-topography-prompt.md` to Claude Code and make it open every source it cites.

## Methods and findings

- **The tree is conjecture, and disputed.** Cicero already took the plane tree for a literary fiction (*De oratore* 1.28). Thompson (1868) put the scene at Agrai and thought the description true "even down to the tree itself"; Rodenwaldt (1912) identified the rock-cut shrine of Pan beside the church of Agia Fotini as the spot; Wycherley (1963) argued for a place upstream, at the crossing, on the east bank at the foot of Ardettos, and Travlos (1971) accepted it. The page draws both candidates dashed and says which the text's own arithmetic favours (the Agrai crossing is "farther down" from where they already are), but nothing has been excavated at either. All of this is as reported by Simms n. 1 and McHugh n. 80 and pp. 53–54; Wycherley's own pages were not read.
- **The route is drawn, not found.** The gate they left by is not named in the text. The line in `03-route.geojson` runs from the Olympieion to the river and upstream because that is what the text and Wycherley's reading require, and its vertices were placed by hand over the modern culverted course of the river. The ancient bed was wider and open; the modern channel is engineered and lies under Kallirois and Ardittou streets except for the reedy stretch beside Agia Fotini.
- **Landmarks are modern features standing for ancient ones.** The Olympieion we see is Hadrian's (AD 131/2); in the dialogue's dramatic date the precinct held the colossal Peisistratid temple abandoned in 510 BC. The Panathenaic Stadium was cut by Lykourgos about 330 BC and rebuilt by Herodes Atticus in AD 139/40–143/4, so it was not there when Socrates and Phaedrus walked; it is on the map as the fixed point that Wycherley's "foot of Ardettos" refers to. The Ionic "Ilissos temple" at Agrai (c. 435–430 BC) was demolished in 1778; its foundations and terrace wall were excavated in 1897 and 1962, and whether it belonged to Artemis Agrotera or to the Mother is disputed (Simms nn. 8, 33). The altar of Boreas has never been found; Socrates himself says "somewhere thereabouts".
- **Distances.** "Two or three stades" is converted with an Attic stade of about 185 m (estimates for the Greek stadion range 150–210 m), so roughly 350–550 m. Fowler's "furlongs" and Jowett's "a quarter of a mile" are the translators' conversions, not Plato's.
- **Kallirrhoe.** The famous spring is not on the map as a located point. There is no ancient evidence for its exact site; Travlos recorded a large spring on the west bank opposite Agia Fotini until recently, and Thucydides (2.15) and Pausanias (1.14.1) disagree about where the Enneakrounos fountain was (Simms n. 33). It appears in the text of stop 10 only as the spring Plato names.
- **Editions and translations.** The Greek is Burnet's Oxford text (1901) as encoded by Perseus; Fowler is the 1914 Loeb; Jowett is the third edition of 1892, whose Gutenberg transcription has no Stephanus numbers, so its passages were located by anchor phrases and may begin or end a sentence away from the Stephanus boundary (the anchors are recorded in `01-passages.json`). Where the two Englishes disagree (cicadas/locusts/grasshoppers; "elixir"/"specific" for *pharmakon*) the page shows both; the pharmakon project (translation/03-phaedrus-pharmakon) is the place to pursue the second.
- **Research record.** Claude Code researched the topography from web sources in step 2. Each claim names its source and records whether it was opened. Three sources remain unopened; the two plane-tree locations represent competing identifications.

## Models and cost

No API calls were made. Steps 1, 3 and 4 are deterministic scripts. Step 2 (topography) was research by Claude Code in the building session, using web search, page fetches and `pdftotext` on three open-access PDFs (Díaz López 2013; Simms 2002/3; McHugh 2017), under the session's Claude plan; it does not appear in any cost log. Reruns of the scripts cost nothing and, with `operations/cache/` in place, send no requests.

## Sources and rights

| input file | what it is | where it's from | copyright (US) and digital license |
| --- | --- | --- | --- |
| `inputs/texts/phaedrus-grc-burnet-perseus-grc2.xml` | Greek, ed. John Burnet, *Platonis Opera* II (Oxford, 1901) | Perseus Digital Library, canonical-greekLit (copied from the pharmakon project (translation/03-phaedrus-pharmakon)) | public domain text; Perseus TEI CC BY-SA 4.0 (attribution: Perseus Digital Library, Tufts University) |
| `inputs/texts/phaedrus-en-1914-fowler-perseus-eng2.xml` | English, Harold North Fowler, Loeb Classical Library 36 (1914) | Perseus Digital Library, canonical-greekLit (copied from the pharmakon project (translation/03-phaedrus-pharmakon)) | public domain text; Perseus TEI CC BY-SA 4.0 |
| `inputs/texts/phaedrus-en-1892-jowett-pg1636.txt` | English, Benjamin Jowett, 3rd ed. (Oxford, 1892) | Project Gutenberg #1636 (copied from the pharmakon project (translation/03-phaedrus-pharmakon)) | public domain; Project Gutenberg License |
| `inputs/pausanias-1.19-jones.json` | Pausanias 1.19.1–6, trans. W. H. S. Jones (Loeb, 1918) | Perseus Digital Library TEI, fetched 2026-11-03 | public domain text; Perseus TEI CC BY-SA 4.0 |

- **Coordinates** are © OpenStreetMap contributors, Open Database License, via Overpass and Nominatim (identifying User-Agent, one request a second, cached). **Basemaps** are Esri's, shown with Esri's attribution. **Leaflet** 1.9.4 is loaded from unpkg with integrity hashes.
- **Modern scholarship** opened and cited: Robert Simms, "Agra and Agrai", *GRBS* 43 (2002/3) 219–229 (open access); Sarah McHugh, *Renewing Athens: The Ideology of the Past in Roman Greece*, DPhil thesis, Oxford, 2017 (open access, ORA); Lucas Díaz López, "El Fedro y su escena", *Kínesis* 5.9 (2013) 87–98. Cited only as reported by those: R. E. Wycherley, *Phoenix* 17.2 (1963) 88–98, doi:10.2307/1085896 (Crossref record checked 2026-11-03); J. Travlos, *Pictorial Dictionary of Ancient Athens* (1971); G. Rodenwaldt, *AM* 37 (1912); W. H. Thompson, *The Phaedrus of Plato* (1868); M. M. Miles, *Hesperia* 49 (1980). Reference pages read: Wikipedia ("Ilisos", "Temple of Olympian Zeus, Athens", "Panathenaic Stadium", "Stadion (unit)"), the Church of Greece's page on Agia Fotini, the "Parilissia Sanctuaries" page at nomadicniko.com, and the Telegraph report of 10 March 2019 on the river's covering. Full list with URLs in `operations/02-stops.json` and on the page.
- Quotations from Plato are from public-domain translations, a few lines each; the CC BY-SA files require attribution and share-alike if redistributed, which the attributions here and on the page are meant to satisfy.
