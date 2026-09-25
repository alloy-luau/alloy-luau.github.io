// The docs as separate pages: the outline, the path of every page, the
// sidebar, and the map from the old one-page anchors to the new paths.
// The routes, the sidebar, the search index, and the redirect all read
// this one list, so a page exists in all of them or in none.

import {
  entries,
  lintGroups,
  memberLabel,
  plainText,
  referenceGroups,
  slides,
  updatedAt,
  type Entry,
  type LintDoc,
  type SearchDoc,
  type Slide,
} from "@/lib/content";

export type GroupSlug = "getting-started" | "language" | "tooling" | "configuration" | "reference" | "guides";

export const groups: { slug: GroupSlug; title: string; blurb: string }[] = [
  { slug: "getting-started", title: "Getting started", blurb: "Install the toolchain, make a first project, and set up the editor." },
  { slug: "language", title: "Language", blurb: "Each construct beside the Luau it emits, and the rules the compiler holds." },
  { slug: "tooling", title: "Tooling", blurb: "The commands: init, build, check, flux, lint, fmt, test, and doc." },
  { slug: "configuration", title: "Configuration", blurb: "alloy.toml, the Luau configuration, mounts, and the directives of one file." },
  { slug: "reference", title: "Reference", blurb: "Every keyword, operator, intrinsic, attribute, derive, std type, error kind, and lint." },
  { slug: "guides", title: "Guides", blurb: "Articles on one subject each." },
];

export type View =
  | { kind: "home" }
  | { kind: "group" }
  | { kind: "prose"; id: string }
  | { kind: "slide"; slide: Slide; topic?: string }
  | { kind: "topic"; name: string }
  | { kind: "category"; slug: string }
  | { kind: "entry"; entry: Entry }
  | { kind: "lint"; lint: LintDoc };

export type Page = {
  /** `/docs/language/modules/`, with the slash the export writes. */
  path: string;
  group: GroupSlug;
  /** The reference category a single entry belongs to. */
  parent?: string;
  title: string;
  /** The line a card, a search hit, and the meta description show. Inline Markdown. */
  summary: string;
  /** Indented under the page before it in the sidebar. */
  sub?: boolean;
  /** The keys of content/updated.json that date the page. */
  keys: string[];
  view: View;
};

/** A reference category shows its entries on one page when they are
 *  short, and gives each entry a page of its own when they are long. */
const PAGED = new Set(["keywords", "errors", "std"]);

export const categories = [
  ...referenceGroups.map((g) => ({ slug: g.slug, title: g.title, entries: g.keys, paged: PAGED.has(g.slug) })),
  { slug: "lints", title: "Lints", entries: [] as Entry[], paged: true },
];

const CATEGORY_BLURBS: Record<string, string> = {
  keywords: "The words the compiler reserves, and the Luau each one emits.",
  operators: "The operators Alloy adds to Luau, each with its fixed emit.",
  intrinsics: "The `$` calls the compiler expands at the call site.",
  attributes: "The `@` marks on a declaration, and where each one is allowed.",
  derives: "The methods `@derive` generates on a struct.",
  errors: "The kinds a compiler diagnostic prints, and the rule behind each one.",
  std: "The types and values of the standard library, with every member.",
  lints: "The checks `alloy lint` and `alloy flux` run, by group.",
};

/** The sidebar labels of the language chapters, as the compiler's book
 *  outline (crates/alloy/src/docs/book.rs) names them. A new chapter
 *  falls back to its own title. */
const CHAPTER_TITLES: Record<string, string> = {
  safe: "Safe access",
  modules: "Modules",
  async: "Async and Futures",
  enums: "Enums and match",
  bindings: "Conditional bindings",
  structs: "Structs and traits",
  interfaces: "Interfaces and types",
  sugar: "Sugar",
  extensions: "Extensions",
  macros: "Macros",
  attributes: "Attributes",
  remotes: "Remotes",
  markup: "Markup",
  tests: "Tests",
};

/** Where each known article lives, in sidebar order, with the anchors
 *  of the one-page book that pointed at it. An article not named here
 *  gets a page under Guides, so a new one needs no change to the site. */
