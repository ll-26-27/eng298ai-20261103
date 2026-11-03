// Step 7 (model judgment, structured output): segment the two hours into phases by topic and mood.
// The model reads the whole transcript (each message clipped to 280 characters) and returns 4–8
// contiguous phases with a title, a span of message numbers, the mood, and evidence. Step 7b checks it.
//   node --env-file=.env 01-use-cases/simulation/03-ensemble-of-october-20/operations/07-phases.mjs
import { loadDialogue, transcriptLines, chatJSON, writeJSON } from './_lib.mjs';

const MODEL = 'anthropic/claude-opus-5.5';
const { msgs } = loadDialogue();

const schema = {
  type: 'object', additionalProperties: false, required: ['phases'],
  properties: { phases: { type: 'array', items: { type: 'object', additionalProperties: false,
    required: ['title', 'start_n', 'end_n', 'mood', 'summary', 'evidence'],
    properties: {
      title: { type: 'string', description: 'A short, plain title (under 8 words).' },
      start_n: { type: 'integer' }, end_n: { type: 'integer' },
      mood: { type: 'string', description: 'The mood or register of the room in a few words.' },
      summary: { type: 'string', description: 'Two to four sentences: what the room talked about and how.' },
      evidence: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['n', 'why'], properties: { n: { type: 'integer' }, why: { type: 'string' } } } },
    } } } },
};

const SYSTEM = `You are helping a digital-humanities seminar read a Slack room where about two dozen chatbots built by graduate students in a course on AI and the humanities (readings include Plato's Phaedrus, Frankenstein, Wilde, Čapek's R.U.R., and AI papers) talked to each other for two hours under an automated director. Humans posted only four times. Messages are numbered in time order; thread replies are interleaved with channel messages, so a phase is a span of message numbers in time.`;
const USER = `Divide the whole transcript below into between 4 and 8 phases by topic and mood. Phases must be contiguous and cover every message: the first starts at #1, each next phase starts one after the previous one ends, and the last ends at #${msgs.length}. Put boundaries where the room's subject or register actually turns, not at even intervals. For each phase give 3 to 5 evidence messages inside its span that show its character.\n\nTRANSCRIPT\n${transcriptLines(msgs)}`;

const { result, usage, cached } = await chatJSON({ model: MODEL, step: '07-phases', schema, schemaName: 'phases', maxTokens: 5000,
  messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: USER }] });
console.log(`${result.phases.length} phases${cached ? ' [cache]' : ` $${usage.cost}`}`);
for (const p of result.phases) console.log(`#${p.start_n}–${p.end_n} ${p.title} (${p.mood})`);
writeJSON('07-phases.json', { model: MODEL, phases: result.phases });
