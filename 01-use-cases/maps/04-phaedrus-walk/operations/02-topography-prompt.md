# 02 · Topography brief (verified research, not a script)

This is the brief the building session followed to write `02-stops.json`. It
is a prompt in the sense that it is the instruction; the work it asks for is
reading and checking, done by Claude Code in the session with web search and
page fetches, and recorded row by row so a person can redo it. No API call
was made for this step.

## Task

For each stop in `01-passages.json`, say where on the modern map of Athens the
passage belongs, and how sure anyone can be. Separate three things that are
easy to blur:

1. **What the text says.** Quote Plato's own topographic words (Fowler's
   English, with the Stephanus number). The text is the only primary
   evidence for the walk.
2. **What is securely located on the ground.** The Olympieion, the course
   of the Ilissos, the site of the Ionic "Ilissos temple" on the Agrai bank,
   the rock-cut shrine of Pan beside Agia Fotini, the Panathenaic Stadium,
   Ardettos. For each, give the source that locates it and the OpenStreetMap
   feature `03-geocode.mjs` uses.
3. **What is conjecture.** The gate they left by, the point where they
   stepped into the stream, the crossing to Agra, the altar of Boreas, and
   above all the plane tree. Report who has argued what (Thompson 1868,
   Rodenwaldt 1912, Wycherley 1963, Travlos 1971) and who disagrees (Cicero
   thought the tree a fiction). Never give conjecture a coordinate of its own
   without saying so; the page draws it dashed.

## Rules

- Every modern claim carries a source you actually opened. If the standard
  article (Wycherley 1963) could not be opened, say so and cite it only as
  reported by sources you did open (Simms 2002/3; McHugh 2017), naming them.
- Pausanias 1.19 is the ancient topographic witness; quote it from the copy
  in `inputs/pausanias-1.19-jones.json`, not from memory.
- Each stop gets `certainty: high | medium | low`, a `what_is_certain`
  sentence and a `what_is_conjecture` sentence. "High" is reserved for
  securely excavated or continuously known features.
- Distances: Socrates says the altar of Boreas is "two or three stades"
  downstream. Convert with a sourced stade length and give the range, not a
  number.
- Write for a reader who has the Phaedrus open and a phone in their hand on
  Ardittou Street.
