# Operations

The prompts are the procedure. The final operation produces a standalone
HTML page: open it in a browser, then ask for a change to how it presents the
translation. This inputs → operations → HTML pattern carries into other cases. Use them in Claude Code, run the Python script,
or inspect the [notebook](translation-chain.ipynb). All three routes use the
same source and prompt files.

| Step | Operation | What becomes the next input |
|---|---|---|
| 1 | [Check the source](prompts/01-source-check.md) | Source card and a verified-record comparison candidate. |
| 2 | [Build a working lexicon](prompts/02-lexicon.md) | Consequential senses and alternatives. |
| 3 | [Read context and rhythm](prompts/03-context-rhythm.md) | Argument, movement, and translation priorities. |
| 4 | [Draft](prompts/04-draft.md) | Six English segments. |
| 5 | [Critique](prompts/05-critique.md) | Specific claims tested against the French. |
| 6 | [Revise](prompts/06-revise.md) | Revised segments; repeat 5–6 if useful. |
| 7 | [Compare](prompts/07-compare.md) | Actual wording from our draft and the published excerpt. |
| 8 | [Apply editorial choices](prompts/08-final-edit.md) | Final translation as structured JSON. |
| 9 | [Annotate](prompts/09-annotate.md) | Four notes quoting the French and the final English. |

## No-key route

Open the notebook and run it in its default `example` mode. It validates and
shows the saved live run without making API calls. The script does the same:

```sh
python3 01-use-cases/translation/01-bergson-laughter-chain/operations/chain.py
```

The saved example is tied to its original inputs. If you change the passage or
brief, example mode stops rather than pretending the old translation reflects
your changes. Use live mode or Claude Code for a new translation.

## Live Python route

Use Python 3.10 or later. From the repository root:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r 01-use-cases/translation/01-bergson-laughter-chain/operations/requirements.txt
```

On Windows, activate with `.venv\Scripts\activate` instead. Put the workshop
Anthropic key in the repository-root `.env` (gitignored), or set the environment
variable `ANTHROPIC_API_KEY`. The file should contain `ANTHROPIC_API_KEY=` followed
by the key supplied separately. No credential belongs in the notebook.

```sh
python 01-use-cases/translation/01-bergson-laughter-chain/operations/chain.py --live --model claude-sonnet-5-5 --rounds 1
```

The model above was available for the worked run; choose another model enabled
for your account with `--model` or `ANTHROPIC_MODEL`. One round makes nine API
requests. Each extra critique/revision round adds two, up to three rounds.
Live calls are billed to the API account. OpenRouter is not used by this runner.

Each live run creates a new directory under `outputs/runs/`. It saves responses
as they arrive and records model, token usage, prompt hashes, and input hashes.
Truncated responses or failed validation stop the run without marking it complete.
Neither mode automatically opens URLs; the French and reference text are local.

Launch the notebook with:

```sh
jupyter lab 01-use-cases/translation/01-bergson-laughter-chain/operations/translation-chain.ipynb
```

## From your notebook to this one

Adapted from the supplied `translation_chained_prompts.ipynb`. The original
preprocess → draft/critique/revise → compare → final-edit sequence is retained.
This version replaces the undefined `canonical_info` calls, keeps the French
inside every revision request, compares an actual published excerpt, and
checks JSON without a greedy regular expression. Context and rhythm share
one stage; lexical work focuses on consequential phrases instead of inventing
an etymology for every token. Source discovery is documented in `sources.json`;
the notebook does not describe a plausible URL as independent verification.

The API adapter uses [Anthropic’s Python SDK](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/python)
and checks [response stop reasons](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons).
No Colab account or embedded secret is required.
