// Step 8 (model judgment, then a deterministic count and quote check): recurring motifs.
// The model reads the whole transcript and names 8–12 motifs (themes, images, phrases) that recur across
// agents, each with search terms and quoted examples. The script then counts, by plain search, how many
// messages and which agents use each motif's terms, and checks every quotation is verbatim.
//   node --env-file=.env mk-projects/07-ensemble-dialogue/operations/08-motifs.mjs
import { loadDialogue, transcriptLines, chatJSON, writeJSON } from './_lib.mjs';

const MODEL = 'anthropic/claude-opus-5.5';
const { msgs, byN } = loadDialogue();

const schema = {
  type: 'object', additionalProperties: false, required: ['motifs'],
  properties: { motifs: { type: 'array', items: { type: 'object', additionalProperties: false,
    required: ['name', 'kind', 'description', 'search_terms', 'examples'],
    properties: {
      name: { type: 'string' }, kind: { type: 'string', enum: ['theme', 'image', 'phrase', 'move'] },
      description: { type: 'string', description: 'One or two sentences: what recurs and what it does in the room.' },
      search_terms: { type: 'array', description: '2 to 6 lowercase words or short phrases whose presence in a message signals the motif (plain substring search).', items: { type: 'string' } },
      examples: { type: 'array', description: '3 to 5 examples from different agents, each an exact quotation copied from the message.', items: { type: 'object', additionalProperties: false, required: ['n', 'quote'], properties: { n: { type: 'integer' }, quote: { type: 'string' } } } },
    } } } },
};

const SYSTEM = `You are helping a digital-humanities seminar read a Slack room where about two dozen chatbots built by graduate students in a course on AI and the humanities talked to each other for two hours under an automated director.`;
const USER = `Name 8 to 12 motifs that recur across several different agents in the transcript below: shared themes, images, phrases, or rhetorical moves (e.g. a way of opening or closing a reply). Prefer motifs that cross between agents over one agent's tics. Quotations must be copied exactly from the clipped text shown.\n\nTRANSCRIPT\n${transcriptLines(msgs)}`;

const { result, usage, cached } = await chatJSON({ model: MODEL, step: '08-motifs', schema, schemaName: 'motifs', maxTokens: 6000,
  messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: USER }] });
console.log(`${result.motifs.length} motifs${cached ? ' [cache]' : ` $${usage.cost}`}`);

const norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ');
const motifs = result.motifs.map((mo) => {
  const terms = mo.search_terms.map(norm);
  const hits = msgs.filter((m) => m.kind === 'agent' && terms.some((t) => norm(m.text).includes(t)));
  const byAgent = {};
  for (const m of hits) byAgent[m.speaker] = (byAgent[m.speaker] || 0) + 1;
  const examples = mo.examples.map((e) => ({ ...e, speaker: byN.get(e.n)?.speaker ?? null, verbatim: Boolean(byN.get(e.n) && norm(byN.get(e.n).text).includes(norm(e.quote).replace(/ …$/, ''))) }));
  console.log(`  ${mo.name}: ${hits.length} messages, ${Object.keys(byAgent).length} agents; quotes verbatim ${examples.filter((e) => e.verbatim).length}/${examples.length}`);
  return { ...mo, messages: hits.length, agents: Object.keys(byAgent).length, by_agent: byAgent, hit_ns: hits.map((m) => m.n), examples };
});
writeJSON('08-motifs.json', { model: MODEL, note: 'Motifs named by the model; counts are plain substring search over agent messages, so they over- and under-count.', motifs });
