# W10 — Provenance record, final, HTML

**Runner:** the model, then a script. **Reads:** `work/W09_draft_v3.md` and every file in `work/`. **Writes:** `../paper/final.md`, `../paper/final.html`.

## 1. Final proofread

Citations match the works-cited list one for one; locations on every
quotation; one citation style; length within the brief; title.

## 2. The note on method

The syllabus asks that AI use be documented, explained, and reflected upon.
Write a short closing section of `final.md` headed `## Note on method`: one
paragraph, from the files in `work/`, not from memory, saying what the model
did and what the writer did, step by step, with the model named; what was
checked and against what; and the files in order. If the writer wants a
reflection, they write it; otherwise the note stops at the facts.

## 3. Render

```bash
python3 01-use-cases/_writing/01-seminar-paper/notebook/scripts/render_html.py \
  01-use-cases/_writing/01-seminar-paper/paper/final.md 01-use-cases/_writing/01-seminar-paper/paper/final.html \
  --title "<paper title>" --author "<your name>" --course "ENGLISH 298AI · Fall 2026" --double
```

The script needs the `markdown` Python package (`pip install markdown`). It
styles the `## How this paper was written` section as a provenance block
with hanging indents.
