# W10 — Provenance record, final, HTML

**Runner:** the model, then a script. **Reads:** `work/W09_draft_v3.md` and every file in `work/`. **Writes:** `../paper/final.md`, `../paper/final.html`.

## 1. Final proofread

Citations match the works-cited list one for one; locations on every
quotation; one citation style; length within the brief; title.

## 2. The provenance record

The syllabus requires that AI use be "documented, explained, and reflected
upon." The folder is the documentation. This step writes the explanation and
the reflection, as a final section of `final.md` headed `## How this paper
was written`, in three parts:

- **Documented.** A table of the steps run, with dates, who ran each (you, the
  model, a script), which model, and the file each produced. Taken from
  `work/`, not from memory. Say which judges in `W08` were models.
- **Explained.** For each place the model's work is in the paper, what it
  contributed: the reading notes it took, the angles it proposed and which
  you chose, the outline, the draft, the judges' changes. For each place it
  is not, say so: your seminar notes, your choice of claim, your feedback and
  the paragraphs you wrote. Point to the files.
- **Reflected.** A paragraph in your voice (write it yourself, or dictate it
  and mark it so): what the process made possible, what it made harder, where
  the model read well and where it read badly, what you would do differently,
  and what, in the end, you take authorship of.

This section is part of the submission, not an appendix to be skipped.

## 3. Render

```bash
python3 01-use-cases/_writing/notebook/scripts/render_html.py \
  01-use-cases/_writing/paper/final.md 01-use-cases/_writing/paper/final.html \
  --title "<paper title>" --author "<your name>" --course "ENGLISH 298AI · Fall 2026" --double
```

The script needs the `markdown` Python package (`pip install markdown`). It
styles the `## How this paper was written` section as a provenance block
with hanging indents.
