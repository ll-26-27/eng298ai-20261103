# W09b — Academic prose and Pangram

**Runner:** the model and the Pangram script. **Reads:** the current draft, source texts, and [academic prose models](academic-prose-models.md). **Writes:** a new draft, an argument audit, and two saved checks in `../paper/pangram/`.

## Procedure

1. Save a baseline Pangram check before changing the draft. Each run saves the exact submitted body, paragraph locations, input hash, raw response, and an HTML report. Retain the draft used for the run.
2. Copy out three complete paragraphs from supplied academic articles, with their source locations. Annotate the inference each paragraph performs: the evidence it introduces, the assumption it tests, and the conclusion it permits. The existing prose-model notebook demonstrates this step.
3. State one claim and the sequence needed to establish it. For each stage, identify the passage, the inference, and the objection that could defeat it. Remove stages that merely repeat the thesis in different vocabulary.
4. When a full rewrite is requested, write a new continuous essay from this plan. Use the earlier draft as a source record. Keep prose plain: exact terms, explicit referents, worked examples, and transitions that state why the next step follows. Add new quotations to the source record after checking the source. Preserve a substantial seminar-paper length through analysis rather than repeated scope statements.
5. Audit the new argument paragraph by paragraph. Record specific problems and the corrections made. Check the quotations and locations against the supplied editions. Render and inspect the HTML.
6. Run Pangram on the completed rewrite and save it under a new directory. Report its actual classifications beside the prose audit. The detector result describes Pangram's classification; the audit documents the argument's evidence and coherence.

## Run the check

Set `PANGRAM_API_KEY` in the repository's ignored `.env`, or export it in the process environment. The script needs the `markdown` package, also used by the paper renderer.

```bash
python3 01-use-cases/_writing/01-seminar-paper/notebook/scripts/pangram_check.py \
  01-use-cases/_writing/01-seminar-paper/paper/final.md \
  --out 01-use-cases/_writing/01-seminar-paper/paper/pangram/my-draft
```

`--prepare-only` saves the input without sending it. `--resume` reuses the saved input and task ID after an interruption, or submits a prepared input. A new draft gets a new output directory. The script submits only the essay body, including its quotations; it excludes the title, bibliography, and method note. It requests no public dashboard link.

The integration follows Pangram's [inference API documentation](https://pangram.readthedocs.io/en/latest/api/rest.html). The saved response includes the returned model version and window-level classifications; the report maps windows to the submitted paragraphs when their text can be matched.
