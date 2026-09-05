import type { ReactNode } from "react";

import BookShell, { type TocChapter } from "@/components/BookShell";
import type { Metadata } from "next";

import CodePane from "@/components/CodePane";
import Markdown, { inline } from "@/components/Markdown";
import Nav from "@/components/Nav";
import { contracts, lints, referenceGroups, slides, stdItems, topic, version } from "@/lib/content";

// The book: one page, chaptered like the Cargo Book. The sidebar lists
// every section; the column reads top to bottom.

function Section({ id, number, title, children }: { id: string; number: string; title: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <h2 className="display mb-4 flex items-baseline gap-3 text-[26px] font-bold leading-[1.15] md:text-[32px]">
        <span className="font-mono text-[14px] font-normal text-muted">{number}</span>
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}

function Sub({ id, number, title, children }: { id: string; number: string; title: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h3 className="display mb-3 flex items-baseline gap-3 text-[20px] font-bold leading-[1.2] md:text-[23px]">
        <span className="font-mono text-[13px] font-normal text-muted">{number}</span>
        <span dangerouslySetInnerHTML={typeof title === "string" ? { __html: title } : undefined}>
          {typeof title === "string" ? undefined : title}
        </span>
      </h3>
      {children}
    </section>
  );
}

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
    ],
  },
  {
    title: "Tooling",
    items: [
      { id: "build", label: "alloy build", number: "5.1" },
      { id: "check", label: "alloy check", number: "5.2" },
      { id: "lint", label: "alloy lint", number: "5.3" },
      { id: "fmt", label: "alloy fmt", number: "5.4" },
      { id: "doc", label: "alloy doc", number: "5.5" },
      { id: "config", label: "alloy.toml", number: "5.6" },
      { id: "luaurc", label: ".luaurc and .config.luau", number: "5.7" },
      { id: "mount", label: "Mounts and project files", number: "5.8" },
    ],
  },
  {
    title: "Reference",
    items: [
      ...referenceGroups.map((g, i) => ({ id: g.slug, label: g.title, number: `6.${i + 1}` })),
      { id: "lints", label: "Lints", number: `6.${referenceGroups.length + 1}` },
    ],
  },
];

