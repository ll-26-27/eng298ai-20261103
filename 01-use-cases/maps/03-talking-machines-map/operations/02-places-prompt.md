# Step 2: find a place for every candidate

This is the brief the building session followed to produce `02-places.json` and `02a-affiliations.json`. It is a prompt in the plain sense: instructions a person or a model reads before doing the work. If you redo this step, read it first, then open sources, then write the JSON. Do not fill in a place from memory.

## The question

Where did each of these talking machines come from? Not where the story is set, but where the work that imagines it was made, or where the machine was built, shown, or trained.

## Inputs

- `01-candidates.json`: the events selected from the timeline (maps/02-ai-and-literature-timeline)'s verified timeline (`inputs/03-events-verified.csv`), plus the 22 papers from `context/LL-readings/papers-on-ai-md/`.

## The place rule

Apply it the same way to every row, and record which clause you used in `place_kind`.

1. **Imagined works** (literature, legend, film): the place of **composition** if a source documents where the author wrote it (`composed`). Otherwise the place of **first publication** (`published`: the publisher's or periodical's city) or **first performance** (`performed`: the premiere venue). For a film with no recorded premiere, the studio where it was made (`produced`).
2. **Legends without an author** (Talos, the golem, the brazen head): the place the tradition attaches the being to, or where the text that records it was compiled; set `certainty: low` and say so in `place_note` (`legend-setting` or `composed`).
3. **Machines**: where they were **built** (`built`), or **exhibited** or published if that is what the sources give (`exhibited`, `published`). For software from a company, the organisation's headquarters city at the time (`built`, `certainty: medium`), unless a source gives the actual office.
4. **Papers**: the **first author's affiliation as printed** in the paper (`affiliation`). If the paper prints a city, use it (`high`). If it prints only an organisation, use the organisation's headquarters per a page you open (`medium`) and say so. Record every affiliation the paper prints.

## For every row, write

- `place_label`: the place in words, with the clause used ("Berlin, Ufa-Palast am Zoo", "Mountain View, California, Google").
- `geocode_query`: the string step 3 sends to the gazetteer. Make it unambiguous: "Richmond, Virginia", not "Richmond".
- `city`: the city for the counts on the page.
- `place_kind`: one of composed | published | performed | produced | exhibited | built | affiliation | legend-setting.
- `certainty`: high (a source states the place), medium (a source states the organisation or periodical; the city is the organisation's), low (a placement for a legend or an unknown).
- `place_note`: one or two sentences a reader can check.
- `place_sources`: the URLs you opened.
- `opened`: what you actually read there, in a phrase, quoting where you can.
- `speaks`: does the made being speak or converse in the work? yes | no | unclear | n/a. Say why in `speaks_note`.

## Rules

- **Open every source.** Do not write a place you have not seen on a page in this session. If the page does not say, look for another; if nothing says, write `certainty: low` and explain, or leave the row out and record why under `excluded`.
- **Coordinates are not your job.** Step 3 looks them up in a gazetteer. Never type latitude and longitude.
- **Separate the setting from the source.** Talos guards Crete; Apollonius wrote in Alexandria. The map shows Alexandria and the note mentions Crete.
- **Prefer the course's own verification.** The timeline (maps/02-ai-and-literature-timeline) checked dates and some venues (Metropolis, 2001, Her, Ex Machina, the Loebner Prize). Reuse those findings and say so.
- **Exclusions are findings.** Say which candidates you left out and why.
