# W01 — Reading notes (the notebook proper)

**Runner:** the model, one text at a time. **Reads:** the text named in the request, from the path in `books/README.md`. **Writes:** `work/W01_notes_<text-slug>.md`.

## The rule

Read the whole file. If it is too long for one pass, read it in consecutive
chunks until it ends, and say so in the header ("read in full, N lines").
Never sample, skim, or summarize a part and present it as the whole. A note
that stands in for a text at the next step must be able to answer for every
part of it.

## Header (every notes file begins with this)

- Full citation and the **edition actually read**, from the file's header
  (translator, date, source such as Project Gutenberg number). If the file is
  a later edition or reprint of the text the syllabus dates, say so.
- What the file covers (whole text; excerpt; which chapters).
- Any extraction defects a reader should know about (OCR, missing figures,
  footnotes run into the text).
- Conventions: how passages are located (Stephanus numbers for Plato, book
  and chapter for the *Analects*, chapter for the novels, act for *R.U.R.*,
  chapter and section for Bergson, page for the articles).

## For each text

1. **What it is.** Genre, occasion, the shape of the whole, in a paragraph.
2. **The argument or action**, as the text makes it, in order. For a novel
   or play, the movement of the plot with the scenes that matter; for a
   dialogue or essay, the steps of the argument.
3. **Passages copied out.** Ten to twenty verbatim passages with location,
   each tagged: *crux*, *claim*, *image*, *definition*, *turn*, *joke*,
   *objection*. These are the quotations the paper may use; there will be no
   others. Copy exactly; mark any editorial repair in square brackets.
4. **Where AI enters.** How the text speaks to the course's questions, with
   the passage that does the speaking: made beings and their makers;
   dialogue and who is speaking; writing, memory, and the *pharmakon*; the
   mechanical encrusted on the living; imitation of genre and style;
   authorship and creativity; the persona or the mask.
5. **Tensions with other readings.** Where this text and another on the
   syllabus disagree, with both passages.
6. **Tensions with the AI papers.** Where a claim in the text meets a claim
   in one of the twenty-two papers (the assistant persona in Askell et al.;
   role-play and the simulacrum in Shanahan et al.; the "stochastic" picture
   of generation; instruction-following; constitutional training), with
   both passages.
7. **Questions the text leaves open.** Three to five, as questions.

## Then, across the texts

When notes exist for several texts, write `work/W01_cross-readings.md`:
pairs of passages from different texts that sit in tension, each pair with
the question it generates and the texts a paper would need. These are the
seeds `W02` grows.

## What this step is not

It is not interpretation. Keep the model's opinions out of the notes; put
them in `W02`. The notes are the commonplace book: what the text says, where
it says it, and what sits beside it.
