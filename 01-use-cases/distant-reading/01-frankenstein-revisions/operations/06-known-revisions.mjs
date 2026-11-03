// 06 — Known revisions (deterministic check against scholarship and against
// Mary Shelley's own account).
//
// Each entry below is a revision that scholars (or the 1831 Introduction
// itself) describe, with a text pattern that should appear on one side of the
// diff only. The script finds the sentence, finds the change that contains it,
// and reports whether the diff caught it and how the model labelled it.
// A "caught" result means the code found the change; whether the model's
// category is apt is still a judgment for the reader.
//
// It also tests Mary Shelley's claim in the 1831 Introduction that her
// changes "occur almost exclusively in the beginning of the first volume",
// and counts fate vocabulary in each edition (plain word counts, no model).
//
// Writes 06-known-revisions.json.
//
// Run from the repo root:
//   node 01-use-cases/distant-reading/01-frankenstein-revisions/operations/06-known-revisions.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(readFileSync(join(HERE, f), 'utf8'));
const t1818 = read('01-text-1818.json');
const t1831 = read('01-text-1831.json');
const { changes } = read('04-categorized.json');

const SOURCES = {
  mellor: 'Anne K. Mellor, "Revising Frankenstein," ch. 9 of Mary Shelley: Her Life, Her Fiction, Her Monsters (New York: Routledge, 1988); argues the 1831 text makes Victor the pawn of a destiny beyond his control. Online at https://knarf.english.upenn.edu/Articles/mellor9.html (refused automated access on 2026-11-03; the claim summarized here was confirmed against the texts by this step, not against Mellor\'s page).',
  curran: 'Stuart Curran, ed., Frankenstein; or, The Modern Prometheus, Romantic Circles Electronic Editions (2009), annotation at https://romantic-circles.org/editions/frankenstein/1065.html: in 1831 "I believed myself destined" is substituted for "I felt as if I were destined", and Victor "has consistently appealed to a ruling destiny" already in 1818.',
  intro: 'Mary Shelley, Introduction to the 1831 edition (in inputs/pg42324.txt): the revisions "are principally those of style. I have changed no portion of the story, nor introduced any new ideas or circumstances."',
  wikiLavenza: 'Wikipedia, "Elizabeth Lavenza," https://en.wikipedia.org/wiki/Elizabeth_Lavenza (consulted 2026-11-03; a tertiary source that cites no scholarship for the claim, listed so students can see the difference).',
  texts: 'The two editions themselves (inputs/pg41445.txt and inputs/pg42324.txt). Commonly noted in teaching editions; no scholarly source was checked in the time available.',
};

const KNOWN = [
  { key: 'introduction', title: "The new Author's Introduction (the ghost-story contest at Geneva, 1816)", side: 1831, pattern: /Publishers of the Standard Novels/, sources: ['intro'] },
  { key: 'elizabeth', title: "Elizabeth's origins: Victor's cousin in 1818, an adopted foundling (daughter of a Milanese nobleman) in 1831", side: 1831, pattern: /daughter of a Milanese nobleman/, sources: ['mellor', 'wikiLavenza'] },
  { key: 'elizabeth-1818', title: 'The 1818 side of the same change: Elizabeth as the daughter of Victor\'s father\'s sister', side: 1818, pattern: /My father had a sister, whom he tenderly loved/, sources: ['mellor'] },
  { key: 'pretty-present', title: 'Elizabeth as "a pretty present for my Victor"', side: 1831, pattern: /pretty present for my Victor/, sources: ['mellor'] },
  { key: 'destiny-potent', title: '"Destiny was too potent, and her immutable laws had decreed my utter and terrible destruction"', side: 1831, pattern: /Destiny was too potent/, sources: ['mellor'] },
  { key: 'angel-destruction', title: 'Chance as "the Angel of Destruction" that leads Victor to Krempe', side: 1831, pattern: /Angel of Destruction/i, sources: ['mellor'] },
  { key: 'words-of-fate', title: 'Waldman\'s lecture as "the words of the fate, enounced to destroy me"', side: 1831, pattern: /enounced to destroy me/, sources: ['mellor'] },
  { key: 'believed-destined', title: '"I felt as if I were destined" becomes "I believed myself destined"', side: 1831, pattern: /I believed myself destined/, sources: ['curran'] },
  { key: 'galvanism', title: "Lightning explained by a visiting natural philosopher's theory of electricity and galvanism, not by Victor's father", side: 1831, pattern: /man of great research in natural philosophy/, sources: ['texts'] },
  { key: 'walton-price', title: 'Walton: "One man\'s life or death were but a small price to pay for the acquirement of the knowledge which I sought"', side: 1831, pattern: /small price to pay for the acquirement/, sources: ['texts'] },
  { key: 'justine-barn', title: 'The creature finds Justine asleep in a barn and plants the portrait on her', side: 1831, pattern: /Awake, fairest, thy lover is near/, sources: ['texts'] },
  { key: 'villa-lavenza', title: "Elizabeth's restored inheritance and the Villa Lavenza on Lake Como", side: 1831, pattern: /Villa Lavenza/, sources: ['texts'] },
];

