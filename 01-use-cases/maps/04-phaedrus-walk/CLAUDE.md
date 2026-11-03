# Walking the Phaedrus: instructions for Claude Code

Read README.md first. The inputs in inputs/ are source texts: never edit
them. Passages are cut from them by operations/01-extract-passages.mjs and
must stay the translator's words; if an anchor fails, fix the anchor, not the
text.

Topography is the hard part. Keep three things apart in every edit to
operations/02-stops.json: what Plato's text says (quote it with the
Stephanus number), what is securely located on the ground (name the
OpenStreetMap feature and the source), and what is conjecture (name whose).
Never give conjecture a coordinate without marking it conjectural; the page
draws such points dashed. The plane tree has no coordinate of its own; the two
candidates are listed as alternatives and must stay that way unless an
excavation report says otherwise.

Every modern claim carries a source you actually opened, with `opened: true`.
If you cite a work you could not open (Wycherley 1963 is behind JSTOR), set
`opened: false` and name the opened source that reports it. Do not claim to
have checked a page you did not fetch.

Coordinates come only from operations/03-geocode.mjs (Overpass by OSM id,
Nominatim, Wikidata, in that order, cached in operations/cache/). Do not type
coordinates into 03-landmarks.json by hand. The route in 03-route.geojson is
hand-drawn and says so in its `note`; if you move it, say why there.

Rebuild with operations/04-build.mjs from the repo root. It fails if a stop
has no passage, cites an unknown landmark, or cites an unknown source; that is
intended. Keep outputs/index.html self-contained: data inlined, only Leaflet
and basemap tiles from the network.