export default function Docs() {
  return (
    <>
      <Nav version={version} current="docs" />
      <BookShell chapters={chapters}>
        <div className="mb-10">
          <div className="eyebrow">The Alloy book</div>
          <h1 className="display mb-3 mt-2 text-[36px] font-extrabold leading-[1.05] md:text-[48px]">
            Everything the compiler knows, in reading order.
          </h1>
          <p className="prose m-0 max-w-[60ch] text-[17px] text-ink-2">
            The reference chapters carry the same text the editor shows on hover, generated from the compiler&apos;s own
            table. The language chapters show each construct beside its emitted Luau.
          </p>
        </div>

        <Section id="intro" number="1" title="Introduction">
          <div className="prose">
            <p>
              Alloy is a strict superset of Luau. Every Luau file is already an Alloy file, and a file that uses no Alloy
              feature compiles to itself, byte for byte. Each Alloy construct compiles to fixed Luau on the same line, so
              a stack trace, a breakpoint, and an analyzer diagnostic all point at the line you wrote.
            </p>
            <p>
              The compiler never looks at a type. Luau&apos;s own checker, through luau-lsp, types the emitted code, and
              the language server maps its answers back onto Alloy source. What the checker cannot see, the compiler
              holds as a contract at compile time: exhaustive matches, complete struct construction, implemented traits,
              sealed structs, and data-only remotes.
            </p>
            <p>
              The design razor: a feature earns its place when it removes a pattern Roblox code writes by hand, has one
              fixed emit, and adds no line. <code>alloy doc</code> prints any chapter of this book on the terminal.
            </p>
          </div>
        </Section>

        <Section id="getting-started" number="2" title="Getting started">
          <Sub id="install" number="2.1" title="Install">
            <div className="prose">
              <p>
                The build script compiles every crate and the VS Code extension, then installs <code>alloy</code> and{" "}
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

          <Sub id="first-project" number="2.2" title="A first project">
            <div className="prose">
              <p>
                <code>alloy init</code> writes <code>alloy.toml</code> and, when the folder has neither, the two Luau
                configuration files with strict mode and the <code>@alloy</code> alias. Sources go under <code>src</code>{" "}
                and compile under <code>build</code>, with the runtime beside them as <code>alloy.luau</code>.
              </p>
            </div>
            {shell("mkdir game && cd game\nalloy init          # alloy.toml, .luaurc, .config.luau\nmkdir src\nalloy build         # src/**/*.aly -> build/**/*.luau\nalloy check         # the same compile, nothing written, plus the lints")}
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

          <Sub id="editor" number="2.3" title="The editor">
            <div className="prose">
              <p>
                The language server is a proxy over luau-lsp. It compiles every open Alloy file into a mirror directory,
                hands the mirror to luau-lsp with the Roblox definitions, and maps hover, completion, definition, and
                diagnostics back onto the Alloy lines. Alloy-only syntax gets its own hover text, the text in the
                reference chapters below, and the lints of <code>alloy lint</code> show as warnings. Format Document runs{" "}
                <code>alloy fmt</code>.
              </p>
            </div>
          </Sub>
        </Section>

        <Section id="language" number="3" title="The language">
          {slides.map((s, i) => (
            <Sub key={s.id} id={s.id} number={`3.${i + 1}`} title={s.title}>
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

        <Section id="strict" number="4" title="Strict by default">
          <Sub id="contracts" number="4.1" title="The contracts">
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
          <Sub id="exhaustive" number="4.2" title="Exhaustive match">
            <Markdown text={topic("exhaustive")} />
          </Sub>
          <Sub id="wire" number="4.3" title="Wire types">
            <Markdown text={topic("wire")} />
          </Sub>
          <Sub id="directives" number="4.4" title="Directives">
            <Markdown text={topic("directives")} />
          </Sub>
        </Section>

        <Section id="tooling" number="5" title="Tooling">
          <Sub id="build" number="5.1" title="alloy build">
            <Markdown text={topic("build")} />
          </Sub>
          <Sub id="check" number="5.2" title="alloy check">
            <Markdown text={topic("check")} />
          </Sub>
          <Sub id="lint" number="5.3" title="alloy lint">
            <Markdown text={topic("lint")} />
          </Sub>
          <Sub id="fmt" number="5.4" title="alloy fmt">
            <Markdown text={topic("fmt")} />
          </Sub>
          <Sub id="doc" number="5.5" title="alloy doc">
            <div className="prose">
              <p>
                Prints one entry of this book on the terminal: a keyword, an operator, an intrinsic, an attribute, a std
                name, a lint, or an article. With no topic it lists them all. <code>--json</code> prints the whole table,
                which is what this site is built from.
              </p>
            </div>
            {shell("alloy doc                 # the index\nalloy doc struct          # one keyword\nalloy doc '??='           # one operator\nalloy doc lints           # every lint\nalloy doc optional_access # one lint\nalloy doc strict          # an article")}
          </Sub>
          <Sub id="config" number="5.6" title="alloy.toml">
            <Markdown text={topic("config")} />
          </Sub>
          <Sub id="luaurc" number="5.7" title=".luaurc and .config.luau">
            <Markdown text={topic("luaurc")} />
          </Sub>
          <Sub id="mount" number="5.8" title="Mounts and project files">
            <Markdown text={topic("mount")} />
          </Sub>
        </Section>

        <Section id="reference" number="6" title="Reference">
          {referenceGroups.map((g, i) => (
            <Sub key={g.slug} id={g.slug} number={`6.${i + 1}`} title={g.title}>
              {g.slug === "std" ? (
                <div className="mb-6 grid gap-2 sm:grid-cols-2">
                  {stdItems.map(([name, what]) => (
                    <div key={name} className="rounded-lg border border-line bg-panel px-4 py-3">
                      <div className="font-mono text-[13.5px] text-accent-ink">{name}</div>
                      <div className="text-[13.5px] text-ink-2">{what}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {g.keys.map((e) => (
                <article key={e.key} id={`ref-${e.key.replace(/[^A-Za-z0-9_]/g, (c) => `_${c.charCodeAt(0)}`)}`} className="entry">
                  <h3>{e.key.replace(/^derive:/, "@derive(") + (e.key.startsWith("derive:") ? ")" : "")}</h3>
                  <Markdown text={e.markdown} />
                </article>
              ))}
            </Sub>
          ))}
          <Sub id="lints" number={`6.${referenceGroups.length + 1}`} title="Lints">
            <div className="prose">
              <p>
                {inline(
                  "`alloy lint` runs them; `[lint]` in alloy.toml sets `deny`, `warn`, and `allow` lists, and `strict = true` turns the strict-only ones on. The language server shows the same lints as warnings.",
                )}
              </p>
            </div>
            {lints.map((l) => (
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
          </Sub>
        </Section>

        <footer className="mt-4 border-t border-line pt-6 text-[13px] text-muted">
          Alloy {version}. The reference text is generated by <code className="font-mono">alloy doc --json</code>.
        </footer>
      </BookShell>
    </>
  );
}
