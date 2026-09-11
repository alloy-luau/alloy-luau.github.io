import { Fragment, type ReactNode } from "react";

import BookShell, { type TocChapter } from "@/components/BookShell";
import type { Metadata } from "next";

import CodePane from "@/components/CodePane";
import Markdown, { inline } from "@/components/Markdown";
import UpdatedPill from "@/components/UpdatedPill";
import {
  contracts,
  lintGroups,
  memberGroups,
  memberLabel,
  plainText,
  referenceGroups,
  slides,
  stdItems,
  topic,
  updatedAll,
  updatedAt,
  version,
  type Entry,
  type SearchDoc,
} from "@/lib/content";

// The book: one page, chaptered like the Cargo Book. The sidebar lists
// every section; the column reads top to bottom.

function Section({
  id,
  number,
  title,
  updated,
  children,
}: {
  id: string;
  number: string;
  title: ReactNode;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <h2 className="display mb-4 flex flex-wrap items-baseline gap-3 text-[26px] font-bold leading-[1.15] md:text-[32px]">
        <span className="font-mono text-[14px] font-normal text-muted">{number}</span>
        <span>{title}</span>
        {updated ? (
          <span className="ml-auto self-center">
            <UpdatedPill date={updated} />
          </span>
        ) : null}
      </h2>
      {children}
    </section>
  );
}

/** The anchor of one reference entry, from its key. */
function entryId(key: string): string {
  return `ref-${key.replace(/[^A-Za-z0-9_]/g, (c) => `_${c.charCodeAt(0)}`)}`;
}

/** The anchor of one member section. */
function memberId(key: string, name: string): string {
  return `${entryId(key)}-${name}`;
}

/** One std type as a reference page: the signature, the overview, an
 *  index of the members, then a section for each of them. */
function StdEntry({ entry }: { entry: Entry }) {
  const groups = memberGroups(entry);

  return (
    <>
      {entry.signature ? <CodePane code={entry.signature} mode="alloy" className="mb-3" /> : null}
      <Markdown text={entry.markdown} />
      {groups.length > 0 ? (
        <nav className="member-index" aria-label={`${entry.key} members`}>
          {groups.map((g) =>
            g.members.map((m) => (
              <a key={`${g.kind}-${m.name}`} href={`#${memberId(entry.key, m.name)}`} className="chip glass">
                {m.name}
              </a>
            )),
          )}
        </nav>
      ) : null}
      {groups.map((g) => (
        <div key={g.kind}>
          <h4 className="member-kind">{g.title}</h4>
          {g.members.map((m) => (
            <section key={m.name} id={memberId(entry.key, m.name)} className="member glass">
              <h5>{memberLabel(entry, m)}</h5>
              <CodePane code={m.signature} mode="alloy" className="mb-2" />
              <div className="prose">
                <p>{inline(m.doc).map((n, j) => <Fragment key={j}>{n}</Fragment>)}</p>
              </div>
              <CodePane code={m.example} mode="alloy" />
            </section>
          ))}
        </div>
      ))}
    </>
  );
}

function Sub({
  id,
  number,
  title,
  updated,
  children,
}: {
  id: string;
  number: string;
  title: ReactNode;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h3 className="display mb-3 flex flex-wrap items-baseline gap-3 text-[20px] font-bold leading-[1.2] md:text-[23px]">
        <span className="font-mono text-[13px] font-normal text-muted">{number}</span>
        <span dangerouslySetInnerHTML={typeof title === "string" ? { __html: title } : undefined}>
          {typeof title === "string" ? undefined : title}
        </span>
        {updated ? (
          <span className="ml-auto self-center">
            <UpdatedPill date={updated} />
          </span>
        ) : null}
      </h3>
      {children}
    </section>
  );
}

// The day each chapter last changed: the page's own prose for the
// hand-written ones, the table entries and tour chapters for the rest.
const pageDate = updatedAt(["page:docs"]);
const topicDate = (name: string) => updatedAt([`entry:topic:${name}`, "page:docs"]);
const slideDates = slides.map((s) => updatedAt([`slide:${s.id}`]));
const lintDate = updatedAt(lintGroups.flatMap((g) => g.lints.map((l) => `lint:${l.name}`)));
const referenceDates = referenceGroups.map((g) => updatedAt(g.keys.map((e) => `entry:${e.key}`)));
const latest = (dates: (string | undefined)[]) => dates.filter((d): d is string => Boolean(d)).sort().at(-1);