const changeBySentence = new Map();
for (const c of changes) {
  for (const id of c.sentences1818) changeBySentence.set(id, c);
  for (const id of c.sentences1831) changeBySentence.set(id, c);
}
const sentences = (t) => t.sections.flatMap((s) => s.sentences);

const results = KNOWN.map((k) => {
  const hits = sentences(k.side === 1818 ? t1818 : t1831).filter((s) => k.pattern.test(s.text));
  const other = sentences(k.side === 1818 ? t1831 : t1818).filter((s) => k.pattern.test(s.text));
  const c = hits.map((h) => changeBySentence.get(h.id)).find(Boolean);
  return {
    ...k,
    pattern: String(k.pattern),
    sentence: hits[0]?.id ?? null,
    foundInText: hits.length > 0,
    alsoInOtherEdition: other.length > 0,
    caught: Boolean(c),
    change: c ? { id: c.id, category: c.label?.category, secondary: c.label?.secondary, significance: c.label?.significance } : null,
  };
});

// Mary Shelley's claim: changes "almost exclusively in the beginning of the first volume"
const changedWords = (c) => Math.max(c.wordsAdded, c.wordsRemoved);
const nonTrivial = changes.filter((c) => c.kind !== 'punctuation' && !c.wholeSection);
const total = nonTrivial.reduce((n, c) => n + changedWords(c), 0);
const where = (pred) => nonTrivial.filter(pred).reduce((n, c) => n + changedWords(c), 0);
const vol1Start = where((c) => /^(v1-ch1|v1-ch2|letter-)/.test(c.loc1818 || ''));
const vol1 = where((c) => /^(v1-|letter-|preface)/.test(c.loc1818 || ''));
const shelleyClaim = {
  claim: 'these changes occur almost exclusively in the beginning of the first volume',
  method: 'Words changed (the larger of words added and words removed) in every non-punctuation change, excluding the new Introduction. "Beginning of the first volume" = the four letters and Vol. I, Chs. I–II of 1818.',
  wordsChangedTotal: total,
  beginningOfVol1: vol1Start,
  beginningOfVol1Pct: +(100 * vol1Start / total).toFixed(1),
  allOfVol1Pct: +(100 * vol1 / total).toFixed(1),
  vol2and3Pct: +(100 * (total - vol1) / total).toFixed(1),
};

// fate vocabulary, counted in each edition (whole novel, Introduction excluded)
const FATE = /\b(destin\w*|fate|fated|fatal\w*|doom\w*|predestin\w*)\b/gi;
const count = (t) => sentences({ sections: t.sections.filter((s) => s.kind !== 'introduction') }).reduce((n, s) => n + (s.text.match(FATE) || []).length, 0);
const fateWords = { pattern: String(FATE), count1818: count(t1818), count1831: count(t1831), words1818: t1818.words, words1831: t1831.words - t1831.sections.find((s) => s.kind === 'introduction').words };

writeFileSync(join(HERE, '06-known-revisions.json'), JSON.stringify({ sources: SOURCES, results, shelleyClaim, fateWords }, null, 1));
for (const r of results) console.log(`${r.caught ? 'CAUGHT' : 'MISSED'}  ${r.key.padEnd(18)} ${r.change ? `${r.change.id} ${r.change.category} s${r.change.significance}` : ''}${r.alsoInOtherEdition ? '  (pattern also in the other edition!)' : ''}`);
console.log(shelleyClaim);
console.log(fateWords);
