# eng298ai-20261103

Materials for **ENGLISH 298AI: AI Humanities Lab**, Seminar 9, Tuesday, November 3, 2026, at the Bok Center's Learning Lab: using AI tools to research and present work in the humanities.

You do not need to understand every file. Start with the walkthrough.

## Getting it

```
git clone https://github.com/ll-26-27/eng298ai-20261103.git
cd eng298ai-20261103
```

Then open the folder with Claude Code, or add it as a folder in Claude Desktop's **Cowork**.

## Repository guide

| Folder | Contents | Start here |
|---|---|---|
| [`00-start-here/`](00-start-here/) | The workshop walkthrough and the tokenizer page. | [`walkthrough.md`](00-start-here/walkthrough.md) |
| [`01-use-cases/`](01-use-cases/) | The session's use cases. Empty for now; they will arrive before class. | [`README.md`](01-use-cases/README.md) |
| [`02-your-project/`](02-your-project/) | A blank project with empty `inputs/`, `operations/`, and `outputs/` folders. | [`inputs/README.md`](02-your-project/inputs/README.md) |
| [`context/`](context/) | The context pack: the course readings and the Learning Lab's AI papers, as Markdown. | [`README.md`](context/README.md) |
| [`resources/`](resources/) | A glossary, setup guides, and workshop handouts. | [`README.md`](resources/README.md) |

## What we're doing

This session teaches you to *vibe code* for the humanities lab: describe what
you want in plain language and let an AI tool build it, read it, and revise it
with you. No programming knowledge is needed. A simple mental model is.

Every project here has three parts, in this order:

| |
|:--|
| **Inputs** — what you give the model: readings, transcripts, notes, data, drafts |

| |
|:--|
| **Operations** — what you ask it to do, saved as files: prompts, instructions, scripts |

| |
|:--|
| **Outputs** — what it makes: tables, pages, summaries, essays, apps |

In a chat, the conversation is the record of your work. Here the folder is the
record. Each use case is laid out this way:

```text
inputs/       source files such as readings, transcripts, papers, or documents
operations/   prompts, skills, and scripts used to process the source files
outputs/      results produced from the source files
```

### The old way is the guide

Humanists have always worked like this.

- **Inputs:** the books and articles you read.
- **Operations:** your notebook: the quotations you copy out, the thoughts you
  put beside them, the notes you take in seminar.
- **Outputs:** what you make for others to read: papers, articles, books.

Then the circle closes: your outputs become someone else's inputs. The
ouroboros of outputs into inputs is what a field is.

Keep that shape as your heuristic. You can use it two ways:

1. **Do exactly the same thing.** Same readings, same notebook, same essay.
   The AI only helps you organize, sort, and search what you already have.
2. **Level up a category.** Scale: a hundred readings instead of five. Form:
   a searchable page or an app instead of an essay. Language: a text you could
   not read before. Loops: an operation you run again on every new input.
   Tools: a script that computes an answer instead of a model that guesses one.

Either way, keep originals in `inputs/` and write new files to `outputs/`. The
shared readings in `context/` are read-only.

## Keys

API keys go in a `.env` file in this folder. It is gitignored, so it never leaves your machine.
