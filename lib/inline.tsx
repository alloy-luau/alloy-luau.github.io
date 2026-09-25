// Inline markdown inside one line. The client index uses it too, so
// it lives apart from `components/Markdown.tsx` and its painter.
import type { ReactNode } from "react";

/** Inline `code` and **bold** inside one line. A span that holds a
 *  backtick opens with two, as in Markdown: `` `{v}` ``. */
export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(``.+?``|`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let k = 0;

  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;

    if (i > last) out.push(text.slice(last, i));

    const t = m[0];

    if (t.startsWith("``")) {
      out.push(<code key={k++}>{t.slice(2, -2).trim()}</code>);
    } else if (t.startsWith("`")) {
      out.push(<code key={k++}>{t.slice(1, -1)}</code>);
    } else {
      out.push(<b key={k++}>{t.slice(2, -2)}</b>);
    }

    last = i + t.length;
  }

  if (last < text.length) out.push(text.slice(last));

  return out;
}
