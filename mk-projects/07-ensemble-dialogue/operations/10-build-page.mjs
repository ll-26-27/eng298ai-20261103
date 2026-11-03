// Step 10 (script, deterministic): build the page. Puts 09-summary.json and every message (number, time,
// speaker, thread parent, text) inline into 10-page-template.html, so outputs/index.html opens by double-click.
//   node mk-projects/07-ensemble-dialogue/operations/10-build-page.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { OPS, OUTPUTS, loadDialogue, readJSON } from './_lib.mjs';

const { msgs } = loadDialogue();
const parentN = new Map(msgs.filter((m) => !m.thread).map((m) => [m.ts, m.n]));
const messages = msgs.map((m) => ({ n: m.n, time: m.time, min: +m.min.toFixed(3), speaker: m.speaker, kind: m.kind, parent: m.thread ? parentN.get(m.thread) ?? null : null, text: m.text }));
const inline = (x) => JSON.stringify(x).replace(/</g, "\\u003c").replace(new RegExp("[\\u2028\\u2029]", "g"), (c) => "\\u" + c.charCodeAt(0).toString(16));
const html = readFileSync(join(OPS, '10-page-template.html'), 'utf8')
  .replace('/*SUMMARY*/null', () => inline(readJSON('09-summary.json')))
  .replace('/*MESSAGES*/null', () => inline(messages));
mkdirSync(OUTPUTS, { recursive: true });
writeFileSync(join(OUTPUTS, 'index.html'), html);
console.log(`outputs/index.html: ${(html.length / 1024).toFixed(0)} KB`);
