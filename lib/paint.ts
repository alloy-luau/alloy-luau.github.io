// A small highlighter for the code blocks: comments, strings, numbers,
// sigils, keywords. The classes match the deck and `globals.css`.

const KW = [
  "local", "const", "function", "end", "if", "then", "else", "elseif", "for",
  "in", "while", "do", "repeat", "until", "return", "break", "continue",
  "and", "or", "not", "nil", "true", "false", "struct", "enum", "trait",
  "impl", "interface", "extends", "as", "match", "case", "default", "with",
  "async", "await", "try", "new", "delete", "import", "export", "from",
  "type", "remote", "macro", "attribute", "on", "where", "is", "read",
  "write", "client", "server", "self", "declare",
];

export type Mode = "alloy" | "luau" | "alx" | "toml" | "json" | "sh" | "text";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function paintLine(line: string, mode: Mode): string {
  if (mode === "sh") {
    // The command, its subcommand, its flags, its paths, and a comment.
    const at = line.indexOf("#");
    const cmd = at >= 0 ? line.slice(0, at) : line;
    const comment = at >= 0 ? `<span class="c">${esc(line.slice(at))}</span>` : "";
    let n = 0;
    const body = cmd.replace(/\S+/g, (w) => {
      n += 1;

      if (n === 1) return `<span class="f">${esc(w)}</span>`;
      if (w.startsWith("-")) return `<span class="o">${esc(w)}</span>`;
      if (/[./]/.test(w) || w.includes("=")) return `<span class="s">${esc(w)}</span>`;
      if (n === 2) return `<span class="k">${esc(w)}</span>`;

      return esc(w);
    });

    return body + comment;
  }

  let html = "";
  let j = 0;

  while (j < line.length) {
    const rest = line.slice(j);
    let m: RegExpMatchArray | null;

    if (mode === "toml" && (m = rest.match(/^#.*$/))) {
      html += `<span class="c">${esc(m[0])}</span>`;
      j += m[0].length;
      continue;
    }

    if (mode !== "toml" && mode !== "json" && (m = rest.match(/^--.*$/))) {
      html += `<span class="c">${esc(m[0])}</span>`;
      j += m[0].length;
      continue;
    }

    if ((m = rest.match(/^(`[^`]*`|"[^"]*"|'[^']*')/))) {
      html += `<span class="s">${esc(m[0])}</span>`;
      j += m[0].length;
      continue;
    }

    if ((m = rest.match(/^\d[\d._]*/))) {
      html += `<span class="n">${m[0]}</span>`;
      j += m[0].length;
      continue;
    }

    if ((m = rest.match(/^[$@][A-Za-z_][A-Za-z0-9_]*/))) {
      html += `<span class="g">${m[0]}</span>`;
      j += m[0].length;
      continue;
    }

    if (mode === "alx" && (m = rest.match(/^<\/?[A-Z][A-Za-z0-9.]*|^\/?>/))) {
      html += `<span class="g">${esc(m[0])}</span>`;
      j += m[0].length;
      continue;
    }

    if (mode === "toml" && (m = rest.match(/^\[[^\]]*\]/))) {
      html += `<span class="k">${esc(m[0])}</span>`;
      j += m[0].length;
      continue;
    }

    if ((m = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/))) {
      const w = m[0];
      const prev = line[j - 1];
      const isKw =
        (mode === "alloy" || mode === "luau" || mode === "alx") &&
        KW.includes(w) &&
        prev !== "." &&
        prev !== ":";
      const called = /^\s*\(/.test(rest.slice(w.length)) && !isKw;
      const typed = prev === ":" && /^[A-Z]/.test(w);
      html += isKw
        ? `<span class="k">${w}</span>`
        : called
          ? `<span class="f">${w}</span>`
          : typed
            ? `<span class="t">${w}</span>`
            : w;
      j += w.length;
      continue;
    }

    // Alloy's operators take a warm color; plain punctuation goes dim.
    if ((m = rest.match(/^(\?\?=|\?\?|\?\.|\?:|\?\[|\?\(|->|=>|::|\.\.\.|\.\.|==|~=|<=|>=|[+\-*/%^#=<>!?|&])/))) {
      html += `<span class="o">${esc(m[0])}</span>`;
      j += m[0].length;
      continue;
    }

    if ((m = rest.match(/^[(){}\[\],;:.]/))) {
      html += `<span class="p">${esc(m[0])}</span>`;
      j += m[0].length;
      continue;
    }

    html += esc(line[j]);
    j += 1;
  }

  return html;
}

/** Painted HTML for a code block, one line per source line. */
export function paint(code: string, mode: Mode, numbers = false): string {
  return code
    .split("\n")
    .map((line, i) =>
      numbers
        ? `<span class="ln">${i + 1}</span>${paintLine(line, mode)}`
        : paintLine(line, mode),
    )
    .join("\n");
}

/** The mode a fence's language tag names. */
export function modeOf(tag: string): Mode {
  switch (tag.trim()) {
    case "alloy":
    case "aly":
      return "alloy";
    case "luau":
    case "lua":
      return "luau";
    case "alx":
      return "alx";
    case "toml":
      return "toml";
    case "json":
      return "json";
    case "sh":
    case "bash":
      return "sh";
    default:
      return "text";
  }
}
