# Notebook: the pipeline map

Eleven main steps plus focused reading and revision passes, one file each. Each file says who runs it (the model
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
| W03 | Pick the angle; fix claim, counterclaim, crux passages | you or model select; model writes | W02 | `work/W03_thesis.md` |
| W04 | Quote bank and outside sources | model | W03, `context/`, web | `work/W04_sources.md`, new files in `books/` |
| W05 | Outline | model | W03, W04 | `work/W05_outline.md` |
| W06 | Edit the outline, one adversarial pass | model | W05, W00 | `work/W06_outline_v2.md` |
| W07 | Draft | model | W06, W04 | `work/W07_draft_v1.md` |
| W08 | Judges panel, then revision | model, parallel readers | W07, W00 | `work/W08_judgments.md`, `work/W08_draft_v2.md` |
| W09 | Your feedback, applied verbatim | optional user feedback; model revises | W08 | `work/W09_feedback.md`, `work/W09_draft_v3.md` |
| W09b | Academic prose audit, full rewrite when requested, Pangram checks | model and script | draft, source texts, prose models | revised draft, argument audit, `../paper/pangram/` |
| W10 | Provenance record, final proofread, HTML | model, then script | W09, all of `work/` | `../paper/final.md`, `../paper/final.html` |

## Academic prose and detection

[W09b](W09b_prose-and-pangram.md) adds copied academic paragraphs, a concrete
argument audit, and reproducible before/after Pangram checks. The
[prose models](academic-prose-models.md) identify how published paragraphs
use evidence, qualify a claim, and work through an inference.

## Scripts

```bash
# Markdown → a self-contained, print-ready HTML page (needs: pip install markdown)
python3 01-use-cases/_writing/01-seminar-paper/notebook/scripts/render_html.py \
  01-use-cases/_writing/01-seminar-paper/paper/final.md 01-use-cases/_writing/01-seminar-paper/paper/final.html \
  --title "<paper title>" --author "<your name>" --course "ENGLISH 298AI · Fall 2026"
```

Run from the repository root.

## Where you can intervene

`W01b` accepts seminar notes you supply. `W03` can use your selected thesis
or ask the model to choose and explain its choice. `W09` applies your feedback
when supplied; otherwise it proceeds with the model’s revision. Record skipped
inputs explicitly. Keep the reading notes and judges’ reports so the sequence
can be followed. `W10` writes the method note from those files.

## Running a step

Open the step file, read it, then ask the assistant to follow it, for example:

```text
Follow 01-use-cases/_writing/01-seminar-paper/notebook/W01_reading-notes.md for
context/course-readings/course-readings-md/plato-phaedrus.md.
Write the result to 01-use-cases/_writing/01-seminar-paper/notebook/work/W01_notes_plato-phaedrus.md.
```

Run a step at a time to intervene along the way, or ask the assistant to
complete the pipeline. It can proceed through selection and revision while
recording its decisions. Supplied seminar notes remain attributed to their
actual author.