const TOPICS: { name: string; group: GroupSlug; slug: string; title: string; anchors: string[] }[] = [
  { name: "strict", group: "language", slug: "strict", title: "Strict by default", anchors: ["strict", "contracts"] },
  { name: "exhaustive", group: "language", slug: "exhaustive", title: "Exhaustive match", anchors: ["exhaustive"] },
  { name: "wire", group: "language", slug: "wire", title: "Wire types", anchors: ["wire"] },
  { name: "data", group: "language", slug: "data", title: "JSON and TOML data", anchors: ["data"] },
  { name: "init", group: "tooling", slug: "init", title: "alloy init", anchors: [] },
  { name: "build", group: "tooling", slug: "build", title: "alloy build", anchors: ["build"] },
  { name: "check", group: "tooling", slug: "check", title: "alloy check", anchors: ["check"] },
  { name: "flux", group: "tooling", slug: "flux", title: "alloy flux", anchors: ["flux"] },
  { name: "lint", group: "tooling", slug: "lint", title: "alloy lint", anchors: ["lint"] },
  { name: "fmt", group: "tooling", slug: "fmt", title: "alloy fmt", anchors: ["fmt"] },
  { name: "test", group: "tooling", slug: "test", title: "alloy test", anchors: ["test"] },
  { name: "ingots", group: "tooling", slug: "ingots", title: "Ingots", anchors: ["ingots"] },
  { name: "config", group: "configuration", slug: "alloy-toml", title: "alloy.toml", anchors: ["config"] },
  { name: "luaurc", group: "configuration", slug: "luaurc", title: ".luaurc and .config.luau", anchors: ["luaurc"] },
  { name: "mount", group: "configuration", slug: "mounts", title: "Project files and mounts", anchors: ["mount"] },
  { name: "directives", group: "configuration", slug: "directives", title: "Directives", anchors: ["directives"] },
  {
    name: "results-and-futures",
    group: "guides",
    slug: "results-and-futures",
    title: "Results and Futures",
    anchors: ["results-and-futures"],
  },
];

/** The hand-written pages, whose text is in components/DocsProse.tsx. */
const PROSE: { id: string; group: GroupSlug; title: string; summary: string; after?: string }[] = [
  { id: "install", group: "getting-started", title: "Install", summary: "Build the compiler, the language server, and the VS Code extension." },
  { id: "first-project", group: "getting-started", title: "A first project", summary: "`alloy init`, a first source file, and a build that Rojo can sync." },
  { id: "editor", group: "getting-started", title: "The editor", summary: "The language server: a proxy over luau-lsp that maps its answers onto Alloy lines." },
  { id: "doc", group: "tooling", title: "alloy doc", summary: "Prints one page of these docs on the terminal.", after: "test" },
];

const BOLD_LINE = /^\*\*([^*]+)\*\*\s*$/;

/** An article as a page shows it: the bold title line comes off, since
 *  the page owns the h1, and each bold line that stands alone becomes a
 *  heading, so the "On this page" list can find it. */
export function article(markdown: string): { title?: string; body: string } {
  const lines = markdown.split("\n");
  const head = lines[0]?.match(BOLD_LINE);

  if (head) lines.shift();

  let fence = false;
  const body = lines
    .map((line) => {
      if (line.startsWith("```")) fence = !fence;

      const bold = fence ? null : line.match(BOLD_LINE);

      return bold ? `# ${bold[1]}` : line;
    })
    .join("\n")
    .trim();

  return { title: head?.[1], body };
}

