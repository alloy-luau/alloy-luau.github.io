import { Fragment, type ReactNode } from "react";

import CodePane from "@/components/CodePane";
import { modeOf } from "@/lib/paint";

/** Inline `code` and **bold** inside one line. */
export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let k = 0;

  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;

    if (i > last) out.push(text.slice(last, i));

    const t = m[0];

    if (t.startsWith("`")) {
      out.push(<code key={k++}>{t.slice(1, -1)}</code>);
    } else {
      out.push(<b key={k++}>{t.slice(2, -2)}</b>);
    }

    last = i + t.length;
  }

  if (last < text.length) out.push(text.slice(last));

  return out;
}

type Block =
  | { kind: "fence"; lang: string; code: string }
  | { kind: "table"; text: string }
  | { kind: "para"; text: string };

function blocks(markdown: string): Block[] {
  const out: Block[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3);
      const code: string[] = [];
      i += 1;

      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }

      i += 1;
      out.push({ kind: "fence", lang, code: code.join("\n") });
      continue;
    }

    if (line.startsWith("  ")) {
      const rows: string[] = [];

      while (i < lines.length && lines[i].startsWith("  ")) {
        rows.push(lines[i].slice(2));
        i += 1;
      }

      out.push({ kind: "table", text: rows.join("\n") });
      continue;
    }

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const para: string[] = [];

    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("```") && !lines[i].startsWith("  ")) {
      para.push(lines[i]);
      i += 1;
    }

    out.push({ kind: "para", text: para.join(" ") });
  }

  return out;
}

/** The compiler's Markdown, rendered: fences, aligned tables, prose. */
export default function Markdown({ text, emitSecond = false }: { text: string; emitSecond?: boolean }) {
  const parts = blocks(text);
  let fences = 0;

  return (
    <div className="prose">
      {parts.map((b, i) => {
        if (b.kind === "fence") {
          fences += 1;
          const isEmit = emitSecond && fences === 2;

          const mode = modeOf(b.lang || "text");
          // The one TOML file Alloy has is the project file; its fences
          // say so, with the file's icon.
          const label = mode === "toml" ? "alloy.toml" : undefined;

          return (
            <div className="fence" key={i}>
              <CodePane code={b.code} mode={mode} emit={isEmit} label={label} note={label ? "alloy.toml" : undefined} />
            </div>
          );
        }

        if (b.kind === "table") {
          return (
            <div className="table" key={i}>
              {b.text}
            </div>
          );
        }

        return (
          <p key={i}>
            {inline(b.text).map((n, j) => (
              <Fragment key={j}>{n}</Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
