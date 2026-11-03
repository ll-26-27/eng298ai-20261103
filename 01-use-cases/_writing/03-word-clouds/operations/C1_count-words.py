#!/usr/bin/env python3
"""C1 — Count the words.

The text-analysis half of Jonathan Feinberg's Wordle (2008), redone in Python.
Feinberg describes it in "Wordle," chapter 3 of *Beautiful Visualization*
(O'Reilly, 2010), pp. 46–49:

  * a "word" is one or more letters or digits, optionally joined by hyphens,
    apostrophes, dots and the like (Example 3-1);
  * the language's stop words are removed unless the user says otherwise;
  * "Wordle takes the straight path in assigning a numeric weight to each
    word. The formula is: weight = word count."

Deterministic code. No model is involved.

Usage
  python3 C1_count-words.py SOURCE [--from HEADING] [--to HEADING]
                            [--json-path turns.utterance]
                            [--keep-stop-words] [--keep-case] [--min-count N]
                            --out counts.json [--excerpt excerpt.txt]

SOURCE is a Markdown or text file, or a JSON file with --json-path.
--from/--to cut a Markdown file between two heading lines (the line that
starts with --from is included; the first line that starts with --to ends it).
"""
import argparse, json, re, sys
from collections import Counter
from pathlib import Path

# Feinberg's Example 3-1, translated from Java regex classes to Python's.
# \p{javaLetter}/\p{javaDigit} become [^\W_]; the joiners are his list.
LETTER = r"[@+^\W_]"            # placeholder, rebuilt below
LETTER = r"(?:[^\W_]|[@+])"
JOINER = r"(?:[-.:/'’̀-ͯ′ ‌‍~])"
WORD = re.compile(LETTER + r"+(?:" + JOINER + r"+" + LETTER + r"+)*", re.UNICODE)

# Our English stop list. Feinberg says a stop list "is a matter of taste, not
# science"; Wordle's own lists are not published with the chapter, so this one
# is ours. Edit it and rerun.
STOP_WORDS = set("""
a about above after again against all am an and any are aren't as at be because
been before being below between both but by can cannot could couldn't did didn't
do does doesn't doing don't down during each few for from further had hadn't has
hasn't have haven't having he he'd he'll he's her here here's hers herself him
himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself
let's me more most mustn't my myself no nor not of off on once only or other
ought our ours ourselves out over own same shan't she she'd she'll she's should
shouldn't so some such than that that's the their theirs them themselves then
there there's these they they'd they'll they're they've this those through to too
under until up very was wasn't we we'd we'll we're we've were weren't what what's
when when's where where's which while who who's whom why why's with won't would
wouldn't you you'd you'll you're you've your yours yourself yourselves
shall will may might must also one upon
""".split())


def cut_markdown(text: str, start: str | None, end: str | None) -> str:
    lines = text.splitlines()
    i0, i1 = 0, len(lines)
    if start:
        i0 = next(i for i, l in enumerate(lines) if l.startswith(start))
    if end:
        i1 = next(i for i, l in enumerate(lines) if i > i0 and l.startswith(end))
    return "\n".join(lines[i0:i1])


def strip_markdown(text: str) -> str:
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)      # page-break comments
    text = re.sub(r"^---\n.*?\n---\n", " ", text, flags=re.S)  # front matter
    text = re.sub(r"^#+\s.*$", " ", text, flags=re.M)          # headings
    text = re.sub(r"[*_`>]", " ", text)                       # emphasis marks
    return text


def from_json(path: Path, json_path: str) -> str:
    data = json.loads(path.read_text())
    keys = json_path.split(".")
    node = data
    for k in keys[:-1]:
        node = node[k]
    return "\n\n".join(str(item[keys[-1]]) for item in node)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source")
    ap.add_argument("--from", dest="start")
    ap.add_argument("--to", dest="end")
    ap.add_argument("--json-path", help="e.g. turns.utterance for a list of turns")
    ap.add_argument("--keep-stop-words", action="store_true")
    ap.add_argument("--keep-case", action="store_true", help="Wordle's 'leave words as they are'")
    ap.add_argument("--remove-numbers", action="store_true", help="drop tokens that are only digits")
    ap.add_argument("--min-count", type=int, default=1)
    ap.add_argument("--out", required=True)
    ap.add_argument("--excerpt", help="also write the exact text that was counted")
    a = ap.parse_args()

    src = Path(a.source)
    if a.json_path:
        text = from_json(src, a.json_path)
    else:
        text = src.read_text(encoding="utf-8")
        text = cut_markdown(text, a.start, a.end)
        text = strip_markdown(text)

    words = [m.group(0).replace("~", " ") for m in WORD.finditer(text)]
    total = len(words)
    if not a.keep_case:
        words = [w.lower() for w in words]
    if not a.keep_stop_words:
        words = [w for w in words if w.lower() not in STOP_WORDS]
    if a.remove_numbers:
        words = [w for w in words if not w.isdigit()]
    counts = Counter(words)
    kept = [(w, c) for w, c in counts.most_common() if c >= a.min_count]

    out = {
        "source": str(src),
        "cut": {"from": a.start, "to": a.end, "json_path": a.json_path},
        "options": {"stop_words_removed": not a.keep_stop_words, "lowercased": not a.keep_case,
                    "numbers_removed": a.remove_numbers, "min_count": a.min_count},
        "tokens_total": total,
        "tokens_after_stop_words": sum(counts.values()),
        "distinct_words": len(kept),
        "weight_formula": "weight = word count (Feinberg 2010, p. 49)",
        "words": [{"word": w, "count": c} for w, c in kept],
    }
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    if a.excerpt:
        Path(a.excerpt).write_text(text.strip() + "\n", encoding="utf-8")
    print(f"{total} tokens, {out['tokens_after_stop_words']} after stop words, "
          f"{len(kept)} distinct -> {a.out}")
    for w, c in kept[:12]:
        print(f"  {c:4d}  {w}")


if __name__ == "__main__":
    main()
