// Markdown as the tooltips draw it: fences, inline code, bold, tables,
// and paragraphs, nothing the doc table does not use.
import { modeOf, paint } from "@/lib/paint";

function escape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(text: string): string {
  return escape(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function mdToHtml(markdown: string): string {
  const out: string[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const body: string[] = [];
      i += 1;

      while (i < lines.length && !lines[i].startsWith("```")) {
        body.push(lines[i]);
        i += 1;
      }

      i += 1;
      // A fence paints like a code pane, so a hover reads like the book.
      out.push(`<pre class="md-code code" data-lang="${escape(lang)}"><code>${paint(body.join("\n"), modeOf(lang))}</code></pre>`);

      continue;
    }

    if (line.startsWith("|")) {
      const rows: string[] = [];

      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i].slice(1, lines[i].endsWith("|") ? -1 : undefined).split("|");

        if (!cells.every((c) => /^\s*-*\s*$/.test(c))) {
          rows.push(`<tr>${cells.map((c) => `<td>${inline(c.trim())}</td>`).join("")}</tr>`);
        }

        i += 1;
      }

      out.push(`<table class="md-table">${rows.join("")}</table>`);

      continue;
    }

    if (line.trim() === "") {
      i += 1;

      continue;
    }

    const para: string[] = [];

    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("```") && !lines[i].startsWith("|")) {
      para.push(lines[i]);
      i += 1;
    }

    out.push(`<p>${inline(para.join(" "))}</p>`);
  }

  return out.join("");
}