/** The first sentence of the first paragraph of prose. */
export function firstSentence(markdown: string): string {
  const para =
    markdown
      .replace(/```[\s\S]*?```/g, "")
      .split(/\n\s*\n|\n(?=```)/)
      .map((p) => p.trim())
      .find((p) => p !== "" && !BOLD_LINE.test(p) && !/^([|#>-]|\*\s)/.test(p)) ?? "";
  const flat = para.replace(/\s+/g, " ");
  let code = false;

  // A stop inside a code span, as in `a ... b`, does not end the sentence.
  for (let i = 0; i < flat.length; i++) {
    if (flat[i] === "`") code = !code;
    else if (!code && ".!?".includes(flat[i]) && (i + 1 === flat.length || flat[i + 1] === " ")) return flat.slice(0, i + 1);
  }

  return flat;
}

/** An error kind's first line names the book section that explains it:
 *  `` `StructError` is a report of section 3.6, Structs and traits: <url> ``. */
const REPORT = /^`[^`]+` is a report of section [\d.]+, (.+?): \S+?#([\w-]+)\s*\n/;

export function errorReport(markdown: string): { title?: string; anchor?: string; body: string } {
  const m = markdown.match(REPORT);

  return m ? { title: m[1], anchor: m[2], body: markdown.slice(m[0].length) } : { body: markdown };
}

const SYMBOLS: Record<string, string> = {
  "?": "question",
  ".": "dot",
  ":": "colon",
  "=": "eq",
  "~": "tilde",
  "[": "bracket",
  "(": "paren",
  "-": "dash",
  ">": "gt",
  "<": "lt",
  "!": "bang",
};

/** The path segment or anchor of one entry: `HashMap` as `hashmap`,
 *  `$dbg` as `dbg`, `derive:Eq` as `eq`, `?.` as `question-dot`. */
export function entrySlug(key: string): string {
  const bare = key.replace(/^(derive:|[@$])/, "");

  return (bare.match(/\w+|\S/g) ?? [])
    .map((t) => (/\w/.test(t) ? t.toLowerCase() : (SYMBOLS[t] ?? `x${t.charCodeAt(0).toString(16)}`)))
    .join("-");
}

/** How a page names an entry: `@derive(Eq)` for a derive. */
export function entryLabel(key: string): string {
  return key.startsWith("derive:") ? `@derive(${key.slice(7)})` : key;
}

/** The anchor the one-page book gave an entry, and a member under it. */
function oldEntryId(key: string): string {
  return `ref-${key.replace(/[^A-Za-z0-9_]/g, (c) => `_${c.charCodeAt(0)}`)}`;
}

const lintSlug = (name: string) => name.replace(/\./g, "-");

// --- The build -----------------------------------------------------------

const pageList: Page[] = [];
/** Old anchor to new href, for the redirect on /docs/. */
const moved: Record<string, string> = {};

function add(page: Page, anchors: string[] = []): Page {
  pageList.push(page);

  for (const a of anchors) moved[a] = page.path;

  return page;
}

const topicEntries = entries.filter((e) => e.key.startsWith("topic:"));
const topicNames = new Set(topicEntries.map((e) => e.key.slice(6)));
const topicSummary = (name: string) => firstSentence(article(topicEntries.find((e) => e.key === `topic:${name}`)?.markdown ?? "").body);

const addProse = (p: (typeof PROSE)[number]) =>
  add(
    { path: `/docs/${p.group}/${p.id}/`, group: p.group, title: p.title, summary: p.summary, keys: ["page:docs"], view: { kind: "prose", id: p.id } },
    [p.id],
  );

const addTopic = (t: (typeof TOPICS)[number], sub = false) => {
  if (topicNames.has(t.name)) {
    add(
      {
        path: `/docs/${t.group}/${t.slug}/`,
        group: t.group,
        title: t.title,
        summary: topicSummary(t.name),
        sub,
        keys: [`entry:topic:${t.name}`],
        view: { kind: "topic", name: t.name },
      },
      t.anchors,
    );
  }

  // The prose pages that follow this article in the sidebar.
  for (const p of PROSE.filter((x) => x.after === t.name)) addProse(p);
};

add({ path: "/docs/", group: "getting-started", title: "Overview", summary: "", keys: [], view: { kind: "home" } });

for (const group of groups) {
  const start = pageList.length;
  const index = add(
    { path: `/docs/${group.slug}/`, group: group.slug, title: group.title, summary: group.blurb, keys: [], view: { kind: "group" } },
    [group.slug],
  );

  if (group.slug === "getting-started") {
    for (const p of PROSE.filter((x) => x.group === "getting-started")) addProse(p);
  }

  if (group.slug === "language") {
    for (const s of slides) {
      const merged = topicNames.has(s.id) && !TOPICS.some((t) => t.name === s.id) ? s.id : undefined;

      add(
        {
          path: `/docs/language/${s.id}/`,
          group: "language",
          title: CHAPTER_TITLES[s.id] ?? s.title.replace(/<[^>]+>/g, ""),
          summary: firstSentence(s.thesis),
          keys: [`slide:${s.id}`, ...(merged ? [`entry:topic:${merged}`] : [])],
          view: { kind: "slide", slide: s, topic: merged },
        },
        [s.id],
      );
    }
  }

  for (const t of TOPICS.filter((x) => x.group === group.slug)) {
    addTopic(t);

    // Each `--@alloy-*` directive has an article of its own, filed under
    // the directives page.
    if (t.name === "directives") {
      for (const e of topicEntries.filter((x) => x.key.startsWith("topic:alloy-"))) {
        const name = e.key.slice(6);

        addTopic({ name, group: "configuration", slug: name, title: article(e.markdown).title ?? name, anchors: [] }, true);
      }
    }
  }

  if (group.slug === "guides") {
    const known = new Set([...TOPICS.map((t) => t.name), ...slides.map((s) => s.id), ...categories.map((c) => c.slug)]);

    for (const e of topicEntries) {
      const name = e.key.slice(6);

      if (known.has(name) || name.startsWith("alloy-")) continue;

      addTopic({ name, group: "guides", slug: name, title: article(e.markdown).title ?? name, anchors: [] });
    }
  }

  if (group.slug === "reference") {
    for (const c of categories) {
      const base = `/docs/reference/${c.slug}/`;
      const intro = topicNames.has(c.slug) ? [`entry:topic:${c.slug}`] : [];
      const cat = add(
        {
          path: base,
          group: "reference",
          title: c.title,
          summary: CATEGORY_BLURBS[c.slug] ?? "",
          keys: intro,
          view: { kind: "category", slug: c.slug },
        },
        [c.slug === "lints" ? "lints" : `ref-${c.slug}`],
      );

      for (const e of c.entries) {
        const slug = entrySlug(e.key);
        const href = c.paged ? `${base}${slug}/` : `${base}#${slug}`;

        cat.keys.push(`entry:${e.key}`);
        moved[oldEntryId(e.key)] = href;

        for (const m of e.members) moved[`${oldEntryId(e.key)}-${m.name}`] = c.paged ? `${href}#${m.name}` : href;

        if (!c.paged) continue;

        const report = c.slug === "errors" ? errorReport(e.markdown) : undefined;

        add({
          path: href,
          group: "reference",
          parent: base,
          title: entryLabel(e.key),
          summary: report?.title ? `Reported under ${report.title}.` : firstSentence(e.markdown),
          keys: [`entry:${e.key}`],
          view: { kind: "entry", entry: e },
        });
      }

      if (c.slug === "lints") {
        for (const g of lintGroups) moved[`lints-${g.name}`] = `${base}#${g.name}`;

        for (const l of lintGroups.flatMap((g) => g.lints)) {
          cat.keys.push(`lint:${l.name}`);
          add({
            path: `${base}${lintSlug(l.name)}/`,
            group: "reference",
            parent: base,
            title: l.name,
            summary: `${l.summary.charAt(0).toUpperCase()}${l.summary.slice(1)}.`,
            keys: [`lint:${l.name}`],
            view: { kind: "lint", lint: l },
          });
        }
      }
    }
  }

  // A group with no page of its own is left out, index and all.
  if (pageList.length === start + 1) {
    pageList.pop();
    delete moved[group.slug];
    continue;
  }

  index.keys = pageList.slice(start + 1).flatMap((p) => p.keys);
}

