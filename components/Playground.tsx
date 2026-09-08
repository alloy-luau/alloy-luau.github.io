"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  hoverTooltip,
  keymap,
  lineNumbers,
  type Tooltip,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
  CompletionContext,
  type Completion,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { lintGutter, setDiagnostics, type Diagnostic } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";

import { alloyHighlight, alloyLanguage, alloyTheme } from "@/lib/alloy-mode";
import { slides } from "@/lib/content";
import { mdToHtml } from "@/lib/md";

// The playground: the Alloy compiler as wasm answers the compile, the
// completion contexts, and the keyword hovers; Luau's analyzer as wasm
// reads the check artifact for the type errors, the member completion,
// and the type at a position, which the span map turns back into the
// source's positions. Luau's VM runs the ship artifact for `print`.

type AlloyModule = {
  default: (input?: { module_or_path: string }) => Promise<unknown>;
  runtime: () => string;
  set_source: (src: string) => string;
  to_source: (offset: number) => number;
  to_check: (offset: number) => number;
  generated_at: (offset: number) => boolean;
  complete: (offset: number) => string;
  hover: (offset: number) => string;
  fold: (text: string) => string;
  doc_of: (name: string) => string;
};

type LuauModule = {
  ccall: (name: string, ret: string | null, argTypes: string[], args: unknown[]) => unknown;
};

type Compiled = {
  ship: string;
  check: string;
  diagnostics: { start: number; end: number; message: string; code?: string | null }[];
  lints: { name: string; level: "warning" | "error"; start: number; end: number; message: string }[];
  error?: { offset: number; message: string };
};

type LuauError = { line: number; col: number; endLine: number; endCol: number; message: string };
type LuauItem = { label: string; kind: string; type?: string; deprecated?: boolean; insert?: string; symbol?: string };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Byte offsets and line starts of one text, for the wasm sides. */
class Positions {
  bytes: Uint8Array;
  lineStarts: number[];

  constructor(public text: string) {
    this.bytes = encoder.encode(text);
    this.lineStarts = [0];

    for (let i = 0; i < this.bytes.length; i++) {
      if (this.bytes[i] === 10) this.lineStarts.push(i + 1);
    }
  }

  byteOf(pos: number): number {
    return encoder.encode(this.text.slice(0, pos)).length;
  }

  charOf(byte: number): number {
    return decoder.decode(this.bytes.subarray(0, Math.max(0, Math.min(byte, this.bytes.length)))).length;
  }

  lineCol(byte: number): { line: number; col: number } {
    let lo = 0;
    let hi = this.lineStarts.length - 1;

    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;

      if (this.lineStarts[mid] <= byte) lo = mid;
      else hi = mid - 1;
    }

    return { line: lo, col: byte - this.lineStarts[lo] };
  }

  byteAt(line: number, col: number): number {
    const start = this.lineStarts[Math.min(line, this.lineStarts.length - 1)] ?? 0;

    return start + col;
  }
}

const KIND_GLYPH: Record<string, string> = {
  keyword: "K",
  attribute: "@",
  macro: "$",
  constant: "C",
  directive: "--",
  type: "T",
  class: "C",
  property: "·",
  variable: "x",
  function: "ƒ",
  method: "ƒ",
  module: "M",
  string: '"',
  text: "·",
};

const EXAMPLES = slides
  .filter((s) => s.mode !== "alx")
  .map((s) => ({ id: s.id, title: s.title.replace(/<[^>]+>/g, ""), src: s.src }));

const DEFAULT_SOURCE = `-- Alloy in the browser: the compiler, the type checker, completion,
-- and hover all run here. Edit anything; the Luau appears beside it.
struct Vec2 as
    x: number
    y: number
end

impl Vec2
    function length(self): number
        return math.sqrt(self.x * self.x + self.y * self.y)
    end
end

enum Msg as
    Join(string)
    Leave(string, number)
end

local function describe(msg: Msg): string
    return match msg with
        case Join(name) then \`{name} joined\`
        case Leave(name, after) then \`{name} left after {after}s\`
    end
end

local points = [ new Vec2 { x = 3, y = 4 }, new Vec2 { x = 1, y = 1 } ]
local lengths = points:map(function(p) return p:length() end)

print(describe(Msg.Join("ada")), lengths:join(", "))
print(points:first()?.x ?? 0)
`;

