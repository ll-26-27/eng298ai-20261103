// Builds the Vercel site: copies index.html plus every file reachable from it
// by relative links (pages, images, PDFs, scripts, styles) into ./public.
// Everything else in the repository (inputs, operations, caches, notes) is left out.
//
//   node build-site.mjs            build into ./public
//   node build-site.mjs --list     print what would be published, write nothing

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "public");
const LIST_ONLY = process.argv.includes("--list");

const REFERENCING = new Set([".html", ".htm", ".css", ".svg"]);
const SKIP_DIRS = new Set([".git", "node_modules", "public"]);

const published = new Set(); // absolute paths
const broken = []; // [from, ref]
const queue = [path.join(ROOT, "index.html")];

const isExternal = (u) =>
  /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u) || u.startsWith("$") || u.includes("{{") || u.includes("${") || !/[./]/.test(u);

function refsIn(text, ext) {
  const refs = [];
  if (ext === ".html" || ext === ".htm" || ext === ".svg") {
    for (const m of text.matchAll(/\b(?:src|href|poster|data-src)\s*=\s*["']([^"']+)["']/gi)) refs.push(m[1]);
    for (const m of text.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi))
      for (const part of m[1].split(",")) refs.push(part.trim().split(/\s+/)[0]);
  }
  for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) refs.push(m[1]);
  return refs;
}

async function resolve(fromFile, ref) {
  if (!ref || isExternal(ref)) return null;
  const clean = decodeURIComponent(ref.split("#")[0].split("?")[0]);
  if (!clean) return null;
  let target = clean.startsWith("/")
    ? path.join(ROOT, clean)
    : path.resolve(path.dirname(fromFile), clean);
  if (!target.startsWith(ROOT + path.sep)) return null;
  const rel = path.relative(ROOT, target).split(path.sep);
  if (rel.some((p) => SKIP_DIRS.has(p))) return null;
  try {
    const st = await fs.stat(target);
    if (st.isDirectory()) {
      target = path.join(target, "index.html");
      await fs.stat(target);
    }
    return target;
  } catch {
    broken.push([path.relative(ROOT, fromFile), ref]);
    return null;
  }
}

while (queue.length) {
  const file = queue.pop();
  if (published.has(file)) continue;
  published.add(file);
  const ext = path.extname(file).toLowerCase();
  if (!REFERENCING.has(ext)) continue;
  const text = await fs.readFile(file, "utf8");
  for (const ref of refsIn(text, ext)) {
    const target = await resolve(file, ref);
    if (target && !published.has(target)) queue.push(target);
  }
}

const files = [...published].map((f) => path.relative(ROOT, f)).sort();
let bytes = 0;
for (const f of files) bytes += (await fs.stat(path.join(ROOT, f))).size;

if (LIST_ONLY) {
  for (const f of files) console.log(f);
} else {
  await fs.rm(OUT, { recursive: true, force: true });
  for (const f of files) {
    const dest = path.join(OUT, f);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(path.join(ROOT, f), dest);
  }
}

const byExt = {};
for (const f of files) byExt[path.extname(f) || "(none)"] = (byExt[path.extname(f) || "(none)"] || 0) + 1;
console.log(
  `${LIST_ONLY ? "Would publish" : "Published"} ${files.length} files, ${(bytes / 1048576).toFixed(1)} MB` +
    (LIST_ONLY ? "" : ` to ${path.relative(ROOT, OUT)}/`)
);
console.log("By type:", Object.entries(byExt).sort((a, b) => b[1] - a[1]).map(([e, n]) => `${e} ${n}`).join(", "));
if (broken.length) {
  console.log(`\n${broken.length} link(s) point at files that do not exist (left as-is):`);
  for (const [from, ref] of broken.slice(0, 40)) console.log(`  ${from}  ->  ${ref}`);
}
