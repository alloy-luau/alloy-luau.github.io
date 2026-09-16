// The TextMate painter: the site colours Alloy with the grammars the
// VS Code extension ships, so a code block reads like the editor.
// `scripts/grammars.mjs` refreshes the copies in `lib/grammars`.
// This module reads files and loads wasm. It runs at build time only.
import fs from "node:fs";
import path from "node:path";

import * as onig from "vscode-oniguruma";
import * as vsctm from "vscode-textmate";

import { type Mode, paint } from "@/lib/paint";

const GRAMMARS: Record<string, string> = {
  "source.aly": "aly",
  "source.alx": "alx",
  "source.d.aly": "daly",
};

// The class a token takes, by the most specific scope that matches.
// A longer prefix comes first, so `keyword.operator` wins over
// `keyword` and `punctuation` stays the fallback.
const CLASSES: [string, string][] = [
  ["comment", "c"],
  ["string", "s"],
  ["constant.numeric", "n"],
  ["constant.character", "n"],
  ["constant.language", "k"],
  ["keyword.operator", "o"],
  ["keyword", "k"],
  ["storage", "k"],
  ["variable.language", "k"],
  ["entity.name.function", "f"],
  ["support.function", "f"],
  ["punctuation.definition.macro", "f"],
  ["entity.name.type", "t"],
  ["entity.name.namespace", "t"],
  ["support.type", "t"],
  ["support.class", "t"],
  ["entity.name.tag", "g"],
  ["punctuation.definition.tag", "g"],
  ["punctuation.section.embedded", "g"],
  ["entity.other.attribute-name", "a"],
  ["punctuation.definition.attribute", "a"],
  ["punctuation", "p"],
];

/** The class for one token: the last scope that the map knows. */
function classOf(scopes: string[]): string {
  for (let i = scopes.length - 1; i >= 0; i -= 1) {
    for (const [prefix, cls] of CLASSES) {
      if (scopes[i] === prefix || scopes[i].startsWith(`${prefix}.`)) return cls;
    }
  }

  return "";
}

let registry: vsctm.Registry | null = null;

function once(): vsctm.Registry {
  if (registry) return registry;

  const root = process.cwd();
  const wasm = fs.readFileSync(path.join(root, "node_modules/vscode-oniguruma/release/onig.wasm"));
  const onigLib = onig.loadWASM(wasm.buffer as ArrayBuffer).then(() => ({
    createOnigScanner: (patterns: string[]) => new onig.OnigScanner(patterns),
    createOnigString: (s: string) => new onig.OnigString(s),
  }));

  registry = new vsctm.Registry({
    onigLib,
    loadGrammar: async (scope) => {
      const name = GRAMMARS[scope];

      if (!name) return null;

      const text = fs.readFileSync(path.join(root, "lib/grammars", `${name}.tmLanguage.json`), "utf8");

      return vsctm.parseRawGrammar(text, `${name}.tmLanguage.json`);
    },
  });

  return registry;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Painted HTML for a block of Alloy, ALX, or Luau. Luau paints with
 *  the Alloy grammar, which is a superset of it. */
export async function paintTm(code: string, scope: string, numbers = false): Promise<string> {
  const grammar = await once().loadGrammar(scope);

  if (!grammar) return esc(code);

  let stack = vsctm.INITIAL;

  return code
    .split("\n")
    .map((line, i) => {
      const result = grammar.tokenizeLine(line, stack);
      stack = result.ruleStack;

      // Runs of one class share a span: a quoted string arrives as
      // three tokens and reads as one word.
      const parts: string[] = [];
      let cls = "";
      let buf = "";
      const flush = () => {
        if (buf) parts.push(cls ? `<span class="${cls}">${buf}</span>` : buf);

        buf = "";
      };

      for (const t of result.tokens) {
        const next = classOf(t.scopes);

        if (next !== cls) {
          flush();
          cls = next;
        }

        buf += esc(line.slice(t.startIndex, t.endIndex));
      }

      flush();

      const body = parts.join("");

      return numbers ? `<span class="ln">${i + 1}</span>${body}` : body;
    })
    .join("\n");
}

const SCOPES: Partial<Record<Mode, string>> = {
  alloy: "source.aly",
  alx: "source.alx",
  luau: "source.aly",
};

/** Painted HTML for one code block. The grammar paints Alloy, ALX, and
 *  Luau. The small painter keeps TOML, JSON, shell, and plain text. */
export async function paintBlock(code: string, mode: Mode, numbers = false): Promise<string> {
  const scope = SCOPES[mode];

  return scope ? paintTm(code, scope, numbers) : paint(code, mode, numbers);
}
