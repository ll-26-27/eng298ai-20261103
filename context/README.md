# Context pack

Shared source material for ENGLISH 298AI, kept in its own folder so projects
can refer to it without changing the originals.

- **[Course readings](course-readings/syllabus.md):** the syllabus and nine
  full-text Markdown readings in `course-readings/course-readings-md/`.
  Each text records its edition and source. Also the first French translation of *Frankenstein*
  (Saladin, Paris 1821, three volumes joined), for work on the text across
  languages.
- **[AI papers](LL-readings/papers-on-ai-md/):** 22 full papers in Markdown,
  including references and appendices where present. The
  [Learning Lab reading notes](LL-readings/papers-on-ai-notes.md) introduce
  the collection.

## How the AI papers were prepared

The original `eng-298ai-context` pack contained metadata, abstracts, and reading
notes for the AI papers. For this workshop, those files have been replaced
with cleaned full texts from the **matching arXiv HTML editions**. The original
PDFs were located locally and checked against the SHA-256 hashes in the pack.

The Markdown preserves section headings, continuous paragraphs, lists,
footnotes, references, table cells, and LaTeX equations. It omits site
navigation and redundant contents lists. Using structured source text avoids
PDF column-order errors, page furniture, and line-break hyphenation.

Figure captions and links to the source images are retained; the graphics
are not turned into invented prose. A text-only model will need the linked
image to inspect a chart or diagram. Every paper's metadata links to its
original PDF and HTML edition.

The [conversion manifest](LL-readings/extraction-manifest.json) records source
hashes, PDF page counts, and conversion checks. To rebuild from cached HTML
and PDFs, use [the conversion script](../resources/scripts/extract-ai-papers.py)
with Python and `beautifulsoup4` installed:

```sh
python resources/scripts/extract-ai-papers.py --source-dir /path/to/html --pdf-dir /path/to/pdfs
```

Treat this folder as read-only during the workshop. Save prompts and results
in a use case or `02-your-project/`.
