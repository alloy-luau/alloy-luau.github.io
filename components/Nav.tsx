"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type NavKey = "home" | "docs" | "play" | "rfcs";

const LINKS: { href: string; label: string; key: NavKey }[] = [
  { href: "/", label: "Overview", key: "home" },
  { href: "/docs/", label: "Docs", key: "docs" },
  { href: "/play/", label: "Playground", key: "play" },
  { href: "/rfcs/", label: "RFCs", key: "rfcs" },
];

/** The top bar: the mark, the four pages, the version. A pill sits under
 *  the current page and slides to the link the pointer is over.
 *
 *  The pill is one element that the bar measures and moves with a CSS
 *  transition. A layout animation cannot do this job here: every route
 *  change remounts the bar, so the animation would run against a tree
 *  that is already gone, and the pill would slide in from the left on
 *  each page load. The first paint carries `data-still`, so the pill
 *  appears where it belongs and moves only after that. */
export default function Nav({ version, current }: { version: string; current: NavKey }) {
  const [hover, setHover] = useState<NavKey | null>(null);
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  const [moves, setMoves] = useState(false);
  const [open, setOpen] = useState(false);

  const barRef = useRef<HTMLElement>(null);
  const linkRefs = useRef(new Map<NavKey, HTMLAnchorElement>());
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  const lit = hover ?? current;

  const measure = useCallback(() => {
    const bar = barRef.current;
    const el = linkRefs.current.get(lit);

    if (!bar || !el) return;

    setBox({ x: el.offsetLeft, w: el.offsetWidth });
  }, [lit]);

  // Before the paint, so the pill is already in place the first time it
  // is drawn.
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const bar = barRef.current;

    if (!bar) return;

    const observer = new ResizeObserver(measure);

    observer.observe(bar);

    for (const el of linkRefs.current.values()) observer.observe(el);

    // The web font changes the label widths after the first paint.
    document.fonts?.ready.then(measure);

    return () => observer.disconnect();
  }, [measure]);

  // The transition turns on one frame after the first measurement, so a
  // page load places the pill without a slide.
  useEffect(() => {
    if (box === null || moves) return;

    const frame = requestAnimationFrame(() => setMoves(true));

    return () => cancelAnimationFrame(frame);
  }, [box, moves]);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) buttonRef.current?.focus();

      wasOpen.current = false;

      return;
    }

    wasOpen.current = true;
    menuRef.current?.querySelector("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;

      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;

      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ground/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-5">
        <Link href="/" className="brand no-underline" aria-label="Alloy">
          {/* The icon's two shapes, from aly-symbol.png: the A in ink
              through a mask, the diamond as itself. Only the diamond
              flips on hover. */}
          <span className="brandmark" aria-hidden="true">
            <span className="brand-a" />
            <img className="brand-diamond" src="/mark-diamond.png" alt="" />
          </span>
          <span className="display brand-rest text-[21px] font-extrabold tracking-[0.02em] text-ink">lloy</span>
        </Link>
        <span className="chip glass ml-1 hidden sm:inline">v{version}</span>
        <nav
          ref={barRef}
          className="relative ml-auto hidden items-center gap-1 sm:flex"
          onMouseLeave={() => setHover(null)}
        >
          {box ? (
            <span
              className="nav-pill glass glass-live pointer-events-none absolute top-0 left-0 h-full rounded-full"
              data-still={moves ? undefined : "true"}
              data-lit={lit}
              style={{ width: `${box.w}px`, transform: `translateX(${box.x}px)` }}
            />
          ) : null}
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              ref={(el) => {
                if (el) linkRefs.current.set(l.key, el);
                else linkRefs.current.delete(l.key);
              }}
              onMouseEnter={() => setHover(l.key)}
              onFocus={() => setHover(l.key)}
              aria-current={current === l.key ? "page" : undefined}
              className={`nav-link relative rounded-full px-3.5 py-1.5 text-[13.5px] no-underline ${
                lit === l.key ? "text-ink" : "text-ink-2"
              }`}
            >
              <span className="relative">{l.label}</span>
            </Link>
          ))}
        </nav>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="nav-burger glass ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full sm:hidden"
          aria-label={open ? "Close the menu" : "Open the menu"}
          aria-expanded={open}
          aria-controls="nav-menu"
        >
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            {open ? (
              <>
                <path d="M5 5l10 10" />
                <path d="M15 5L5 15" />
              </>
            ) : (
              <>
                <path d="M3.5 6h13" />
                <path d="M3.5 10h13" />
                <path d="M3.5 14h13" />
              </>
            )}
          </svg>
        </button>
        <a
          href="https://github.com/alloy-luau"
          className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-2 no-underline transition-colors hover:text-ink"
          title="Alloy on GitHub"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span className="sr-only">Alloy on GitHub</span>
        </a>
      </div>
      {open ? (
        <div ref={menuRef} id="nav-menu" className="nav-menu sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={current === l.key ? "page" : undefined}
              className={current === l.key ? "on" : ""}
            >
              {l.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
