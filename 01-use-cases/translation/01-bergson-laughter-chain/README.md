# Translation: read the choices, not just the result

Translate a short French passage from Henri Bergson’s *Le Rire*, a reading on
the syllabus, into English. A prompt chain makes the interpretation visible:
source check → lexicon → context and rhythm → draft → critique → revision →
published comparison → editorial changes → annotation.

**Start with the [interactive translation page](outputs/example/annotated-translation.html)**
— open the HTML file in your browser.
Six aligned segments let you match each English choice to its French source.
Click a highlighted phrase to jump to its note. Hide the French to read the
English on its own, or hide highlights for a quieter view.

**The pattern to reuse today:** source material → operations → an HTML page
someone else can read and explore. Ask Claude to change the page as readily
as you ask it to revise the translation.

| Folder | What goes here |
|---|---|
| [inputs/](inputs/README.md) | French passage, source record, published English comparison, editorial brief. |
| [operations/](operations/README.md) | Nine prompts, Python runner, renderer, and a cleaned Jupyter notebook. |
| [outputs/](outputs/README.md) | The worked translation and its actual intermediate artifacts. |

## Try it in Claude Code

Open this repository, then ask:

```text
Read 01-use-cases/translation/01-bergson-laughter-chain/CLAUDE.md and operations/README.md in that folder.
Walk me through the translation chain one stage at a time. Show each saved
prompt before applying it. Keep the published comparison closed until step 7.
Save my run under 01-use-cases/translation/01-bergson-laughter-chain/outputs/runs/ and keep the worked example intact.
```

Or open the [Python notebook](operations/translation-chain.ipynb). Its default
mode reads the saved example and needs no key. Optional live mode uses Claude’s
API; setup and model configuration are in the [operations guide](operations/README.md).

## What to notice

- **Inputs:** a small original-language passage and a clearly identified edition.
- **Operations:** an explicit procedure, with the French present at every revision.
- **Outputs:** a translation, an editorial argument, and a page someone else can read.
- **The loop:** change one instruction in the brief, run again, and compare choices.

Use the 1911 translation as a comparison, not an answer key. The supplied
French witness is from 1938; this exercise does not collate editions. Repeated
model critique can improve a draft or reinforce its mistakes. Your source
reading and editorial judgment are still the test.
