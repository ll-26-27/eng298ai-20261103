# Use cases

Worked examples of the inputs → operations → outputs workflow, grouped by
what they do. Each extends the workflow in one direction: scale, language,
tools, loops, or a new form of output.

| Group | What the examples do | Start with |
|---|---|---|
| [`_writing/`](_writing/) | Books, notebook, paper: writing a seminar paper with AI, the smaller art of pulling quotes and seeing a text's skeleton, and, with no model at all, Wordle rebuilt. | [`02-quotes-and-outlines/`](_writing/02-quotes-and-outlines/) |
| [`translation/`](translation/) | A French passage through a prompt chain; the creature's plea across 21 translations of *Frankenstein*; one word of the *Phaedrus* across five centuries. | [`01-bergson-laughter-chain/`](translation/01-bergson-laughter-chain/) |
| [`maps/`](maps/) | Dickens's places after Moretti; a verified timeline of AI and literature; where talking machines were imagined, built, and trained; Socrates's walk out of Athens. | [`01-dickens-places-map/`](maps/01-dickens-places-map/) |
| [`distant-reading/`](distant-reading/) | Every change between the two *Frankensteins*; keyword search against a model's reading of 982 passages. | [`02-distant-and-close-reading/`](distant-reading/02-distant-and-close-reading/) |
| [`simulation/`](simulation/) | A library committee and a Socratic classroom: give chatbots a shared room, readings and memory, then invite your own persona. | [Library](simulation/README.md) · [Classroom](simulation/02-socratic-classroom/README.md) |

## Every example