/** Every page, in reading order: the order of the sidebar, and of the
 *  previous and next links. */
export const pages: Page[] = pageList;

/** The groups that hold a page. */
export const liveGroups = groups.filter((g) => pages.some((p) => p.path === `/docs/${g.slug}/`));

export function pageAt(path: string): Page | undefined {
  return pages.find((p) => p.path === path);
}

export function pageDate(page: Page): string | undefined {
  return updatedAt(page.keys);
}

/** The pages under a group or a category, without their own entries. */
export function childrenOf(page: Page): Page[] {
  if (page.view.kind === "category") return pages.filter((p) => p.parent === page.path);

  return pages.filter((p) => p.group === page.group && p.view.kind !== "group" && !p.parent && p.path !== "/docs/");
}

/** The indented pages that follow a page in the sidebar: the directives
 *  under the directives page. */
export function subPagesOf(page: Page): Page[] {
  const out: Page[] = [];

  for (const p of pages.slice(pages.indexOf(page) + 1)) {
    if (!p.sub) break;

    out.push(p);
  }

  return out;
}

/** The href of an entry by key, on its own page or on its category's. */
export function entryHref(key: string): string | undefined {
  return moved[oldEntryId(key)];
}

/** Where an anchor of the one-page book lives now. */
export function movedAnchors(): Record<string, string> {
  return moved;
}

