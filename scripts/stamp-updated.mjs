// Stamps each piece of content with the day it last changed. The hash
// of every entry, lint, tour chapter, and the book page's own prose is
// kept in content/updated.json beside its date; a piece whose hash
// moved gets today's date, and the rest keep theirs. `npm run content`
// runs it after the compiler's table is regenerated.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "content", "updated.json");
const docs = JSON.parse(readFileSync(join(root, "content", "docs.json"), "utf8"));
const slides = JSON.parse(readFileSync(join(root, "content", "slides.json"), "utf8"));
const page = readFileSync(join(root, "app", "docs", "page.tsx"), "utf8");

let previous = {};
try {
  previous = JSON.parse(readFileSync(path, "utf8"));
} catch {
  previous = {};
}

const today = process.env.DOCS_DATE ?? new Date().toISOString().slice(0, 10);
const hash = (text) => createHash("sha1").update(text).digest("hex").slice(0, 16);
const next = {};
let changed = 0;

function stamp(key, text) {
  const h = hash(text);
  const old = previous[key];
  const date = old && old.hash === h ? old.date : today;
  if (!old || old.hash !== h) changed += 1;
  next[key] = { hash: h, date };
}

for (const e of docs.entries) stamp(`entry:${e.key}`, e.markdown);
for (const l of docs.lints) stamp(`lint:${l.name}`, JSON.stringify(l));
for (const s of slides.slides) stamp(`slide:${s.id}`, JSON.stringify(s));
stamp("cards", JSON.stringify(slides.stdItems));
// The hand-written chapters of the page: everything outside the data.
stamp("page:docs", page);

writeFileSync(path, JSON.stringify(next, null, 2) + "\n");
console.log(`stamped ${Object.keys(next).length} pieces, ${changed} changed`);
