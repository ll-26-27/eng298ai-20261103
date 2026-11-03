# Translation use case

Read README.md, inputs/source-fr.md, inputs/sources.json, and
inputs/editorial-brief.md first. Treat inputs as source material. Never change
them unless the user is deliberately choosing a different passage or brief.

Follow the numbered prompts in operations/prompts/. Keep the French source in
view during every stage, particularly revision. Save each result under a new
outputs/runs/<run-name>/ folder. Do not overwrite outputs/example/.

Do not read inputs/reference-en.md until prompt 07-compare. Source metadata may
be read earlier. Compare actual translated passages, not titles or URLs.
The source check uses documented provenance; do not claim fresh web checking
unless you actually open the cited pages. Do not invent dictionary authority.

Run critique and revision once by default. If repeating, save each round and
keep the French in every request. The reviewer is another pass by the same
assistant, not an independent expert.

Follow prompts 08 and 09's JSON contracts. Use operations/render_translation.py
to generate the annotated page from translation.json. Preserve all six source
segments; keep the English under 190 words and each of the four notes under
36 words. Notes must quote exact French and English phrases. Check the meaning
manually as well as checking the file structure.

Keep API keys in the repository's gitignored .env or environment variables.
Do not put keys in prompts, notebooks, saved outputs, or source files.
