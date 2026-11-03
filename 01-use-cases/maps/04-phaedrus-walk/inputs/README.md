# Inputs

Four files. None is edited; the scripts in `../operations/` read them and
write elsewhere.

| file | what | provenance |
| --- | --- | --- |
| `texts/phaedrus-grc-burnet-perseus-grc2.xml` | Plato, *Phaedrus*, Greek text ed. John Burnet, *Platonis Opera* II (Oxford: Clarendon Press, 1901), Perseus Digital Library TEI with Stephanus milestones | Copied 2026-11-03 from `../../../translation/03-phaedrus-pharmakon/inputs/texts/`, which fetched it from <https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0059/tlg012/tlg0059.tlg012.perseus-grc2.xml> on 2026-11-03 (256,028 bytes). Public-domain text; TEI file CC BY-SA 4.0, Perseus Digital Library, Tufts University. |
| `texts/phaedrus-en-1914-fowler-perseus-eng2.xml` | Plato, *Phaedrus*, trans. Harold North Fowler, *Plato in Twelve Volumes* vol. 1, Loeb Classical Library (Cambridge, MA: Harvard University Press; London: Heinemann, 1914), Perseus TEI with Stephanus milestones | Copied from the pharmakon project (translation/03-phaedrus-pharmakon), which fetched <https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0059/tlg012/tlg0059.tlg012.perseus-eng2.xml> on 2026-11-03 (177,980 bytes). Public-domain text; TEI file CC BY-SA 4.0. |
| `texts/phaedrus-en-1892-jowett-pg1636.txt` | Plato, *Phaedrus*, trans. Benjamin Jowett, *The Dialogues of Plato*, 3rd ed. (Oxford: Clarendon Press, 1892); plain text with Jowett's introduction, no Stephanus numbers | Copied from the pharmakon project (translation/03-phaedrus-pharmakon), which fetched <https://www.gutenberg.org/cache/epub/1636/pg1636.txt> on 2026-11-03 (235,362 bytes). Public domain; Project Gutenberg License. |
| `pausanias-1.19-jones.json` | Pausanias, *Description of Greece* 1.19.1–6, trans. W. H. S. Jones (Loeb Classical Library, 1918): the Olympieion quarter, the Ilissos, Oreithyia and Boreas, the Ilissian Muses, Agrae and Artemis Agrotera, the Stadium of Herodes | Extracted 2026-11-03 from the Perseus TEI at <https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0525/tlg001/tlg0525.tlg001.perseus-eng2.xml> (reader view: <https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0160:book=1:chapter=19>). Editorial notes dropped. Public-domain text; TEI file CC BY-SA 4.0. |

The texts are the same digital witnesses the pharmakon project (translation/03-phaedrus-pharmakon) documents in its README
("Inputs: sources and copyright"); the caveats there apply, in particular that
Jowett's Gutenberg text is a transcription without the Stephanus apparatus.
