# Notebook: the pipeline map

Eleven steps, one file each. Each file says who runs it (the model
in-session, a script, or **you**), what it reads, what it writes, and the
prompt or checklist. Everything a step produces lands in `work/` with the
step number as prefix, so the trail is auditable and the provenance record
(`W10`) can be assembled from the files themselves.

The notebook is where the humanist has always done the work: copying out
the passages that matter, putting down a thought beside them, taking notes in
seminar. The steps keep that order. Notes first, then an idea, then evidence,
then shape, then prose.

| # | Step | Runner | Reads | Writes |
|---|---|---|---|---|
| W00 | Brief: what the paper is, who reads it, the rubric | model | syllabus | `work/W00_brief.md` |
| W01 | Reading notes, one file per text, read whole | model | `books/` manifest, `context/` texts | `work/W01_notes_<text>.md` |
| W01b | Seminar notes | **you** | your own notes | `work/W01b_seminar-notes.md` |
| W02 | Brainstorm angles through the course's lenses | model, you react | W01, W01b | `work/W02_angles.md` |
| W03 | Pick the angle; fix claim, counterclaim, crux passages | **you** decide, model writes | W02 | `work/W03_thesis.md` |
| W04 | Quote bank and outside sources | model | W03, `context/`, web | `work/W04_sources.md`, new files in `books/` |
| W05 | Outline | model | W03, W04 | `work/W05_outline.md` |
| W06 | Edit the outline, one adversarial pass | model | W05, W00 | `work/W06_outline_v2.md` |
| W07 | Draft | model | W06, W04 | `work/W07_draft_v1.md` |
| W08 | Judges panel, then revision | model, parallel readers | W07, W00 | `work/W08_judgments.md`, `work/W08_draft_v2.md` |
| W09 | Your feedback, applied verbatim | **you**, model applies | W08 | `work/W09_feedback.md`, `work/W09_draft_v3.md` |
| W10 | Provenance record, final proofread, HTML | model, then script | W09, all of `work/` | `../paper/final.md`, `../paper/final.html` |

## Scripts

```bash
# Markdown → a self-contained, print-ready HTML page (needs: pip install markdown)
python3 01-use-cases/_writing/01-seminar-paper/notebook/scripts/render_html.py \
  01-use-cases/_writing/01-seminar-paper/paper/final.md 01-use-cases/_writing/01-seminar-paper/paper/final.html \
  --title "<paper title>" --author "<your name>" --course "ENGLISH 298AI · Fall 2026"
```

Run from the repository root.

## Which steps are yours

`W01b` (seminar notes), `W03` (the choice of thesis), and `W09` (your
feedback on the draft) are written by you; the model reads them and does not
write them. The reading notes and the judges' reports are the model's and are
kept, so a reader can see what it saw. `W10` writes a short note on method
from the files.

## Running a step

Open the step file, read it, then ask the assistant to follow it, for example:

```text
Follow 01-use-cases/_writing/01-seminar-paper/notebook/W01_reading-notes.md for
context/course-readings/course-readings-md/plato-phaedrus.md.
Write the result to 01-use-cases/_writing/01-seminar-paper/notebook/work/W01_notes_plato-phaedrus.md.
```

Read what it wrote before running the next step. The steps that say **you**
mean it: write your own file, then continue.
