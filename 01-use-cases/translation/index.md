# File guide

| File | Purpose |
|---|---|
| [README.md](README.md) | Entry point and workshop exercise. |
| [summary.md](summary.md) | Purpose, procedure, and limits. |
| [CLAUDE.md](CLAUDE.md) | Instructions for Claude Code. |
| [inputs/source-fr.md](inputs/source-fr.md) | Original French in six labeled segments. |
| [inputs/sources.json](inputs/sources.json) | Editions, URLs, normalization, and hashes. |
| [inputs/reference-en.md](inputs/reference-en.md) | Actual published English excerpt, reserved for comparison. |
| [inputs/editorial-brief.md](inputs/editorial-brief.md) | Reader, priorities, and final editing instructions. |
| [operations/prompts/](operations/prompts/) | Nine reusable steps. |
| [operations/chain.py](operations/chain.py) | API runner and saved-example validation. |
| [operations/render_translation.py](operations/render_translation.py) | Builds the bilingual HTML and Markdown from validated JSON. |
| [operations/translation-chain.ipynb](operations/translation-chain.ipynb) | Guided notebook using the same files and functions. |
| [operations/test_chain.py](operations/test_chain.py) | Checks source retention, reference withholding, and output validation. |
| [outputs/example/](outputs/example/) | Saved live responses and interactive HTML output. |
| [outputs/example/run.json](outputs/example/run.json) | Model, token usage, input/prompt hashes, and stage history. |
