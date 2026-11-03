// Step 6 (model judgment, structured output): persona against behavior.
// For each agent that spoke, a model reads what the room gave it as a system prompt (framing prompt,
// the maker's notes, the start of its knowledge text, its triggers) and an evenly spaced sample of up to
// 14 of its messages, and says whether it stayed in character, drifted, or merged into the room's voice.
//   node --env-file=.env 01-use-cases/simulation/03-ensemble-of-october-20/operations/06-personas.mjs
import { loadDialogue, chatJSON, pool, writeJSON } from './_lib.mjs';

const MODEL = 'anthropic/claude-opus-5.5';
const { msgs, agents } = loadDialogue();

const schema = {
  type: 'object', additionalProperties: false,
  required: ['prompt_summary', 'intended_voice', 'verdict', 'fidelity', 'what_it_did', 'drift_toward', 'evidence'],
  properties: {
    prompt_summary: { type: 'string', description: 'One sentence: what the system prompt asks this agent to be and do.' },
    intended_voice: { type: 'string', description: 'A few words naming the voice or form the prompt asks for.' },
    verdict: { type: 'string', enum: ['in character', 'partly in character', 'drifted', 'merged into the room'] },
    fidelity: { type: 'integer', description: '1 (nothing of the persona remains) to 5 (fully the persona, in form and voice, throughout).' },
    what_it_did: { type: 'string', description: 'Two or three sentences on how it actually behaved in the room.' },
    drift_toward: { type: 'string', description: 'If it drifted or merged: toward what (another agent, the room\'s shared register, a topic). Empty string if it did not.' },
    evidence: { type: 'array', description: 'Two to four sampled messages that show the verdict.', items: { type: 'object', additionalProperties: false, required: ['n', 'note'], properties: { n: { type: 'integer' }, note: { type: 'string' } } } },
  },
};

const SYSTEM = `You are helping a digital-humanities seminar study a Slack room where about two dozen chatbots, each built by a graduate student, talked to each other for two hours under an automated "director" that chose who spoke next. Each bot's system prompt was its framing prompt, then its maker's notes, then any knowledge text. Some framing prompts were generated from a studio template (a poetic form, a genre) and may not match the bot's name; judge against the whole prompt as given, and say so when the name and the prompt disagree. Judge only from the prompt and the sample. Be specific and plain; cite message numbers.`;

const spoke = agents.filter((a) => msgs.some((m) => m.speaker === a.agent));
const results = await pool(spoke, 6, async (a) => {
  const mine = msgs.filter((m) => m.speaker === a.agent);
  const k = Math.min(14, mine.length);
  const sample = Array.from({ length: k }, (_, i) => mine[Math.floor((i * mine.length) / k)]);
  const prompt = [
    `AGENT NAME: ${a.agent}`,
    `MODEL: ${a.model || 'room default'}`,
    a.triggers ? `TRIGGERS: ${a.triggers}` : '',
    `FRAMING PROMPT:\n${a.framing_prompt || '(none)'}`,
    a.notes ? `MAKER'S NOTES:\n${a.notes.slice(0, 1200)}` : '',
    a.knowledge ? `KNOWLEDGE (first 1,200 characters of ${a.knowledge.length}):\n${a.knowledge.slice(0, 1200)}` : '',
    `\nIT POSTED ${mine.length} MESSAGES. AN EVENLY SPACED SAMPLE OF ${k}:`,
    ...sample.map((m) => `#${m.n} ${m.time}${m.thread ? ' (thread reply)' : ' (channel)'}: ${m.text.slice(0, 900)}`),
  ].filter(Boolean).join('\n\n');
  const { result, usage, cached } = await chatJSON({ model: MODEL, step: '06-personas', schema, schemaName: 'persona_check', maxTokens: 1500,
    messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }] });
  console.log(`${a.agent}: ${result.verdict} (${result.fidelity})${cached ? ' [cache]' : ` $${usage.cost}`}`);
  return { agent: a.agent, turns: mine.length, sampled: sample.map((m) => m.n), ...result };
});
writeJSON('06-personas.json', { model: MODEL, note: 'Model judgment from a sample of up to 14 messages per agent; see README for reliability.', personas: results });
