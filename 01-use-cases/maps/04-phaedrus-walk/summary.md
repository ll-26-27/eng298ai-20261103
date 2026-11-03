# Walking the *Phaedrus* · purpose, workflow, method

**Question:** can the only Platonic dialogue set outside the city walls be
followed on the ground, and what does it do to the argument about writing
that it is staged under a plane tree Socrates says he never visits?

**Material:** eleven passages of the *Phaedrus* (227a–230e, 242a–b, 258e–259d,
274c–275b, 278b, 279b–c) in Burnet's Greek, Fowler's 1914 English and
Jowett's 1892 English, all copied from the pharmakon project (translation/03-phaedrus-pharmakon); Pausanias 1.19 on the
Ilissos; two open-access studies of the topography (Simms 2002/3; McHugh
2017) that report the standard article (Wycherley 1963).

**Workflow:** code cuts the passages by Stephanus section (Jowett by anchor
phrases, failing loudly) → the building session researches each stop's
topography against named sources, separating what the text says, what is
securely located, and what is conjecture → code looks up eleven modern
landmarks in OpenStreetMap, Nominatim and Wikidata with the source recorded
per row → a hand-drawn route is stored as a GeoJSON file labelled conjectural
→ code inlines everything into one Leaflet page with a stop-by-stop walk
control.

**Result:** `outputs/index.html`, a map at human scale (the walk is about
700 m) with the Greek and English of each stop beside it, a certainty badge
per stop, two rival dashed candidates for the plane tree, and a sources panel
that says which sources were opened.

**Method notes:** the plane tree has never been found and scholars disagree about
its bank; the route is drawn, not excavated; the gate is unnamed in the text;
the river runs in a culvert except beside Agia Fotini; the landmarks are
modern features standing for ancient ones, some of them (the Stadium,
Hadrian's temple) later than the dialogue; Wycherley's article was not
opened; the topographic checking was done by a model reading web sources,
recorded so that a person can redo it.
