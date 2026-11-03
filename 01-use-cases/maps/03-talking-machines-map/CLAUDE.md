# Talking-machines map use case

Read README.md first, then operations/02-places-prompt.md. Treat inputs/ as source material copied from the timeline (maps/02-ai-and-literature-timeline) and the context pack; never edit it. If the timeline (maps/02-ai-and-literature-timeline) changes, re-copy its CSV and JSON into inputs/ rather than editing them here.

Run the scripts from the repository root with Node 22 or later. Steps 1, 3, and 4 are deterministic code and need no key. Step 2 is research: to add or change a row, follow the brief in 02-places-prompt.md, open the sources, and write the row into 02-places.json (under `rows` for an event that exists in the timeline (maps/02-ai-and-literature-timeline), under `added` for a new one) or 02a-affiliations.json (for a paper). Record what you opened in `opened`. Never write a place you have not seen on a page in this session, and never type coordinates: step 3 looks them up.

Keep the place rule in README.md and the prompt in agreement. If you change the rule, change both, and rerun step 2 for every row the change affects.

After rerunning step 3, read the `geo_match` column of 03-geocoded.csv for any new or changed query before trusting the point; the gazetteer matches names, and a tighter query beats a looser test.

Do not overwrite outputs/index.html by hand; edit 04-template.html and run step 4. Keep the page self-contained: data inline, libraries from unpkg with the integrity hashes already in the template, Esri tiles as the default base map (OpenStreetMap's tiles can refuse a page opened from file://).

Describe model work honestly in the README's "Models and cost" section: the research in this folder was done in-session by Claude Code with no API calls, and that is what the section says.