/** The new href for an anchor of the one-page book, for a link that
 *  still names one. */
export function docHref(anchor: string): string {
  return moved[anchor] ?? "/docs/";
}

export function neighbours(page: Page): { prev?: Page; next?: Page } {
  const i = pages.indexOf(page);

  return { prev: pages[i - 1], next: pages[i + 1] };
}

export function groupOf(page: Page) {
  return groups.find((g) => g.slug === page.group)!;
}

// --- The sidebar -----------------------------------------------------------

export type NavLink = { title: string; path: string; sub?: boolean; children?: { title: string; path: string }[] };
export type NavGroup = { title: string; path: string; items: NavLink[] };

/** The sidebar: a group per heading, a link per page. A reference
 *  category lists its entries, and the sidebar opens that list only on
 *  the category's own pages. */
export const nav: NavGroup[] = liveGroups.map((g) => ({
  title: g.title,
  path: `/docs/${g.slug}/`,
  items: pages
    .filter((p) => p.group === g.slug && p.view.kind !== "group" && p.view.kind !== "home" && !p.parent)
    .map((p) => {
      const kids = pages.filter((c) => c.parent === p.path).map((c) => ({ title: c.title, path: c.path }));

      return { title: p.title, path: p.path, ...(p.sub ? { sub: true } : {}), ...(kids.length ? { children: kids } : {}) };
    }),
}));

// --- The search index ------------------------------------------------------

/** Everything the search box reads, served as /docs/search.json and
 *  fetched on the first search, so no page carries it. */
export function searchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const p of pages) {
    const section = p.parent ? `Reference · ${pageAt(p.parent)?.title}` : groupOf(p).title;
    const v = p.view;
    let text = plainText(p.summary);

    if (v.kind === "slide") text = plainText([v.slide.thesis, v.slide.src, ...v.slide.points].join(" "));
    if (v.kind === "topic") text = plainText(topicEntries.find((e) => e.key === `topic:${v.name}`)?.markdown ?? "");
    if (v.kind === "entry") text = plainText(`${v.entry.signature ?? ""} ${v.entry.markdown}`);
    if (v.kind === "lint") text = plainText(`${v.lint.group} ${v.lint.summary} ${v.lint.detail}`);

    docs.push({ href: p.path, label: p.title, section, text });

    if (v.kind === "entry") {
      for (const m of v.entry.members) {
        docs.push({ href: `${p.path}#${m.name}`, label: memberLabel(v.entry, m), section: p.title, text: plainText(`${m.signature} ${m.doc}`) });
      }
    }

    if (v.kind === "category" && !categories.find((c) => c.slug === v.slug)?.paged) {
      for (const e of categories.find((c) => c.slug === v.slug)?.entries ?? []) {
        docs.push({ href: `${p.path}#${entrySlug(e.key)}`, label: entryLabel(e.key), section: p.title, text: plainText(e.markdown) });
      }
    }
  }

  return docs;
}
