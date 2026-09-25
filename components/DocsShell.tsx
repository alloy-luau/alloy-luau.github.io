"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { SearchField } from "@/components/FilterList";
import type { SearchDoc } from "@/lib/content";
import type { NavGroup } from "@/lib/docs";

/** The words around the first hit of `q` in `text`. */
function snippet(text: string, q: string): string {
  const at = text.toLowerCase().indexOf(q);

  if (at < 0) return text.slice(0, 90);

  const start = Math.max(0, at - 40);
  const end = Math.min(text.length, at + q.length + 60);

  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

/** The snippet with the hit marked. */
function marked(text: string, q: string): ReactNode {
  const at = text.toLowerCase().indexOf(q);

  if (at < 0) return text;

  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

/** The sidebar: a search box over every page, then the groups, each one
 *  a disclosure the reader can fold. */
function Sidebar({ nav, here }: { nav: NavGroup[]; here: string }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchDoc[] | null>(null);
  const q = query.trim().toLowerCase();

  // The index is a file of its own, fetched on the first focus, so no
  // page carries the text of every other page.
  const load = () => {
    if (index) return;

    fetch("/docs/search.json")
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex([]));
  };

  // A title hit ranks first, then a hit in the body.
  const hits = useMemo(() => {
    if (!q || !index) return [];

    return index
      .map((d) => ({ d, score: d.label.toLowerCase().includes(q) ? 2 : d.text.toLowerCase().includes(q) ? 1 : 0 }))
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);
  }, [index, q]);

  const link = (path: string, title: string, className = "") => (
    <Link
      href={path}
      className={`${className} ${here === path ? "on" : ""}`}
      aria-current={here === path ? "page" : undefined}
    >
      {title}
    </Link>
  );

  return (
    <nav className="toc" aria-label="Docs">
      <SearchField value={query} onChange={setQuery} onFocus={load} label="Search the docs" className="mb-3" />
      {q ? (
        <div className="results">
          {hits.map(({ d }) => (
            <Link key={d.href} href={d.href} className="result">
              <span className="result-head">
                <span>{d.label}</span>
                <small>{d.section}</small>
              </span>
              {d.text ? <span className="result-snippet">{marked(snippet(d.text, q), q)}</span> : null}
            </Link>
          ))}
          {index === null ? <p className="px-2 text-[13px] text-muted">Loading…</p> : null}
          {index !== null && hits.length === 0 ? <p className="px-2 text-[13px] text-muted">Nothing matches.</p> : null}
        </div>
      ) : (
        <>
          {link("/docs/", "Overview")}
          {nav.map((g) => (
            <details key={g.path} open>
              <summary className="chapter">{g.title}</summary>
              {g.items.map((i) => (
                <div key={i.path} className={i.sub ? "sub" : ""}>
                  {link(i.path, i.title, i.children && here.startsWith(i.path) && here !== i.path ? "within" : "")}
                  {i.children && here.startsWith(i.path) ? (
                    <div className="kids">{i.children.map((c) => <div key={c.path}>{link(c.path, c.title)}</div>)}</div>
                  ) : null}
                </div>
              ))}
            </details>
          ))}
        </>
      )}
    </nav>
  );
}

/** The headings of the page in view, with the one being read marked. */
function OnThisPage({ here }: { here: string }) {
  const [heads, setHeads] = useState<{ id: string; text: string; sub: boolean }[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-doc-body] :is(h2, h3)[id]")];

    setHeads(els.map((e) => ({ id: e.id, text: e.dataset.toc ?? e.textContent ?? "", sub: e.tagName === "H3" })));

    // The last heading whose top has passed the bar is the one read.
    const pick = () => {
      const bar = Math.max(120, window.innerHeight * 0.2);
      let best = els[0]?.id ?? "";

      for (const el of els) {
        if (el.getBoundingClientRect().top <= bar) best = el.id;
        else break;
      }

      setActive(best);
    };

    pick();
    window.addEventListener("scroll", pick, { passive: true });

    return () => window.removeEventListener("scroll", pick);
  }, [here]);

  if (heads.length < 2) return null;

  return (
    <nav className="onpage" aria-label="On this page">
      <div className="chapter">On this page</div>
      {heads.map((h) => (
        <a key={h.id} href={`#${h.id}`} className={`${h.sub ? "sub" : ""} ${active === h.id ? "on" : ""}`}>
          {h.text}
        </a>
      ))}
    </nav>
  );
}

// The docs frame: the sidebar on the left, the page, and the headings of
// the page on the right. Under the `lg` breakpoint the sidebar is a
// drawer, a native modal dialog, so focus and Escape work with no code.

export default function DocsShell({ nav, children }: { nav: NavGroup[]; children: ReactNode }) {
  const pathname = usePathname();
  const here = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const drawer = useRef<HTMLDialogElement>(null);
  const side = useRef<HTMLDivElement>(null);

  const title = useMemo(() => {
    for (const g of nav) {
      for (const i of g.items) {
        if (i.path === here) return i.title;

        const kid = i.children?.find((c) => c.path === here);

        if (kid) return kid.title;
      }
    }

    return nav.find((g) => g.path === here)?.title ?? "Overview";
  }, [nav, here]);

  // A new page closes the drawer, and the sidebar scrolls its own list,
  // never the window, to keep the current link in view.
  useEffect(() => {
    drawer.current?.close();

    const box = side.current;
    const on = box?.querySelector<HTMLElement>("a.on");

    if (box && on && (on.offsetTop < box.scrollTop || on.offsetTop > box.scrollTop + box.clientHeight - 40)) {
      box.scrollTop = on.offsetTop - box.clientHeight / 3;
    }
  }, [here]);

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-1 px-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_220px]">
      <aside className="hidden lg:block">
        <div ref={side} className="sticky top-14 max-h-[calc(100vh-56px)] overflow-y-auto border-r border-line py-6 pr-4 pl-1">
          <Sidebar nav={nav} here={here} />
        </div>
      </aside>

      <div className="docs-bar flex lg:hidden">
        <button
          type="button"
          onClick={() => drawer.current?.showModal()}
          className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] text-ink"
          aria-haspopup="dialog"
        >
          <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
          </svg>
          Docs menu
        </button>
        <span className="min-w-0 truncate text-[13px] text-muted">{title}</span>
      </div>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Enter on a link fires this click too, and Escape closes a modal dialog natively. */}
      <dialog
        ref={drawer}
        className="docs-drawer"
        aria-label="Docs"
        // A click on the backdrop, or on a link to a place on the same
        // page, closes the drawer. Escape closes a modal dialog natively.
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest("a")) e.currentTarget.close();
        }}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="eyebrow">Docs</span>
          <button
            type="button"
            onClick={() => drawer.current?.close()}
            className="glass inline-flex h-8 w-8 items-center justify-center rounded-full"
            aria-label="Close the docs menu"
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <div className="px-3 py-3">
          <Sidebar nav={nav} here={here} />
        </div>
      </dialog>

      <main className="min-w-0 py-8 lg:pl-10 xl:pr-8" data-doc-body>
        {children}
      </main>

      <aside className="hidden xl:block">
        <div className="sticky top-14 max-h-[calc(100vh-56px)] overflow-y-auto py-8">
          <OnThisPage here={here} />
        </div>
      </aside>
    </div>
  );
}
