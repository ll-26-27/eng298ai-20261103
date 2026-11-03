# File guide

The second simulation, [A Socratic classroom](02-socratic-classroom/README.md),
has its own [file guide](02-socratic-classroom/index.md) and
[HTML dialogue](02-socratic-classroom/outputs/index.html).

| File or folder | Purpose |
|---|---|
| [README.md](README.md) | Student activity and commands |
| [CLAUDE.md](CLAUDE.md) | Instructions for the coding assistant |
| [inputs/scenario.md](inputs/scenario.md) | Starting world and decision |
| [inputs/config.json](inputs/config.json) | Roster, 20 total turns, 2 cards per turn |
| [inputs/events.json](inputs/events.json) | Changes revealed before turns 9 and 15 |
| [inputs/personas/](inputs/personas/) | Four separate Markdown system prompts and public roles |
| [inputs/knowledge/](inputs/knowledge/) | Three attributed quote cards per persona |
| [inputs/papers/](inputs/papers/README.md) | Four full-text research papers and provenance manifest |
| [inputs/templates/](inputs/templates/) | A persona and knowledge packet to adapt |
| [operations/](operations/README.md) | Loop, prompts, renderer and checks |
| [outputs/index.html](outputs/index.html) | Standalone, filterable HTML conversation |
| [outputs/conversation.md](outputs/conversation.md) | Same dialogue as Markdown |
| [outputs/conversation.json](outputs/conversation.json) | Canonical record, memos, retrieval, usage and input hashes |
| [outputs/raw/](outputs/raw/) | Exact requests and provider responses, including retries |
| [outputs/input-snapshot/](outputs/input-snapshot/) | The example's original persona, knowledge, scenario and prompt files |
| `outputs/runs/` | New live runs; local and ignored by Git by default |