| Use case | What you will do | Start here |
|---|---|---|
| [Simulation · The Common Room](simulation/) | Extend your chatbot into a committee of four personas; inspect twenty actual model-generated replies and add a fifth participant. | [Guide](simulation/README.md) · [HTML](simulation/outputs/index.html) · [Transcript](simulation/outputs/conversation.md) |
| [Simulation · A Socratic classroom](simulation/02-socratic-classroom/) | An imagined Socrates and four students test what counts as learning through definitions, counterexamples and revisions. | [Guide](simulation/02-socratic-classroom/README.md) · [Classroom](simulation/02-socratic-classroom/outputs/index.html) |
| [Writing · 01 · Seminar paper](_writing/01-seminar-paper/) | Run the whole arc: brief, reading notes, brainstorm, thesis, quote bank, outline, draft, judges, your feedback, note on method. One complete run: the *Phaedrus* against Shanahan's role-play paper. | [Guide](_writing/01-seminar-paper/README.md) · [Paper](_writing/01-seminar-paper/paper/final.html) |
| [Writing · 02 · Quotes and outlines](_writing/02-quotes-and-outlines/) | Pull the passages out of one text, see its skeleton, sketch three papers. Worked on Grice. | [Guide](_writing/02-quotes-and-outlines/README.md) · [Quote bank](_writing/02-quotes-and-outlines/notebook/work/Q1_quotes_grice.md) |
| [Writing · 03 · Word clouds](_writing/03-word-clouds/) | Run Jonathan Feinberg's 2008 Wordle algorithm, rewritten in Python, on the Preface to *Dorian Gray*; check the picture against the counts. | [Guide](_writing/03-word-clouds/README.md) · [Page](_writing/03-word-clouds/paper/index.html) |
| [Translation · 01 · Bergson's *Le Rire*](translation/01-bergson-laughter-chain/) | Translate Bergson's French through a visible prompt chain, then read an annotated bilingual page. | [Guide](translation/01-bergson-laughter-chain/README.md) · [Output](translation/01-bergson-laughter-chain/outputs/example/annotated-translation.html) |
| [Translation · 02 · *Frankenstein* in translation](translation/02-frankenstein-translations/) | Follow the creature's plea through 21 translations in 14 languages, back-translated and read for connotation; then the first translations into 25 languages. | [Guide](translation/02-frankenstein-translations/README.md) · [Page](translation/02-frankenstein-translations/outputs/index.html) · [Essay](translation/02-frankenstein-translations/outputs/essay/essay.md) |
| [Translation · 03 · *Pharmakon*](translation/03-phaedrus-pharmakon/) | Trace one word of the *Phaedrus* across 17 translations and five centuries. | [Guide](translation/03-phaedrus-pharmakon/README.md) · [Page](translation/03-phaedrus-pharmakon/outputs/index.html) · [Essay](translation/03-phaedrus-pharmakon/outputs/essay/essay.md) |
| [Maps · 01 · Dickens's places](maps/01-dickens-places-map/) | Map every place named in eight Dickens novels, after Moretti, with the passages behind each point. | [Guide](maps/01-dickens-places-map/README.md) · [Map](maps/01-dickens-places-map/outputs/index.html) · [Essay](maps/01-dickens-places-map/outputs/essay/essay.md) |
| [Maps · 02 · AI and literature timeline](maps/02-ai-and-literature-timeline/) | Read a checked timeline of AI, literature, theories of dialogue, and the course readings, antiquity to 2026. | [Guide](maps/02-ai-and-literature-timeline/README.md) · [Timeline](maps/02-ai-and-literature-timeline/outputs/index.html) · [Essay](maps/02-ai-and-literature-timeline/outputs/essay/essay.md) |
| [Maps · 03 · Where does the machine speak from?](maps/03-talking-machines-map/) | Map where talking machines were imagined, built, and trained, from Homer to the papers behind the assistant, with a year slider. Built from the timeline's output. | [Guide](maps/03-talking-machines-map/README.md) · [Map](maps/03-talking-machines-map/outputs/index.html) |
| [Maps · 04 · Walking the *Phaedrus*](maps/04-phaedrus-walk/) | Follow Socrates and Phaedrus out of the city and up the Ilissos, the text aligned to the map, conjecture drawn dashed. | [Guide](maps/04-phaedrus-walk/README.md) · [Map](maps/04-phaedrus-walk/outputs/index.html) |
| [Distant reading · 01 · *Frankenstein* revisions](distant-reading/01-frankenstein-revisions/) | See every change between the 1818 and 1831 editions, categorized and checked. | [Guide](distant-reading/01-frankenstein-revisions/README.md) · [Page](distant-reading/01-frankenstein-revisions/outputs/index.html) · [Essay](distant-reading/01-frankenstein-revisions/outputs/essay/essay.md) |
| [Distant reading · 02 · Scenes of instruction](distant-reading/02-distant-and-close-reading/) | Compare keyword search with a model's reading of 982 passages for scenes of instruction. | [Guide](distant-reading/02-distant-and-close-reading/README.md) · [Page](distant-reading/02-distant-and-close-reading/outputs/index.html) · [Essay](distant-reading/02-distant-and-close-reading/outputs/essay/essay.md) |

The numbered projects were made in a morning by a model and a few scripts.
Each folder's own README has the full chain, sources, costs, and caveats.

## How each use case is organized

```text
<use-case>/
  inputs/        source material
  operations/    numbered steps: prompts, scripts, and the in-between data files they pass along
  outputs/       one HTML page; double-click outputs/index.html
  outputs/essay/ in the six numbered projects, an illustrated essay about the project as Markdown and a printable PDF
  summary.md     purpose, workflow, and limitations
  index.md       file-by-file guide
  CLAUDE.md      Claude Code instructions; readable explicitly in other apps
```

The `_writing/` examples use the older names for the same three folders:
`books/`, `notebook/`, `paper/`.

Read an example's `README.md` to try it, or `summary.md` for its purpose. Use
`index.md` to find a specific file. The outputs are examples, not guaranteed
results for new source material. In Claude Desktop or another app, ask the
assistant to read the example's `CLAUDE.md` before starting; Claude Code loads
it automatically.

Shared course readings and AI-paper guides are in [`context/`](../context/).

## Outputs that became inputs

The timeline (`maps/02`) was drafted by a model and checked event by event;
the talking-machines map (`maps/03`) takes that checked CSV as its input. The
*pharmakon* project (`translation/03`) gathered seventeen translations of
one passage of the *Phaedrus*; the walk (`maps/04`) borrows its Greek and
English texts. That is the circle the top-level README describes, running
inside one folder.

## The projects at a glance

### Translation · 01 · Bergson's *Le Rire*

- **Inputs:** the opening of Chapter I of *Le Rire* (1938 Alcan text via Wikisource), a source record, Brereton and Rothwell's 1911 English for comparison, and an editorial brief.
- **Operations:** nine saved prompts: source check → lexicon → context and rhythm → draft → critique → revision → published comparison (withheld until then) → editorial changes → annotation; a Python runner and a notebook.
- **Output:** one bilingual, annotated page with six aligned segments and four notes on choices a student can question.

### Translation · 02 · *Frankenstein* in translation: the creature's plea

- **Inputs:** the 1818 and 1831 English texts, the 1821 French and 1912 German translations, and the plea ("I ought to be thy Adam; but I am rather the fallen angel … misery made me a fiend") quoted from 19 later translations, each cited to its printed edition.
- **Operations:** find the plea in 21 translations across 14 languages, 1821–2025 → code re-finds each quotation in its source → a model back-translates each and notes what its words add (fiend as devil, demon, ogre, enemy…), some checked against dictionaries → a model compares what each translator highlighted or muted. Below that, the first translation into 25 languages, researched and verified.
- **Output:** a card per translation with key words highlighted, back-translation, and connotation notes; a matrix of how *Adam*, *fallen angel*, *benevolent*, *misery*, and *fiend* were rendered; a grid placing each version between demonic and pitiable, biblical and secular; the synthesis; then the first-translations timeline.

### Translation · 03 · *Pharmakon*: one word across five centuries

- **Inputs:** the Greek of *Phaedrus* 274c–275b (Theuth and Thamus) and 17 public-domain translations in 10 languages, Ficino (1484) to Meunier (1922).
- **Operations:** find the passage in each translation → a model pulls out how each renders *pharmakon*, *mnēmē*, *hypomnēsis*, and *sophia*, and sorts *pharmakon* by sense → code confirms each rendering appears word for word → a model back-translates each passage.
- **Output:** the Greek with clickable key words; a timeline of each word's renderings by year, colored by sense; the passages side by side with back-translations.

### Maps · 01 · Dickens's places: a map after Moretti

- **Inputs:** eight Dickens novels from Project Gutenberg, *Oliver Twist* to *Our Mutual Friend*.
- **Operations:** code cuts each novel into chunks by chapter → a model lists every place name in each chunk, with a quote → code merges them into an inventory (1,116 places) → a free gazetteer finds coordinates; a model estimates a few it can't → a short brief on what the map should show.
- **Output:** a map of London, Britain, and abroad. Tick novels on and off, show only scenes set at a place, search; click a circle to read its passages. Dashed circles are the model's guesses.

### Maps · 02 · A timeline of AI and literature

- **Inputs:** the course reading list (titles and dates only) and the history of AI.
- **Operations:** a model drafts 112 events → each one checked against Wikipedia, arXiv, or Crossref records (23 corrected) → a model sorts each into a lane and themes → code builds the page.
- **Output:** a timeline in four lanes, split into eras so antiquity and 2026 both fit. Filter, search, zoom; click an event for its source and checking status. A panel lists what the checking caught.

### Maps · 03 · Where does the machine speak from?

- **Inputs:** the timeline's verified events (its made-beings lane, the literary course readings, the conversational machines), five further talking machines with sources, and the 22 AI papers by first author's printed affiliation.
- **Operations:** code selects 80 rows → a model, in session, researches one place per row from opened sources under a written place rule, with a certainty and a `speaks` judgment → code geocodes every place through OpenStreetMap's gazetteer, accepting only name-verified matches → code builds the page.
- **Output:** a world map with a year slider. The imagined layer spreads across Eurasia over 2,700 years; the built layer appears in a few cities after 1791; the trained layer sits in about nine cities after 2013. Low-certainty rows are dashed.

### Maps · 04 · Walking the *Phaedrus*

- **Inputs:** Burnet's Greek and Fowler's and Jowett's English, copied from the *pharmakon* project; Pausanias 1.19 on the Ilissos.
- **Operations:** code cuts eleven passages by Stephanus number → a model, in session, researches each stop's topography from Pausanias, Wycherley, Travlos, Simms, and others, recording what is certain and what is conjecture → code geocodes the modern landmarks; the route is hand-drawn and labelled conjectural → code builds the page.
- **Output:** a map at walking scale with the text beside it, Greek and English, a Prev/Next walk, two rival sites for the plane tree drawn dashed, and a sources panel. Cross-links to the *pharmakon* page at the Theuth stop.

### Distant reading · 01 · Every change between the 1818 and 1831 *Frankenstein*

- **Inputs:** the 1818 and 1831 texts from Project Gutenberg.
- **Operations:** code aligns the two editions and finds every change (550) → a schema of categories → a model labels each change in a fixed format → a stronger model and a reader check samples → code counts by category and chapter.
- **Output:** a chart of where the changes fall, filters by category and significance, and each change side by side with the edit highlighted plus the model's label and reasons.

### Distant reading · 02 · Distant and close reading: scenes of instruction

- **Inputs:** *Frankenstein* (1818), *R.U.R.* (1923 translation), *The Picture of Dorian Gray*, and Plato's *Phaedrus* (Jowett).
- **Operations:** code cuts the texts into 982 passages → a keyword search for teach/learn/lesson… → a model reads every passage for the concept → code compares the two methods → a blind check of 30 passages → a stronger model close-reads the 15 strongest.
- **Output:** one strip per text, with keyword hits on one row and the model's hits on another, so you can see what word search misses. Click any mark for the passage, the evidence, and the close reading.

### Rerunning a step

You don't need to. To try, put `OPENROUTER_API_KEY=…` in a `.env` at the repo
root (gitignored) and run, e.g.,
`node --env-file=.env 01-use-cases/distant-reading/01-frankenstein-revisions/operations/04-categorize.mjs`.
Cached responses make unchanged steps free. The two new maps and the writing
examples need no key at all. A few inputs from sites with their own terms are
fetched by each folder's download step instead of being included.
