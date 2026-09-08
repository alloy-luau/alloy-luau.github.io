// The site's content: the compiler's doc table, the tour chapters, and
// the book's own prose. Both pages read from here.

import docsJson from "@/content/docs.json";
import slidesJson from "@/content/slides.json";
import updatedJson from "@/content/updated.json";

/** One documented member of a std type, as `alloy doc --json` writes it. */
export type Member = {
  name: string;
  kind: "static" | "method" | "field" | "constant";
  signature: string;
  doc: string;
  example: string;
};
export type Entry = { key: string; group: string; markdown: string; signature: string | null; members: Member[] };
export type LintDoc = { name: string; group: string; default: string; summary: string; detail: string };
export type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  thesis: string;
  src: string;
  emit: string;
  points: string[];
  mode?: string;
  cls?: string;
};

export const version: string = docsJson.version;
export const entries: Entry[] = docsJson.entries as Entry[];

/** The member headings, in the order a reference page prints them. */
export const memberKinds: [Member["kind"], string][] = [
  ["static", "Statics"],
  ["method", "Methods"],
  ["field", "Fields"],
  ["constant", "Constants"],
];

/** An entry's members by kind, in that order, with the empty kinds gone. */
export function memberGroups(entry: Entry): { kind: Member["kind"]; title: string; members: Member[] }[] {
  return memberKinds
    .map(([kind, title]) => ({ kind, title, members: entry.members.filter((m) => m.kind === kind) }))
    .filter((g) => g.members.length > 0);
}

/** How a page names a member: `HashMap:get` for a method, `HashMap.new`
 *  for a static, and the bare name for a shape that stands on its own. */
export function memberLabel(entry: Entry, m: Member): string {
  if (m.kind === "static") return `${entry.key}.${m.name}`;
  if (m.kind === "method") return `${entry.key}:${m.name}`;

  return m.signature.startsWith(`${entry.key}.`) ? `${entry.key}.${m.name}` : m.name;
}
export const lints: LintDoc[] = docsJson.lints;

/** The lint groups in book order, with what each holds. */
const GROUP_SUMMARIES: [string, string][] = [
  ["correctness", "Code that is wrong, or cannot run."],
  ["suspicious", "Code that is probably not what the author meant."],
  ["style", "A Luau habit with an Alloy form."],
  ["complexity", "A simple thing done in a hard way; the limits sit in `[flux]`."],
  ["perf", "Code that runs slower than the plain form."],
  ["roblox", "A Roblox API that is deprecated or misused."],
  ["pedantic", "Strict rules, off until `[lint] strict = true`."],
  ["naming", "The case of names, off until `[lint] warn = [\"naming\"]`."],
];

export const lintGroups: { name: string; summary: string; lints: LintDoc[] }[] = GROUP_SUMMARIES.map(
  ([name, summary]) => ({
    name,
    summary,
    lints: lints.filter((l) => l.group === name),
  }),
).filter((g) => g.lints.length > 0);
export const slides: Slide[] = slidesJson.slides as Slide[];
/** The std summary cards: the name, one line, and the key of the entry the card jumps to. */
export const stdItems: [string, string, string][] = slidesJson.stdItems as [string, string, string][];

/** One entry by key, or undefined. */
export function entry(key: string): Entry | undefined {
  return entries.find((e) => e.key === key);
}

/** The article text for a `topic:` key. */
export function topic(name: string): string {
  return entry(`topic:${name}`)?.markdown ?? "";
}

/** The reference groups in book order, with their entries. */
export const referenceGroups: { title: string; slug: string; keys: Entry[] }[] = [
  "Keywords",
  "Operators",
  "Intrinsics",
  "Attributes",
  "Derives",
  "Std",
].map((title) => ({
  title: title === "Std" ? "Standard library" : title,
  slug: title.toLowerCase(),
  keys: entries
    .filter((e) => e.group === title)
    .sort((a, b) => a.key.localeCompare(b.key)),
}));

