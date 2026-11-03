# Q1 — Pull the quotes

**Runner:** the model. **Reads:** one text, named in the request, whole. **Writes:** `work/Q1_quotes_<slug>.md`.

## The rule

Read every line of the file. If it is too long for one pass, read it in
consecutive chunks to the end and say so in the header. Do not sample.

## Header

- Citation and the edition actually read, from the file's front matter.
- How passages are located (page comments, Stephanus numbers, chapters).
- Any defects in the file a reader should know (OCR, lost footnotes).

## The bank

Fifteen to thirty passages, verbatim, each as one entry:

```
**p. 45** · *claim*
> Make your conversational contribution such as is required, at the stage at which it occurs, by the accepted purpose or direction of the talk exchange in which you are engaged.
```

Rules for the entries:

- Copy exactly. Keep the author's emphasis (the course's Markdown renders
  small capitals as UPPERCASE; keep that). Mark any repair in square
  brackets.
- Cite to the page the words are on. If a quotation crosses a page break,
  cite both (`pp. 48–49`).
- One tag per entry, from: *crux* (the sentence the whole text turns on),
  *claim*, *definition*, *example*, *turn* (where the argument changes
  direction), *joke*, *objection* (an objection the author raises against
  himself), *image*.
- No commentary inside the bank. If you must note something, put it in one
  line after the entry, marked `note:`.
- Prefer the sentence to the paragraph. The bank holds what a paper would
  quote; the reader can go to the page for the rest.

## After the bank

Three lines, no more:

- The one passage you would quote if you could quote only one, and why.
- The passage that surprised you.
- The passage the text's reputation leaves out.
