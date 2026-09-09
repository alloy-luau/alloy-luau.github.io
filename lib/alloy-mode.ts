// The editor's own reading of Alloy and Luau: a stream tokenizer for
// the highlighter, the colors of the site, and the editor theme.
import { HighlightStyle, StreamLanguage, type StreamParser } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

const KEYWORDS = new Set([
  "and", "break", "do", "else", "elseif", "end", "for", "function", "if", "in", "local", "not", "or",
  "repeat", "return", "then", "until", "while", "continue", "type", "export", "global", "import", "from", "as",
  "async", "await", "try", "struct", "enum", "trait", "impl", "interface", "extends", "match", "case",
  "default", "where", "with", "new", "delete", "const", "macro", "attribute", "remote", "declare",
  "extern", "class", "open", "is", "satisfies", "band", "bor", "bxor", "bnot", "shl", "shr", "read",
  "write", "private", "public", "on",
]);
const ATOMS = new Set(["true", "false", "nil"]);

type Block = { style: string; closer: string } | null;
type State = { block: Block; afterDot: boolean };

const parser: StreamParser<State> = {
  startState: () => ({ block: null, afterDot: false }),

  token(stream, state) {
    if (state.block) {
      const at = stream.string.indexOf(state.block.closer, stream.pos);

      if (at < 0) {
        stream.skipToEnd();

        return state.block.style;
      }

      stream.pos = at + state.block.closer.length;
      const style = state.block.style;
      state.block = null;

      return style;
    }

    if (stream.eatSpace()) {
      return null;
    }

    const afterDot = state.afterDot;
    state.afterDot = false;

    let m: RegExpMatchArray | null;

    if ((m = stream.match(/^--\[(=*)\[/) as RegExpMatchArray | null)) {
      state.block = { style: "comment", closer: `]${m[1]}]` };

      return "comment";
    }

    if (stream.match(/^--.*/)) {
      return "comment";
    }

    if ((m = stream.match(/^\[(=+)\[/) as RegExpMatchArray | null)) {
      state.block = { style: "string", closer: `]${m[1]}]` };

      return "string";
    }

    if (stream.match(/^"(?:[^"\\\n]|\\.)*"?/) || stream.match(/^'(?:[^'\\\n]|\\.)*'?/)) {
      return "string";
    }

    if (stream.match(/^`(?:[^`\\]|\\.)*`?/)) {
      return "string";
    }

    if (stream.match(/^0[xX][0-9a-fA-F_]+i?/) || stream.match(/^0[bB][01_]+i?/) || stream.match(/^\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?i?/)) {
      return "number";
    }

    if (stream.match(/^@[A-Za-z_][\w.]*/)) {
      return "annotation";
    }

    if (stream.match(/^\$[A-Za-z_][\w.]*/)) {
      return "macroName";
    }

    if ((m = stream.match(/^[A-Za-z_]\w*/) as RegExpMatchArray | null)) {
      const word = m[0];

      if (afterDot) {
        return "propertyName";
      }

      if (KEYWORDS.has(word)) {
        return "keyword";
      }

      if (ATOMS.has(word)) {
        return "atom";
      }

      if (/^[A-Z]/.test(word)) {
        return "typeName";
      }

      if (stream.match(/^\s*\(/, false)) {
        return "variableName";
      }

      return "variableName";
    }

    if (stream.match(/^(\.\.\.|\?\?=|\?\?|\?\.|\?:|\?\[|->|=>|==|~=|<=|>=|::|\.\.|<<|>>|[-+*/%^#<>=?!&|~])/)) {
      return "operator";
    }

    if (stream.match(/^[.:]/)) {
      state.afterDot = true;

      return "punctuation";
    }

    if (stream.match(/^[()[\]{},;]/)) {
      return "punctuation";
    }

    stream.next();

    return null;
  },

  languageData: {
    commentTokens: { line: "--", block: { open: "--[[", close: "]]" } },
    closeBrackets: { brackets: ["(", "[", "{", '"', "'", "`"] },
  },
};

export const alloyLanguage = StreamLanguage.define(parser);

/** The site's code colors, on the tags the tokenizer emits. */
export const alloyHighlight = HighlightStyle.define([
  { tag: t.keyword, color: "var(--code-kw)" },
  { tag: t.string, color: "var(--code-str)" },
  { tag: t.comment, color: "var(--code-cm)", fontStyle: "italic" },
  { tag: t.number, color: "var(--code-num)" },
  { tag: t.atom, color: "var(--code-num)" },
  { tag: t.typeName, color: "#8bd5ff" },
  { tag: t.annotation, color: "var(--warm)" },
  { tag: t.macroName, color: "#f2a7d6" },
  { tag: t.propertyName, color: "#d9d2f0" },
  { tag: t.variableName, color: "var(--code-ink)" },
  { tag: t.operator, color: "#b9a3f7" },
  { tag: t.punctuation, color: "#9a91bd" },
]);

/** The editor, in the site's dark palette. */
export const alloyTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--code-bg)",
      color: "var(--code-ink)",
      fontSize: "13.5px",
      height: "100%",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-mono)",
      lineHeight: "1.55",
    },
    ".cm-content": { padding: "12px 0", caretColor: "var(--accent-ink)" },
    ".cm-line": { padding: "0 14px" },
    ".cm-gutters": {
      backgroundColor: "var(--code-bg)",
      color: "var(--muted)",
      border: "none",
      paddingLeft: "6px",
    },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--ink-2)" },
    ".cm-activeLine": { backgroundColor: "rgba(155, 126, 240, 0.06)" },
    "&.cm-focused .cm-cursor": { borderLeftColor: "var(--accent-ink)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(155, 126, 240, 0.28) !important",
    },
    ".cm-matchingBracket": { backgroundColor: "rgba(155, 126, 240, 0.25)", outline: "none" },
    ".cm-selectionMatch": { backgroundColor: "rgba(155, 126, 240, 0.16)" },
    ".cm-lintRange-error": { backgroundImage: "none", borderBottom: "1.5px wavy #ff7b8a", textDecoration: "none" },
    ".cm-lintRange-warning": { backgroundImage: "none", borderBottom: "1.5px wavy var(--warm)" },
    ".cm-lint-marker": { width: "8px", height: "8px", borderRadius: "999px", marginTop: "6px" },
    ".cm-lint-marker-error": { background: "#ff7b8a", content: "none" },
    ".cm-lint-marker-warning": { background: "var(--warm)" },
  },
  { dark: true },
);
