// Step 5b (deterministic code): score the model against the human judgments in 05-check-judgments.json.
// Precision = of the passages the model called scenes of instruction, how many the reader agreed were.
// Recall    = of the real scenes of instruction, how many the model found. Because the sample is
// stratified (15 + 15), recall is estimated by weighting each stratum by its size in the whole corpus.
// The keyword search is scored on the same 30 passages for comparison.
// Writes operations/05-check-results.json.
import { readJSON, writeJSON } from './_lib.mjs';

const { population, ids } = readJSON('05-check-sample.json');
const { judged_by, note, judgments } = readJSON('05-check-judgments.json');
const { results } = readJSON('03-classifications.json');
const { hits } = readJSON('02-keyword-hits.json');

const rows = ids.map((id) => ({ id, human: judgments[id]?.is_instance, note: judgments[id]?.note || '', model: !!(results[id].is_instance && results[id].strength > 0), strength: results[id].strength, keyword: !!hits[id] }));
const missing = rows.filter((r) => typeof r.human !== 'boolean');
if (missing.length) { console.error(`judge these first: ${missing.map((r) => r.id).join(', ')}`); process.exit(1); }

const P = rows.filter((r) => r.model), N = rows.filter((r) => !r.model);
const tpRate = P.filter((r) => r.human).length / P.length; // precision, within the positive stratum
const fnRate = N.filter((r) => r.human).length / N.length; // share of model negatives that are real instances
const estTP = tpRate * population.model_positive, estFN = fnRate * population.model_negative;
const pct = (x) => Math.round(x * 100);
// With few negatives sampled, a miss rate of zero is weak evidence. The "rule of three" gives a rough
// 95% upper bound on the true miss rate when 0 of n are missed (3 / n); use it for a pessimistic recall.
const fnHigh = N.filter((r) => r.human).length === 0 ? 3 / N.length : Math.min(1, fnRate * 2);
const recallLow = estTP / (estTP + fnHigh * population.model_negative);
const strong = P.filter((r) => r.strength >= 2), weak = P.filter((r) => r.strength === 1);

const kwTP = rows.filter((r) => r.keyword && r.human).length, kwHits = rows.filter((r) => r.keyword).length, humanYes = rows.filter((r) => r.human).length;
const out = {
  judged_by,
  note,
  sample: { size: rows.length, model_positive: P.length, model_negative: N.length, human_yes: humanYes },
  model: {
    agree: rows.filter((r) => r.human === r.model).length,
    precision: { value: +tpRate.toFixed(3), counts: `${P.filter((r) => r.human).length} of ${P.length}` },
    negatives_that_were_instances: `${N.filter((r) => r.human).length} of ${N.length}`,
    precision_strong: `${strong.filter((r) => r.human).length} of ${strong.length} (strength 2–3)`,
    precision_weak: `${weak.filter((r) => r.human).length} of ${weak.length} (strength 1)`,
    recall_estimate: +(estTP / (estTP + estFN)).toFixed(3),
    recall_pessimistic: +recallLow.toFixed(3),
    recall_note: `estimated for the whole corpus by weighting the two strata (${population.model_positive} model positives, ${population.model_negative} model negatives); with ${N.length} negatives sampled, one disagreement moves this estimate a lot; a pessimistic reading of the same sample puts recall nearer ${pct(recallLow)}%`,
  },
  keyword_on_same_sample: {
    precision: kwHits ? `${kwTP} of ${kwHits}` : 'no keyword hits in sample',
    found_of_human_yes: `${kwTP} of ${humanYes}`,
  },
  disagreements: rows.filter((r) => r.human !== r.model).map((r) => ({ id: r.id, human: r.human, model: r.model, strength: r.strength, note: r.note })),
  rows,
};
writeJSON('05-check-results.json', out);
console.log(`agreement ${out.model.agree}/${rows.length}; precision ${out.model.precision.counts} (${pct(tpRate)}%); est. recall ${pct(out.model.recall_estimate)}% (pessimistic ${pct(recallLow)}%); strong ${out.model.precision_strong}, weak ${out.model.precision_weak}; keyword found ${kwTP} of ${humanYes} human-yes passages in the sample`);
