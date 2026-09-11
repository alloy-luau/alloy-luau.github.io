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
  | { kind: "head"; level: number; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; text: string }
  | { kind: "rows"; rows: string[][] }
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

    const head = line.match(/^(#{1,6})\s+(.+?)\s*$/);

    if (head) {
      out.push({ kind: "head", level: head[1].length, text: head[2] });
      i += 1;
      continue;
    }

    // A bullet list, with a wrapped item joined back onto its line.
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];

      while (i < lines.length && (/^[-*]\s+/.test(lines[i]) || (items.length > 0 && /^\s+\S/.test(lines[i])))) {
        if (/^[-*]\s+/.test(lines[i])) items.push(lines[i].replace(/^[-*]\s+/, ""));
        else items[items.length - 1] += ` ${lines[i].trim()}`;

        i += 1;
      }

      out.push({ kind: "list", items });
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

    // A pipe table, as lib/md.ts reads one: the `|---|` rule is a rule,
    // not a row.
    if (line.startsWith("|")) {
      const rows: string[][] = [];

      while (i < lines.length && lines[i].startsWith("|")) {
        const body = lines[i].endsWith("|") ? lines[i].slice(1, -1) : lines[i].slice(1);
        const cells = body.split("|");

        if (!cells.every((c) => /^\s*-*\s*$/.test(c))) rows.push(cells.map((c) => c.trim()));

        i += 1;
      }

      out.push({ kind: "rows", rows });
      continue;
    }

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const para: string[] = [];

    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("  ") &&
      !lines[i].startsWith("|") &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }

    out.push({ kind: "para", text: para.join(" ") });
  }

  return out;
}

/** Markdown as this site draws it: fences, headings, bullet lists,
 *  aligned tables, and prose. */
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

        if (b.kind === "head") {
          // The page owns the h1, so a `#` heading in the source opens
          // at h2.
          const Tag = `h${Math.min(b.level + 1, 6)}` as "h2" | "h3" | "h4" | "h5" | "h6";

          return (
            <Tag className="md-head" key={i}>
              {inline(b.text).map((n, j) => (
                <Fragment key={j}>{n}</Fragment>
              ))}
            </Tag>
          );
        }

        if (b.kind === "list") {
          return (
            <ul className="pointlist" key={i}>
              {b.items.map((item, r) => (
                <li key={r}>
                  {inline(item).map((n, j) => (
                    <Fragment key={j}>{n}</Fragment>
                  ))}
                </li>
              ))}
            </ul>
          );
        }

        if (b.kind === "table") {
          return (
            <div className="table" key={i}>
              {b.text}
            </div>
          );
        }

        if (b.kind === "rows") {
          return (
            <div className="md-table-wrap" key={i}>
              <table className="md-table">
                <tbody>
                  {b.rows.map((cells, r) => (
                    <tr key={r}>
                      {cells.map((c, k) => (
                        <td key={k}>
                          {inline(c).map((n, j) => (
                            <Fragment key={j}>{n}</Fragment>
                          ))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