const shell = (s: string) => <CodePane code={s} mode="sh" label="Shell" className="mb-4" />;

export const metadata: Metadata = {
  title: "The book",
  description:
    "Every Alloy construct with its emitted Luau beside it: operators, structs, enums, match, traits, async, remotes, macros, attributes, the strictness rules, the lints, and the toolchain.",
  alternates: { canonical: "/docs/" },
  openGraph: {
    title: "The Alloy book",
    description:
      "Every Alloy construct with its emitted Luau beside it, from safe access to typed remotes, plus the lints and the toolchain.",
    url: "/docs/",
  },
};

const chapters: TocChapter[] = [
  { title: "Start", items: [{ id: "intro", label: "Introduction", number: "1" }] },
  {
    title: "Getting started",
    items: [
      { id: "install", label: "Install", number: "2.1" },
      { id: "first-project", label: "A first project", number: "2.2" },
      { id: "editor", label: "The editor", number: "2.3" },
    ],
  },
  {
    title: "The language",
    items: slides.map((s, i) => ({
      id: s.id,
      label: s.title.replace(/<[^>]+>/g, ""),
      number: `3.${i + 1}`,
    })),
  },
  {
    title: "Strict by default",
    items: [
      { id: "contracts", label: "The contracts", number: "4.1" },
      { id: "exhaustive", label: "Exhaustive match", number: "4.2" },
      { id: "wire", label: "Wire types", number: "4.3" },
      { id: "directives", label: "Directives", number: "4.4" },
      { id: "results-and-futures", label: "Results and Futures", number: "4.5" },
    ],
  },
  {
    title: "Tooling",
    items: [
      { id: "build", label: "alloy build", number: "5.1" },
      { id: "check", label: "alloy check", number: "5.2" },
      { id: "lint", label: "alloy lint", number: "5.3" },
      { id: "flux", label: "alloy flux", number: "5.4" },
      { id: "fmt", label: "alloy fmt", number: "5.5" },
      { id: "test", label: "alloy test", number: "5.6" },
      { id: "doc", label: "alloy doc", number: "5.7" },
      { id: "config", label: "alloy.toml", number: "5.8" },
      { id: "luaurc", label: ".luaurc and .config.luau", number: "5.9" },
      { id: "mount", label: "Mounts and project files", number: "5.10" },
      { id: "data", label: "JSON and TOML data", number: "5.11" },
      { id: "ingots", label: "Ingots", number: "5.12" },
    ],
  },
  {
    title: "Reference",
    items: [
      ...referenceGroups.map((g, i) => ({ id: `ref-${g.slug}`, label: g.title, number: `6.${i + 1}` })),
      { id: "lints", label: "Lints", number: `6.${referenceGroups.length + 1}` },
    ],
  },
];

// Everything the search box reads: each section with its text, each
// reference entry, and each lint, at the anchor it lives at.
const index: SearchDoc[] = [
  ...chapters.flatMap((c) => c.items.map((i) => ({ id: i.id, label: i.label, number: i.number ?? "", text: "" }))),
  ...slides.map((s, i) => ({
    id: s.id,
    label: s.title.replace(/<[^>]+>/g, ""),
    number: `3.${i + 1}`,
    text: plainText([s.thesis, s.src, ...s.points].join(" ")),
  })),
  ...["strict", "exhaustive", "wire", "directives", "results-and-futures"].map((name, i) => ({
    id: ["contracts", "exhaustive", "wire", "directives", "results-and-futures"][i],
    label: ["The contracts", "Exhaustive match", "Wire types", "Directives", "Results and Futures"][i],
    number: `4.${i + 1}`,
    text: plainText(topic(name)),
  })),
  ...["build", "check", "lint", "flux", "fmt", "test", "config", "luaurc", "mount", "data", "ingots"].map((name) => {
    const item = chapters.flatMap((c) => c.items).find((i) => i.id === name);

    return { id: name, label: item?.label ?? name, number: item?.number ?? "", text: plainText(topic(name)) };
  }),
  ...referenceGroups.flatMap((g, i) =>
    g.keys.map((e) => ({
      id: entryId(e.key),
      label: e.key.replace(/^derive:/, "@derive(") + (e.key.startsWith("derive:") ? ")" : ""),
      number: `6.${i + 1}`,
      text: plainText(`${e.signature ?? ""} ${e.markdown}`),
    })),
  ),
  ...referenceGroups.flatMap((g, i) =>
    g.keys.flatMap((e) =>
      e.members.map((m) => ({
        id: memberId(e.key, m.name),
        label: memberLabel(e, m),
        number: `6.${i + 1}`,
        text: plainText(`${m.signature} ${m.doc}`),
      })),
    ),
  ),
  ...lintGroups.flatMap((g) =>
    g.lints.map((l) => ({
      id: `lints-${g.name}`,
      label: l.name,
      number: `6.${referenceGroups.length + 1}`,
      text: plainText(`${l.summary} ${l.detail}`),
    })),
  ),
].filter((d, i, all) => all.findIndex((o) => o.id === d.id && o.label === d.label) === i);