function decodeHash(): string | null {
  if (typeof window === "undefined" || !window.location.hash.startsWith("#code=")) return null;

  try {
    const packed = window.location.hash.slice("#code=".length);
    const bytes = Uint8Array.from(atob(packed.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

function encodeHash(source: string): string {
  const bytes = encoder.encode(source);
  let binary = "";

  for (const b of bytes) binary += String.fromCharCode(b);

  return "#code=" + btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function Playground() {
  const hostRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const outViewRef = useRef<EditorView | null>(null);
  const alloyRef = useRef<AlloyModule | null>(null);
  const luauRef = useRef<LuauModule | null>(null);
  const compiledRef = useRef<Compiled | null>(null);
  const sourcePosRef = useRef<Positions | null>(null);
  const checkPosRef = useRef<Positions | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const [status, setStatus] = useState<{ compiler: string; analyzer: string }>({ compiler: "loading", analyzer: "loading" });
  const [tab, setTab] = useState<"luau" | "output">("luau");
  const [output, setOutput] = useState<string>("");
  const [problems, setProblems] = useState<{ severity: string; line: number; message: string }[]>([]);
  const [copied, setCopied] = useState(false);

  const initial = useMemo(() => decodeHash() ?? DEFAULT_SOURCE, []);

  // The compile of one text: the compiler's output, the positions of
  // the source and the check artifact, and the analyzer's copy of the
  // artifact. No editor state changes here, so a completion may call it.
  const compile = (source: string): Compiled | null => {
    const alloy = alloyRef.current;

    if (!alloy) return null;

    const compiled = JSON.parse(alloy.set_source(source)) as Compiled;
    compiledRef.current = compiled;
    sourcePosRef.current = new Positions(source);

    if (compiled.check) {
      checkPosRef.current = new Positions(compiled.check);
      luauRef.current?.ccall("alloy_set_module", null, ["string", "string"], ["main", compiled.check]);
    } else {
      checkPosRef.current = null;
    }

    return compiled;
  };

  // The whole pipeline for the text in the editor: compile, then the
  // analyzer, then the diagnostics and the output pane.
  const analyze = (view: EditorView) => {
    const alloy = alloyRef.current;
    const source = view.state.doc.toString();
    const compiled = compile(source);

    if (!alloy || !compiled) return;

    const src = sourcePosRef.current!;
    const diagnostics: Diagnostic[] = [];
    const list: { severity: string; line: number; message: string }[] = [];
    const length = view.state.doc.length;
    const push = (from: number, to: number, severity: "error" | "warning", message: string, origin: string) => {
      const a = Math.min(from, length);
      const b = Math.min(Math.max(to, a + 1), length);
      diagnostics.push({ from: Math.min(a, b), to: b, severity, message, source: origin });
      list.push({ severity, line: view.state.doc.lineAt(Math.min(a, length)).number, message });
    };

    if (compiled.error) {
      push(src.charOf(compiled.error.offset), src.charOf(compiled.error.offset) + 1, "error", compiled.error.message, "alloy");
    }

    for (const d of compiled.diagnostics ?? []) {
      push(src.charOf(d.start), src.charOf(d.end), "error", d.message, "alloy");
    }

    for (const l of compiled.lints ?? []) {
      push(src.charOf(l.start), src.charOf(l.end), l.level, `${l.name}: ${l.message}`, "lint");
    }

    const check = checkPosRef.current;

    if (compiled.check && check) {
      const luau = luauRef.current;

      if (luau) {
        const errors = JSON.parse(luau.ccall("alloy_check", "string", [], []) as string) as LuauError[];
        const silenced = new Set(compiled.diagnostics?.map((d) => view.state.doc.lineAt(src.charOf(d.start)).number) ?? []);

        for (const e of errors) {
          const startByte = check.byteAt(e.line, e.col);
          const endByte = check.byteAt(e.endLine, e.endCol);
          const from = src.charOf(alloy.to_source(startByte));
          const to = src.charOf(alloy.to_source(Math.max(endByte, startByte)));
          const line = view.state.doc.lineAt(Math.min(from, view.state.doc.length)).number;

          // A line the compiler already reports on has an unreliable
          // emit, and the checker's report there describes that emit.
          if (silenced.has(line)) continue;

          push(from, to, "error", alloy.fold(e.message), "checker");
        }
      }
    }

    diagnostics.sort((a, b) => a.from - b.from);
    view.dispatch(setDiagnostics(view.state, diagnostics));
    setProblems(list.sort((a, b) => a.line - b.line));

    const out = outViewRef.current;

    if (out) {
      const text = compiled.ship ?? (compiled.error ? `-- ${compiled.error.message}` : "");
      out.dispatch({ changes: { from: 0, to: out.state.doc.length, insert: text } });
    }
  };

  const schedule = (view: EditorView) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => analyze(view), 250);
  };

  const completions = async (ctx: CompletionContext): Promise<CompletionResult | null> => {
    try {
      return completionsInner(ctx);
    } catch (e) {
      console.error("completion", e);

      return null;
    }
  };

  const completionsInner = (ctx: CompletionContext): CompletionResult | null => {
    const alloy = alloyRef.current;
    const src = sourcePosRef.current;

    if (!alloy || !src || compiledRef.current === null) return null;

    const text = ctx.state.doc.toString();

    if (text !== src.text) {
      // The editor moved since the last compile: compile now, so the
      // list reads the text as it is; the diagnostics follow on their
      // own timer.
      compile(text);
    }

    const positions = sourcePosRef.current!;
    const before = ctx.state.sliceDoc(Math.max(0, ctx.pos - 1), ctx.pos);
    const word = ctx.matchBefore(/[\w@$-]*/);
    const opensList = [".", ":", "@", "$", "("].includes(before);

    if (!ctx.explicit && !opensList && (!word || word.text.length === 0)) return null;

    const bytePos = positions.byteOf(ctx.pos);
    const answer = JSON.parse(alloy.complete(bytePos)) as {
      items: { label: string; kind: string; doc?: string | null; from: number }[];
      luau: boolean;
    };
    const options: Completion[] = [];
    let from = word ? word.from : ctx.pos;

    for (const item of answer.items) {
      from = Math.min(from, positions.charOf(item.from));
      options.push({
        label: item.label,
        type: item.kind,
        info: item.doc ? () => docNode(item.doc!) : undefined,
        boost: item.kind === "keyword" ? -1 : 0,
      });
    }

    if (answer.luau && luauRef.current && checkPosRef.current) {
      let check = checkPosRef.current;
      let checkByte = alloy.to_check(bytePos);

      // A dangling `.` or `:` is not in the emit yet: the artifact gets
      // one after the receiver, and the analyzer lists the members.
      if (checkByte < 0 && (before === "." || before === ":")) {
        // The byte before the punctuation: the receiver's last one.
        const receiver = alloy.to_check(bytePos - 2);

        if (receiver >= 0) {
          const at = check.charOf(receiver + 1);
          const patched = check.text.slice(0, at) + before + check.text.slice(at);
          luauRef.current.ccall("alloy_set_module", null, ["string", "string"], ["main", patched]);
          check = new Positions(patched);
          checkByte = receiver + 2;
        }
      }

      // A byte the emit dropped: the nearest kept one, forward on the
      // line first, as the language server maps it.
      for (let k = 1; checkByte < 0 && k <= 8; k++) {
        const ahead = alloy.to_check(bytePos + k);
        const behind = alloy.to_check(bytePos - k);
        checkByte = ahead >= 0 ? ahead : behind;
      }

      if (checkByte >= 0) {
        const { line, col } = check.lineCol(checkByte);
        const result = JSON.parse(luauRef.current.ccall("alloy_autocomplete", "string", ["number", "number"], [line, col]) as string) as {
          context: string;
          items: LuauItem[];
        };
        const seen = new Set(options.map((o) => o.label));

        for (const item of result.items) {
          if (seen.has(item.label) || item.label.startsWith("__") || item.label === "function (anonymous autofilled)") continue;

          const type = item.type ? alloy.fold(item.type) : undefined;
          const doc = alloy.doc_of(item.label);
          options.push({
            label: item.label,
            type: item.kind === "property" && type?.startsWith("(") ? "method" : item.kind,
            detail: type ? shorten(type) : undefined,
            info: doc ? () => docNode(doc) : type ? () => docNode("```luau\n" + type + "\n```") : undefined,
            apply: item.insert ?? undefined,
          });
        }
      }
    }

    if (options.length === 0) return null;

    return {
      from,
      options,
      validFor: /^[\w@$-]*$/,
    };
  };

  const hover = hoverTooltip(
    (view, pos): Tooltip | null => {
      const alloy = alloyRef.current;
      const src = sourcePosRef.current;

      if (!alloy || !src || src.text !== view.state.doc.toString()) return null;

      const bytePos = src.byteOf(pos);
      const own = JSON.parse(alloy.hover(bytePos)) as { from: number; to: number; markdown: string } | null;

      if (own) {
        return tooltipAt(src.charOf(own.from), src.charOf(own.to), own.markdown);
      }

      const luau = luauRef.current;
      const check = checkPosRef.current;

      if (!luau || !check) return null;

      const checkByte = alloy.to_check(bytePos);

      if (checkByte < 0 || alloy.generated_at(checkByte)) return null;

      const { line, col } = check.lineCol(checkByte);
      const answer = JSON.parse(luau.ccall("alloy_hover", "string", ["number", "number"], [line, col]) as string) as {
        name: string;
        kind: string;
        type: string;
        error?: string;
      } | null;

      if (!answer || !answer.type) return null;

      const wordRange = wordAt(view.state.doc.toString(), pos);
      const type = alloy.fold(answer.type);
      const head = answer.name ? `${answer.kind === "local" ? "local " : ""}${answer.name}: ${type}` : type;
      const doc = answer.name ? alloy.doc_of(answer.name) : "";
      const markdown = "```luau\n" + head + "\n```" + (doc ? "\n\n" + doc.replace(/^```[\s\S]*?```\n?/, "") : "");

      return tooltipAt(wordRange.from, wordRange.to, markdown);
    },
    { hideOnChange: true, hoverTime: 250 },
  );

  // The editors.
  useEffect(() => {
    if (!hostRef.current || !outRef.current) return;

    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      lintGutter(),
      autocompletion({
        override: [completions],
        icons: false,
        activateOnTyping: true,
        maxRenderedOptions: 60,
        addToOptions: [
          {
            render(completion) {
              const el = document.createElement("span");
              el.className = `cm-kind cm-kind-${completion.type ?? "text"}`;
              el.textContent = KIND_GLYPH[completion.type ?? "text"] ?? "·";

              return el;
            },
            position: 20,
          },
        ],
      }),
      hover,
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap, ...completionKeymap, indentWithTab]),
      alloyLanguage,
      syntaxHighlighting(alloyHighlight),
      alloyTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) schedule(update.view);
      }),
      EditorState.tabSize.of(4),
    ];
    const view = new EditorView({
      state: EditorState.create({ doc: initial, extensions }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    // A hook for a script that drives the page: the completion source
    // and the engines, by hand.
    (window as unknown as { __play?: unknown }).__play = {
      complete: (pos: number) => completionsInner(new CompletionContext(view.state, pos, true)),
      doc: () => view.state.doc.toString(),
      alloy: () => alloyRef.current,
      luau: () => luauRef.current,
      compiled: () => compiledRef.current,
    };

    const out = new EditorView({
      state: EditorState.create({
        doc: "",
        extensions: [
          lineNumbers(),
          highlightSpecialChars(),
          drawSelection(),
          alloyLanguage,
          syntaxHighlighting(alloyHighlight),
          alloyTheme,
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
        ],
      }),
      parent: outRef.current,
    });
    outViewRef.current = out;

    let cancelled = false;

    (async () => {
      try {
        const alloyUrl = "/play/alloy_web.js";
        const mod = (await import(/* webpackIgnore: true */ alloyUrl)) as AlloyModule;
        await mod.default({ module_or_path: "/play/alloy_web_bg.wasm" });

        if (cancelled) return;

        alloyRef.current = mod;
        setStatus((s) => ({ ...s, compiler: "ready" }));
        analyze(view);
      } catch (e) {
        setStatus((s) => ({ ...s, compiler: "failed" }));
        console.error(e);
      }

      try {
        const luauUrl = "/play/luau.js";
        const [{ default: createLuau }, defs] = await Promise.all([
          import(/* webpackIgnore: true */ luauUrl) as Promise<{ default: (opts: object) => Promise<LuauModule> }>,
          fetch("/play/globalTypes.d.luau").then((r) => r.text()),
        ]);
        const luau = await createLuau({ locateFile: (file: string) => `/play/${file}` });

        if (cancelled) return;

        const problem = luau.ccall("alloy_init", "string", ["string"], [defs]) as string;

        if (problem) {
          console.warn(problem);
        }

        luau.ccall("alloy_set_module", null, ["string", "string"], ["alloy", alloyRef.current?.runtime() ?? ""]);
        luauRef.current = luau;
        setStatus((s) => ({ ...s, analyzer: problem ? "partial" : "ready" }));
        analyze(view);
      } catch (e) {
        setStatus((s) => ({ ...s, analyzer: "failed" }));
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
      view.destroy();
      out.destroy();
      window.clearTimeout(timer.current);
    };
    // The editor mounts once; the callbacks read refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = () => {
    const luau = luauRef.current;
    const alloy = alloyRef.current;
    const compiled = compiledRef.current;

    if (!luau || !alloy || !compiled?.ship) {
      setOutput("The analyzer is still loading.");
      setTab("output");

      return;
    }

    const text = luau.ccall("alloy_run", "string", ["string", "string"], [alloy.runtime(), compiled.ship]) as string;
    setOutput(text || "(no output)");
    setTab("output");
  };

  const share = async () => {
    const view = viewRef.current;

    if (!view) return;

    const hash = encodeHash(view.state.doc.toString());
    window.history.replaceState(null, "", hash);

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // The URL is in the bar either way.
    }
  };

  const load = (id: string) => {
    const view = viewRef.current;
    const example = EXAMPLES.find((e) => e.id === id);

    if (!view || !example) return;

    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: example.src + "\n" } });
    window.history.replaceState(null, "", window.location.pathname);
  };

  return (
    <div className="play">
      <div className="play-bar">
        <label className="play-select glass">
          <span className="text-muted">Example</span>
          <select defaultValue="" onChange={(e) => load(e.target.value)} aria-label="Load an example">
            <option value="" disabled>
              Pick one
            </option>
            {EXAMPLES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <StatusPill label="compiler" state={status.compiler} />
          <StatusPill label="analyzer" state={status.analyzer} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="glass glass-live play-btn" onClick={share}>
            {copied ? "Link copied" : "Share"}
          </button>
          <button type="button" className="btn-primary play-btn play-btn-primary" onClick={run}>
            Run
          </button>
        </div>
      </div>
      <div className="play-panes">
        <section className="play-pane">
          <header className="play-pane-head">
            <span className="font-mono text-[12px] text-muted">play.aly</span>
          </header>
          <div ref={hostRef} className="play-editor" />
          <div className="play-problems">
            {problems.length === 0 ? (
              <span className="text-muted">No problems.</span>
            ) : (
              problems.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className={`play-problem play-problem-${p.severity}`}
                  onClick={() => {
                    const view = viewRef.current;

                    if (!view) return;

                    const line = view.state.doc.line(p.line);
                    view.dispatch({ selection: { anchor: line.from }, scrollIntoView: true });
                    view.focus();
                  }}
                >
                  <span className="play-problem-line">{p.line}</span>
                  <span>{p.message}</span>
                </button>
              ))
            )}
          </div>
        </section>
        <section className="play-pane">
          <header className="play-pane-head">
            <button type="button" className={`play-tab ${tab === "luau" ? "on" : ""}`} onClick={() => setTab("luau")}>
              Emitted Luau
            </button>
            <button type="button" className={`play-tab ${tab === "output" ? "on" : ""}`} onClick={() => setTab("output")}>
              Output
            </button>
          </header>
          <div ref={outRef} className="play-editor" hidden={tab !== "luau"} />
          <pre className="play-output" hidden={tab !== "output"}>
            {output || "Press Run to execute the emitted Luau. `print` lands here; the Roblox API is not in the browser."}
          </pre>
        </section>
      </div>
    </div>
  );
}

function StatusPill({ label, state }: { label: string; state: string }) {
  return (
    <span className={`glass play-status play-status-${state}`}>
      <span className="play-status-dot" />
      <span className="text-muted">{label}</span>
      <span>{state}</span>
    </span>
  );
}

function docNode(markdown: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "cm-doc";
  el.innerHTML = mdToHtml(markdown);

  return el;
}

function tooltipAt(from: number, to: number, markdown: string): Tooltip {
  return {
    pos: from,
    end: to,
    above: true,
    create: () => ({ dom: docNode(markdown) }),
  };
}

function wordAt(text: string, pos: number): { from: number; to: number } {
  let from = pos;
  let to = pos;

  while (from > 0 && /[\w]/.test(text[from - 1])) from -= 1;
  while (to < text.length && /[\w]/.test(text[to])) to += 1;

  return { from, to };
}

function shorten(type: string): string {
  const one = type.replace(/\s+/g, " ");

  return one.length > 48 ? one.slice(0, 45) + "…" : one;
}
