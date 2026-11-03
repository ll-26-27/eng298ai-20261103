# Revision record

## Opening-only edit — current paper

The user approved the complete rewrite and requested a less stilted opening. Only paragraph 1 changed. The paper now contains **5,013 words in 42 paragraphs**. Every later paragraph, Works Cited, and Note on method is identical to the approved rewrite. The opening now explains directly that a book has a fixed text, that annotations and revised editions require someone to add material, and that a chatbot can respond to follow-up questions. The criticism is attributed to Socrates in Plato's Phaedrus (275d). The thesis and argumentative sequence are unchanged.

## Complete rewrite — approved argument

On November 3, 2026, the user requested a fresh rewrite from the draft with plain, coherent academic prose. The current paper is **Writing and Dialogue Agents: Plato, Shanahan, and Grice**: **4,992 words in 42 paragraphs**, excluding the title, Works Cited, and Note on method. It has no internal headings or horizontal dividers.

The rewrite reconstructs the argument around one claim and develops it through Plato's three criticisms, translation differences, the twenty-questions procedure and footnote 4, and Grice's garage, testimonial, and approximate-location examples. It replaces the earlier expansion rather than adding another layer to it.

- [Argument audit](academic-prose-audit.md): paragraph map, evidence, objections, and corrections.
- [Academic prose notebook](../notebook/academic-prose-models.md): complete copied paragraphs from the supplied articles and annotations of their argumentative operations.
- [Current quotation bank](../notebook/work/W11_rewrite-source-quotes.md): all quoted phrases matched to source text and located.
- [Pangram checks](pangram/README.md): two completed checks, exact inputs, preserved drafts, raw results, and HTML reports. Both drafts were classified as AI Generated.

Additional source checks for this rewrite include Grice's examples on pp. 51–52 and the two translations of Plato at 275d and 276a. The source checks below document the earlier expansion and are retained as history.

---

# Earlier expansion: revision record

Revision date: November 3, 2026. Requested change: expand the final paper and remove the breaks in its prose.

## Scope and counts

- Earlier essay: 3,017 words using the counter below; four horizontal dividers.
- Expanded draft: 5,450 words; 44 paragraphs; no internal headings or horizontal dividers.
- Counts exclude the title, Works Cited, and Note on method. The counter treats hyphenated words and contractions as one word: `\b[\w]+(?:[’'-][\w]+)*\b`.
- The earlier working drafts remain in `../notebook/work/`. Their assumed 2,500–3,500-word brief records the earlier run; this revision follows the subsequent request for a longer paper.
- This revision reads selected source passages and the existing argument; it is not recorded as a new full-text reading run or a new API experiment.

## Argument and source corrections

- The twenty-questions example says a regenerated answer **sometimes** names a different compatible object. It does not say this happens every time.
- Section 5, footnote 4 explicitly proposes recording the chosen object in a hidden monologue or encoded in the dialogue. The expanded essay treats this as a substantive counterexample to the earlier claim that the agent cannot maintain a commitment.
- The new argument distinguishes responsiveness, persistence, and answerability; adds Grice's account of cooperation and implicature; and develops Plato's borrowed voices, written dialogue, and seed metaphor.
- The hypothetical close-reading exchange is labeled as an illustration. It is not a reported experimental result.
- The “filled through the ears” quotation belongs at **235d**, rather than the earlier draft's 235c.
- The quoted Plato passages and discussed locations were compared with Fowler's marked TEI text: 235c–d, 257b, 264c, 271d–272b, 274e–275e, and 276a–277a.
- Grice locations follow the retained page markers: Cooperative Principle (45), Quality (46), common immediate aims (48), and the recursive implicature account (50).
- Jowett's introduction is identified as the translator's commentary, distinct from Plato's dialogue.

## Quotation supplement

All quoted phrases below were found in the local source texts after normalizing whitespace, Markdown emphasis, apostrophes, and terminal punctuation. This is a text-match check; the passage comparisons and interpretation are described above.

| Quoted phrase | Source |
|---|---|
| if you want to know anything and put a question to one of them, the speaker always gives one unvarying answer | Jowett |
| one unvarying answer | Jowett |
| a specific both for the memory and for the wit | Jowett |
| an aid not to memory, but to reminiscence, | Jowett |
| an elixir not of memory, but of reminding | Fowler |
| an intelligent word graven in the soul of the learner, which can defend itself, and knows when to speak and when to be silent | Jowett |
| more transitory, more diffuse, more elastic and capable of adaptation to moods and times | Jowett |
| more permanent, more concentrated, | Jowett |
| to all the world. | Jowett |
| unvarying answer | Jowett |
| Do not say what you believe to be false | Grice |
| Do not say that for which you lack adequate evidence | Grice |
| he knows (and knows that I know that he knows) | Grice |
| I have been filled through the ears, like a pitcher, from the waters of another, | Jowett |
| the father of the brat | Jowett |
| oak or rock, | Jowett |

Source files:

- **Jowett:** `context/course-readings/course-readings-md/plato-phaedrus.md`
- **Grice:** `context/course-readings/course-readings-md/grice-1975-logic-and-conversation.md`
- **Shanahan et al.:** `context/LL-readings/papers-on-ai-md/2305.16367v1--role-play-with-large-language-models.md`
- **Fowler:** `01-use-cases/maps/04-phaedrus-walk/inputs/texts/phaedrus-en-1914-fowler-perseus-eng2.xml`

## Rendering

The HTML is generated from `final.md` by `../notebook/scripts/render_html.py`, using the existing course/date byline and double spacing. The essay occupies one article; Works Cited and Note on method have separate, non-nested section containers. Hanging indents apply only to the bibliography. The title renders its italic emphasis, and the page uses local fonts with no external stylesheet dependency.