/** The strictness contracts, for the landing page and the book. */
export const contracts: { title: string; body: string; code: string; icon: string }[] = [
  {
    icon: "match",
    title: "Exhaustive match",
    body: "A match with no default covers every variant. The error names the one with no arm.",
    code: "match msg with\n    case Join(p) then greet(p)\n    case Chat(p, t) then say(p, t)\nend\n-- `Msg` has no arm for `Leave`; add it or a `default` arm",
  },
  {
    icon: "struct",
    title: "Struct construction",
    body: "The fields form sets every field without a default and names no field the struct lacks.",
    code: "struct P as\n    x: number\n    y: number = 0\nend\nlocal a = new P { y = 1 }\n-- `new P { ... }` leaves `x` unset",
  },
  {
    icon: "trait",
    title: "Trait contract",
    body: "An impl writes every method the trait declares without a body, with the trait's arity.",
    code: "trait Shape as\n    function area(self): number\nend\nimpl Shape for Sq as\nend\n-- `impl Shape for Sq` does not write `area`",
  },
  {
    icon: "sealed",
    title: "Sealed structs",
    body: "A struct is open: a typo in a field name makes a new key in silence. @sealed makes it an error, at runtime and at check time. A `read` field is the one that cannot be written.",
    code: "@sealed\nstruct Config as\n    volume: number\nend\nlocal c = new Config { volume = 1 }\nc.volume = 2  -- fine: declared\nc.volme = 2   -- error: Config has no field volme",
  },
  {
    icon: "wire",
    title: "Wire types",
    body: "A remote carries data. A function, a thread, a Future, or a Signal in a parameter is an error.",
    code: "remote Ping(cb: () -> ()) from client\n-- parameter `cb` has type `() -> ()`, which is a\n-- function type; a remote carries only data",
  },
];

/** The commands, for the landing page and the book. */
export const commands: [string, string][] = [
  ["alloy build", "the project of the nearest alloy.toml"],
  ["alloy build file.aly", "one file to stdout; --check for what luau-lsp sees"],
  ["alloy check", "compile everything, write nothing, report errors and lints"],
  ["alloy flux", "the compile, the type check, and every lint; --fix rewrites"],
  ["alloy lint", "the lints alone; -W, -A, -D set a level for the run"],
  ["alloy fmt", "format the sources in place; --check writes nothing"],
  ["alloy test --run", "a lest spec per source with a @test, then lest; --watch, --coverage"],
  ["alloy doc strict", "an article; `alloy doc` lists every topic"],
  ["alloy init", "alloy.toml, .luaurc, and .config.luau"],
  ["rojo serve .alloy/build.project.json", "the compiled tree, from the [mount] table"],
  ["alloy self install", "alloy and alloy-lsp into ~/.alloy/bin; self update fetches a release"],
];

/** The day each piece of content last changed, by its key: `entry:<key>`,
 * `lint:<name>`, `slide:<id>`, `cards`, `page:docs`. */
const updated: Record<string, { hash: string; date: string }> = updatedJson;

/** The latest day among the pieces named, or undefined when none is known. */
export function updatedAt(keys: string[]): string | undefined {
  let latest: string | undefined;

  for (const key of keys) {
    const date = updated[key]?.date;

    if (date && (!latest || date > latest)) {
      latest = date;
    }
  }

  return latest;
}

/** The latest day any piece of the book changed. */
export const updatedAll: string | undefined = updatedAt(Object.keys(updated));

/** `2026-09-07` as `Sep 7, 2026`. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return `${months[m - 1]} ${d}, ${y}`;
}

/** One searchable piece of the book: the anchor it lives at, its label
 * and number, and its plain text. */
export type SearchDoc = { id: string; label: string; number: string; text: string };

/** Markdown as plain words: fences, code marks, and table bars go. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[a-z]*\n?/g, " ")
    .replace(/[`*_|#>]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
