"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { SearchDoc } from "@/lib/content";

export type TocItem = { id: string; label: string; sub?: boolean; number?: string };
export type TocChapter = { title: string; items: TocItem[] };

/** The words around the first hit of `q` in `text`. */
function snippet(text: string, q: string): string {
  const lower = text.toLowerCase();
  const at = lower.indexOf(q);

  if (at < 0) {
    return text.slice(0, 90);
  }

  const start = Math.max(0, at - 40);
  const end = Math.min(text.length, at + q.length + 60);

  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

/** The snippet with the hit marked. */
function marked(text: string, q: string): ReactNode {
  const at = text.toLowerCase().indexOf(q);

  if (at < 0) {
    return text;
  }

  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

// The book frame: a sticky table of contents on the left, filtered by
// the search box, with the section in view marked; the chapters on the
// right. Every section is an element with the id the TOC names.

export default function BookShell({
  chapters,
  index = [],
  children,
}: {
  chapters: TocChapter[];
  index?: SearchDoc[];
  children: ReactNode;
}) {
  const [active, setActive] = useState<string>("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // A click pins the highlight to its target until the scroll settles,
  // so the picker never shows the section above while the page moves.
  const pinned = useRef<string | null>(null);
  const pinTimer = useRef<number | undefined>(undefined);

  const ids = useMemo(() => chapters.flatMap((c) => c.items.map((i) => i.id)), [chapters]);

  useEffect(() => {
    const targets = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => e !== null);

    if (targets.length === 0) return;

    // The topmost section whose top has passed the bar is the one read;
    // at the end of the page, the last one.
    const pick = () => {
      if (pinned.current !== null) {
        setActive(pinned.current);

        return;
      }

      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      if (atEnd) {
        setActive(targets[targets.length - 1].id);

        return;
      }

      let best = targets[0].id;
      const bar = Math.max(120, window.innerHeight * 0.2);

      for (const el of targets) {
        if (el.getBoundingClientRect().top <= bar) best = el.id;
        else break;
      }

      setActive(best);
    };

    const settle = () => {
      pinned.current = null;
      pick();
    };

    const onScroll = () => {
      if (pinned.current !== null) {
        // No `scrollend` in every browser: quiet for a beat means settled.
        window.clearTimeout(pinTimer.current);
        pinTimer.current = window.setTimeout(settle, 160);

        return;
      }

      pick();
    };

    if (window.location.hash) {
      pinned.current = window.location.hash.slice(1);
      pinTimer.current = window.setTimeout(settle, 900);
    }

    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", settle);
    window.addEventListener("resize", pick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", settle);
      window.removeEventListener("resize", pick);
      window.clearTimeout(pinTimer.current);
    };
  }, [ids]);

  const jump = (id: string) => {
    pinned.current = id;
    setActive(id);
    setOpen(false);
    window.clearTimeout(pinTimer.current);
    pinTimer.current = window.setTimeout(() => {
      pinned.current = null;
    }, 1200);
  };

  const q = query.trim().toLowerCase();
  const shown = chapters;

  // A query searches the text of every section and entry, not the
  // titles alone: a title hit ranks first, then a hit in the body,
  // each with the words around it.
  const hits = useMemo(() => {
    if (!q) return [];

    const scored = index
      .map((d) => {
        const inLabel = d.label.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
        const inText = d.text.toLowerCase().includes(q);

        return { d, score: inLabel ? 2 : inText ? 1 : 0 };
      })
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 40);
  }, [index, q]);

  const toc = (
    <nav className="toc" aria-label="Contents">
      <div className="search glass mb-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the book"
          aria-label="Search the book"
        />
      </div>
      {q ? (
        <div className="results">
          {hits.map(({ d, score }) => (
            <a key={d.id} href={`#${d.id}`} className="result" onClick={() => jump(d.id)}>
              <span className="result-head">
                <small>{d.number}</small>
                <span>{d.label}</span>
              </span>
              {score < 2 || d.text ? <span className="result-snippet">{marked(snippet(d.text, q), q)}</span> : null}
            </a>
          ))}
          {hits.length === 0 ? <p className="px-2 text-[13px] text-muted">Nothing matches.</p> : null}
        </div>
      ) : (
        shown.map((c) => (
          <div key={c.title}>
            <div className="chapter">{c.title}</div>
            {c.items.map((i) => (
              <div key={i.id} className={i.sub ? "sub" : ""}>
                <a href={`#${i.id}`} className={active === i.id ? "on" : ""} onClick={() => jump(i.id)}>
                  {i.number ? <small>{i.number}</small> : null}
                  {i.label}
                </a>
              </div>
            ))}
          </div>
        ))
      )}
    </nav>
  );

  return (
    <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-0 px-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-14 max-h-[calc(100vh-56px)] overflow-y-auto border-r border-line py-6 pr-4 pl-1">{toc}</div>
      </aside>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="glass mt-4 rounded-md px-3 py-1.5 font-mono text-[12.5px] text-ink-2"
          aria-expanded={open}
        >
          {open ? "Hide contents" : "Contents"}
        </button>
        {open ? <div className="mt-3 rounded-lg border border-line bg-ground-2 p-3">{toc}</div> : null}
      </div>
      <main className="min-w-0 py-8 lg:pl-10">{children}</main>
    </div>
  );
}
