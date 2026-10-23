import type { ReactNode } from "react";

import CodePane from "@/components/CodePane";

// The hand-written pages of the docs: everything that is not in the
// compiler's doc table. scripts/stamp-updated.mjs dates them from this
// file as `page:docs`.

const shell = (s: string) => <CodePane code={s} mode="sh" label="Shell" className="mb-4" />;

export const intro: ReactNode = (
  <div className="prose">
    <p>
      Alloy is a strict superset of Luau. Every Luau file is already an Alloy file. A file that uses no Alloy feature
      compiles to itself, byte for byte. Each Alloy construct compiles to fixed Luau on the same line. A stack trace, a
      breakpoint, and an analyzer diagnostic all point at the line you wrote.
    </p>
    <p>
      The compiler never looks at a type. Luau&apos;s own checker types the emitted code through luau-lsp. The language
      server maps its answers back onto the Alloy source. The compiler holds the contracts the checker cannot see:
      exhaustive matches, complete struct construction, implemented traits, sealed structs, and data-only remotes.
    </p>
    <p>
      The design rule is short. A feature earns its place when it removes a pattern that Roblox code writes by hand, has
      one fixed emit, and adds no line. <code>alloy doc</code> prints any page of these docs on the terminal.
    </p>
  </div>
);

export const prose: Record<string, ReactNode> = {
  install: (
    <>
      <div className="prose">
        <p>
          The build script compiles every crate and the VS Code extension. It then installs <code>alloy</code> and{" "}
          <code>alloy-lsp</code> into <code>~/.alloy/bin</code>. Put that directory on your PATH.
        </p>
      </div>
      {shell(
        "scripts/build.sh --release --install   # every crate, the extension, then the two binaries\nalloy --version\nalloy self update                      # later: fetch the latest release\nalloy self uninstall                   # removes them again",
      )}
      <div className="prose">
        <p>
          The extension is the <code>.vsix</code> the script writes under <code>extensions/vscode</code>. Install it from
          the Extensions view with &ldquo;Install from VSIX&rdquo;. It finds the binaries on PATH or through the{" "}
          <code>alloy.path</code> setting.
        </p>
      </div>
    </>
  ),
  "first-project": (
    <>
      <div className="prose">
        <p>
          <code>alloy init</code> writes <code>alloy.toml</code>. When the folder has no Luau configuration, it also
          writes the two configuration files, with strict mode and the <code>@alloy</code> alias. Sources go under{" "}
          <code>src</code> and compile under <code>build</code>. The runtime sits beside them as <code>alloy.luau</code>.
        </p>
      </div>
      {shell(
        "mkdir game && cd game\nalloy init          # alloy.toml, .luaurc, .config.luau\nmkdir src\nalloy build         # src/**/*.aly -> build/**/*.luau\nalloy flux          # the compile, the type check, and the lints\nalloy test --run    # one lest spec per source with a @test, then lest",
      )}
      <CodePane
        code={
          '-- src/hello.aly\nstruct Greeting\n    name: string\n    times: number = 1\nend\n\nlocal g = new Greeting { name = "world" }\n\nfor _ = 1, g.times do\n    print(`hello, {g.name}`)\nend'
        }
        mode="alloy"
        label="Alloy"
        note="src/hello.aly"
        className="mb-4"
      />
      <div className="prose">
        <p>
          Point Rojo, or any sync tool, at <code>build</code>. An unchanged output is not rewritten, so the sync stays
          quiet.
        </p>
        <p>
          Packages come from <a href="https://emberpm.dev">Ember</a>. Set <code>language = &quot;alloy&quot;</code> in
          the <code>[target]</code> of <code>ember.toml</code>. <code>embr add</code> then installs Alloy and Luau
          packages, and <code>embr publish</code> runs <code>alloy build</code> before it packs. Alloy itself runs no
          package manager.
        </p>
      </div>
    </>
  ),
  editor: (
    <div className="prose">
      <p>
        The language server is a proxy over luau-lsp. It compiles every open Alloy file into a mirror directory. It hands
        the mirror to luau-lsp with the Roblox definitions. It maps hover, completion, definition, and diagnostics back
        onto the Alloy lines. Alloy-only syntax has its own hover text, the text of the reference pages. The lints of{" "}
        <code>alloy lint</code> show as warnings. Format Document runs <code>alloy fmt</code>.
      </p>
      <p>
        A diagnostic carries a code such as <code>Alloy(3.6)</code>. The code links to the page that explains the rule,
        and <code>alloy doc 3.6</code> prints that page on the terminal.
      </p>
    </div>
  ),
  doc: (
    <>
      <div className="prose">
        <p>
          Prints one page of these docs on the terminal: a keyword, an operator, an intrinsic, an attribute, a std name,
          a lint, or an article. With no topic it lists them all. <code>--json</code> prints the whole table, which is
          what this site is built from.
        </p>
      </div>
      {shell(
        "alloy doc                 # the index\nalloy doc struct          # one keyword\nalloy doc '??='           # one operator\nalloy doc lints           # every lint\nalloy doc optional_access # one lint\nalloy doc strict          # an article",
      )}
    </>
  ),
  mcp: (
    <>
      <div className="prose">
        <p>
          Serves these docs to a coding agent over MCP, the Model Context Protocol. The agent starts{" "}
          <code>alloy mcp</code> and talks to it over stdio. The answers come from the table of{" "}
          <code>alloy doc</code>, so the agent reads the docs of the compiler it runs.
        </p>
        <p>The server gives four tools:</p>
        <ul className="pointlist">
          <li>
            <code>search_docs</code> ranks the topics by a query, and returns each one with a short snippet.
          </li>
          <li>
            <code>read_doc</code> returns one topic as markdown, the text <code>alloy doc</code> prints.
          </li>
          <li>
            <code>list_topics</code> lists every topic, by group.
          </li>
          <li>
            <code>style_guide</code> returns <code>alloy doc style</code>: how to write Alloy that reads as Alloy.
          </li>
        </ul>
        <p>Register it with Claude Code once:</p>
      </div>
      {shell("claude mcp add alloy -- alloy mcp")}
      <div className="prose">
        <p>
          Another MCP client starts the same command, with no arguments. A client that reads a JSON list of
          servers, such as <code>.mcp.json</code>, takes this entry:
        </p>
      </div>
      <CodePane
        code={'{\n  "mcpServers": {\n    "alloy": { "command": "alloy", "args": ["mcp"] }\n  }\n}'}
        mode="json"
        label="JSON"
        note=".mcp.json"
        className="mb-4"
      />
      <div className="prose">
        <p>
          <code>alloy init</code> also writes an agent guide, <code>AGENTS.md</code> by default. The guide gives the
          layout, the commands, and the style rules, and it names <code>alloy mcp</code>.
        </p>
      </div>
    </>
  ),
  migrate: (
    <>
      <div className="prose">
        <p>
          Rewrites <code>alloy.toml</code> in the current folder as <code>.config.aly</code>, then removes{" "}
          <code>alloy.toml</code>. While both files exist, <code>alloy.toml</code> wins.
        </p>
        <p>
          The new file keeps every key and every comment, and the <code>[fmt]</code> table of the project sets its
          quotes and its indent. Before it writes, the command loads the new file and compares the two configs. When
          they differ, it writes nothing. It never overwrites a <code>.config.aly</code>.
        </p>
      </div>
      {shell("alloy migrate      # alloy.toml -> .config.aly")}
    </>
  ),
  self: (
    <>
      <div className="prose">
        <p>
          Manages the installed binaries, <code>alloy</code> and <code>alloy-lsp</code>, in{" "}
          <code>~/.alloy/bin</code>. <code>--dir</code> picks another folder.
        </p>
      </div>
      {shell(
        "alloy self install             # copy the binaries to ~/.alloy/bin; what is missing comes from the release\nalloy self update              # fetch the latest release and install it\nalloy self update --version v  # fetch that release\nalloy self uninstall           # remove the binaries\nalloy self code                # write ~/.alloy/alloy.schema.json and point VS Code and Zed at it\nalloy self code --dry-run      # print those edits, write nothing\nalloy self schema              # print the JSON Schema of alloy.toml",
      )}
    </>
  ),
};