export default function Docs() {
  return (
    <BookShell chapters={chapters} index={index}>
      <div className="mb-10">
        <div className="eyebrow">The Alloy book</div>
        <h1 className="display mb-3 mt-2 text-[36px] font-extrabold leading-[1.05] md:text-[48px]">
          Everything the compiler knows, in reading order.
        </h1>
        <p className="prose m-0 max-w-[60ch] text-[17px] text-ink-2">
          The reference chapters carry the same text the editor shows on hover, generated from the compiler&apos;s own
          table. The language chapters show each construct beside its emitted Luau.
        </p>
        <div className="mt-5">
          <UpdatedPill date={updatedAll} label="Last updated" size="md" />
        </div>
      </div>

      <Section id="intro" updated={pageDate} number="1" title="Introduction">
        <div className="prose">
          <p>
            Alloy is a strict superset of Luau. Every Luau file is already an Alloy file. A file that uses no Alloy
            feature compiles to itself, byte for byte. Each Alloy construct compiles to fixed Luau on the same line. A
            stack trace, a breakpoint, and an analyzer diagnostic all point at the line you wrote.
          </p>
          <p>
            The compiler never looks at a type. Luau&apos;s own checker types the emitted code through luau-lsp. The
            language server maps its answers back onto the Alloy source. The compiler holds the contracts the checker
            cannot see: exhaustive matches, complete struct construction, implemented traits, sealed structs, and
            data-only remotes.
          </p>
          <p>
            The design rule is short. A feature earns its place when it removes a pattern that Roblox code writes by
            hand, has one fixed emit, and adds no line. <code>alloy doc</code> prints any chapter of this book on the
            terminal.
          </p>
        </div>
      </Section>

      <Section id="getting-started" updated={pageDate} number="2" title="Getting started">
        <Sub id="install" updated={pageDate} number="2.1" title="Install">
          <div className="prose">
            <p>
              The build script compiles every crate and the VS Code extension. It then installs <code>alloy</code> and{" "}
              <code>alloy-lsp</code> into <code>~/.alloy/bin</code>. Put that directory on your PATH.
            </p>
          </div>
          {shell("scripts/build.sh --release --install   # every crate, the extension, then the two binaries\nalloy --version\nalloy self uninstall                   # removes them again")}
          <div className="prose">
            <p>
              The extension is the <code>.vsix</code> the script writes under <code>extensions/vscode</code>. Install it
              from the Extensions view with &ldquo;Install from VSIX&rdquo;. It finds the binaries on PATH or through the{" "}
              <code>alloy.path</code> setting.
            </p>
          </div>
        </Sub>

        <Sub id="first-project" updated={pageDate} number="2.2" title="A first project">
          <div className="prose">
            <p>
              <code>alloy init</code> writes <code>alloy.toml</code>. When the folder has no Luau configuration, it also
              writes the two configuration files, with strict mode and the <code>@alloy</code> alias. Sources go under{" "}
              <code>src</code> and compile under <code>build</code>. The runtime sits beside them as <code>alloy.luau</code>.
            </p>
          </div>
          {shell("mkdir game && cd game\nalloy init          # alloy.toml, .luaurc, .config.luau\nmkdir src\nalloy build         # src/**/*.aly -> build/**/*.luau\nalloy flux          # the compile, the type check, and the lints\nalloy test --run    # one lest spec per source with a @test, then lest")}
          <CodePane
            code={"-- src/hello.aly\nstruct Greeting as\n    name: string\n    times: number = 1\nend\n\nlocal g = new Greeting { name = \"world\" }\n\nfor _ = 1, g.times do\n    print(`hello, {g.name}`)\nend"}
            mode="alloy"
            label="Alloy"
            note="src/hello.aly"
            className="mb-4"
          />
          <div className="prose">
            <p>
              Point Rojo, or any sync tool, at <code>build</code>. An unchanged output is not rewritten, so the sync
              stays quiet.
            </p>
          </div>
        </Sub>

        <Sub id="editor" updated={pageDate} number="2.3" title="The editor">
          <div className="prose">
            <p>
              The language server is a proxy over luau-lsp. It compiles every open Alloy file into a mirror directory.
              It hands the mirror to luau-lsp with the Roblox definitions. It maps hover, completion, definition, and
              diagnostics back onto the Alloy lines. Alloy-only syntax has its own hover text, the text of the
              reference chapters below. The lints of <code>alloy lint</code> show as warnings. Format Document runs{" "}
              <code>alloy fmt</code>.
            </p>
          </div>
        </Sub>
      </Section>

      <Section id="language" number="3" title="The language" updated={latest(slideDates)}>
        {slides.map((s, i) => (
          <Sub key={s.id} id={s.id} number={`3.${i + 1}`} title={s.title} updated={slideDates[i]}>
            <div className="prose">
              <p>{s.thesis}</p>
            </div>
            <CodePane
              code={s.src}
              mode={s.mode === "alx" ? "alx" : "alloy"}
              label="Alloy"
              note={s.mode === "alx" ? "component.alx" : `${s.id}.aly`}
              numbers
              className="mb-2"
            />
            <CodePane code={s.emit} mode="luau" label="Emitted Luau" note="same line count" emit numbers className="mb-2" />
            <ul className="pointlist">
              {s.points.map((p, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </ul>
          </Sub>
        ))}
      </Section>

      <Section id="strict" number="4" title="Strict by default" updated={latest(["strict", "exhaustive", "wire", "directives", "results-and-futures"].map(topicDate))}>
        <Sub id="contracts" updated={topicDate("strict")} number="4.1" title="The contracts">
          <Markdown text={topic("strict")} />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {contracts.map((c) => (
              <article key={c.title} className="overflow-hidden rounded-xl border border-line bg-panel">
                <div className="p-4">
                  <h4 className="display m-0 mb-1 text-[16px] font-bold">{c.title}</h4>
                  <p className="m-0 text-[14px] text-ink-2">{c.body}</p>
                </div>
                <CodePane code={c.code} mode="alloy" className="rounded-none border-0 border-t" />
              </article>
            ))}
          </div>
        </Sub>
        <Sub id="exhaustive" updated={topicDate("exhaustive")} number="4.2" title="Exhaustive match">
          <Markdown text={topic("exhaustive")} />
        </Sub>
        <Sub id="wire" updated={topicDate("wire")} number="4.3" title="Wire types">
          <Markdown text={topic("wire")} />
        </Sub>
        <Sub id="directives" updated={topicDate("directives")} number="4.4" title="Directives">
          <Markdown text={topic("directives")} />
        </Sub>
        <Sub
          id="results-and-futures"
          updated={topicDate("results-and-futures")}
          number="4.5"
          title="Results and Futures"
        >
          <Markdown text={topic("results-and-futures")} />
        </Sub>
      </Section>

      <Section id="tooling" number="5" title="Tooling" updated={latest(["build", "check", "lint", "flux", "fmt", "test", "config", "luaurc", "mount", "data", "ingots"].map(topicDate))}>
        <Sub id="build" updated={topicDate("build")} number="5.1" title="alloy build">
          <Markdown text={topic("build")} />
        </Sub>
        <Sub id="check" updated={topicDate("check")} number="5.2" title="alloy check">
          <Markdown text={topic("check")} />
        </Sub>
        <Sub id="lint" updated={topicDate("lint")} number="5.3" title="alloy lint">
          <Markdown text={topic("lint")} />
        </Sub>
        <Sub id="flux" updated={topicDate("flux")} number="5.4" title="alloy flux">
          <Markdown text={topic("flux")} />
        </Sub>
        <Sub id="fmt" updated={topicDate("fmt")} number="5.5" title="alloy fmt">
          <Markdown text={topic("fmt")} />
        </Sub>
        <Sub id="test" updated={topicDate("test")} number="5.6" title="alloy test">
          <Markdown text={topic("test")} />
        </Sub>
        <Sub id="doc" updated={pageDate} number="5.7" title="alloy doc">
          <div className="prose">
            <p>
              Prints one entry of this book on the terminal: a keyword, an operator, an intrinsic, an attribute, a std
              name, a lint, or an article. With no topic it lists them all. <code>--json</code> prints the whole table,
              which is what this site is built from.
            </p>
          </div>
          {shell("alloy doc                 # the index\nalloy doc struct          # one keyword\nalloy doc '??='           # one operator\nalloy doc lints           # every lint\nalloy doc optional_access # one lint\nalloy doc strict          # an article")}
        </Sub>
        <Sub id="config" updated={topicDate("config")} number="5.8" title="alloy.toml">
          <Markdown text={topic("config")} />
        </Sub>
        <Sub id="luaurc" updated={topicDate("luaurc")} number="5.9" title=".luaurc and .config.luau">
          <Markdown text={topic("luaurc")} />
        </Sub>
        <Sub id="mount" updated={topicDate("mount")} number="5.10" title="Mounts and project files">
          <Markdown text={topic("mount")} />
        </Sub>
        <Sub id="data" updated={topicDate("data")} number="5.11" title="JSON and TOML data">
          <Markdown text={topic("data")} />
        </Sub>
        <Sub id="ingots" updated={topicDate("ingots")} number="5.12" title="Ingots">
          <Markdown text={topic("ingots")} />
        </Sub>
      </Section>

      <Section id="reference" number="6" title="Reference" updated={latest([...referenceDates, lintDate])}>
        {referenceGroups.map((g, i) => (
          <Sub key={g.slug} id={`ref-${g.slug}`} number={`6.${i + 1}`} title={g.title} updated={referenceDates[i]}>
            {g.slug === "std" ? (
              <div className="mb-6 grid gap-2 sm:grid-cols-2">
                {stdItems.map(([name, what, key]) => (
                  <a
                    key={name}
                    href={`#${entryId(key)}`}
                    className="block rounded-lg border border-line bg-panel px-4 py-3 no-underline transition-colors hover:border-accent-ink"
                  >
                    <div className="font-mono text-[13.5px] text-accent-ink">{name}</div>
                    <div className="text-[13.5px] text-ink-2">{what}</div>
                  </a>
                ))}
              </div>
            ) : null}
            {g.keys.map((e) => (
              <article key={e.key} id={entryId(e.key)} className="entry">
                <h3>{e.key.replace(/^derive:/, "@derive(") + (e.key.startsWith("derive:") ? ")" : "")}</h3>
                {g.slug === "std" ? <StdEntry entry={e} /> : <Markdown text={e.markdown} />}
              </article>
            ))}
          </Sub>
        ))}
        <Sub id="lints" number={`6.${referenceGroups.length + 1}`} title="Lints" updated={lintDate}>
          <div className="prose">
            <p>
              {inline(
                "`alloy flux` and `alloy lint` run them; `[lint]` in alloy.toml sets `deny`, `warn`, and `allow` lists by lint or by group, and `strict = true` turns the pedantic group on. A lint whose rewrite keeps the program the same carries it, and `alloy flux --fix` applies those. The language server shows the same lints as warnings.",
              )}
            </p>
          </div>
          {lintGroups.map((g) => (
            <div key={g.name} id={`lints-${g.name}`}>
              <h4 className="display mt-8 mb-1 text-[17px] font-bold">
                {g.name} <span className="chip ml-2 text-[11px]">{g.lints.length}</span>
              </h4>
              <div className="prose">
                <p>{inline(g.summary)}</p>
              </div>
              {g.lints.map((l) => (
                <article key={l.name} className="entry">
                  <h3>
                    {l.name}{" "}
                    <span className="chip ml-2 text-[11px]">{l.default === "strict" ? "off until [lint] strict" : l.default}</span>
                  </h3>
                  <div className="prose">
                    <p>
                      <b>{inline(l.summary)}</b>
                    </p>
                    <p>{inline(l.detail)}</p>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </Sub>
      </Section>

      <footer className="mt-4 border-t border-line pt-6 text-[13px] text-muted">
        Alloy {version}. The reference text is generated by <code className="font-mono">alloy doc --json</code>.
      </footer>
    </BookShell>
  );
}
