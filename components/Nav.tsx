"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";


const LINKS: { href: string; label: string; key: "home" | "docs" }[] = [
  { href: "/", label: "Overview", key: "home" },
  { href: "/docs/", label: "Docs", key: "docs" },
];

/** The top bar: the mark, the two pages, the version. A pill slides
 *  between the links as the pointer moves, and rests on the current
 *  page. */
export default function Nav({ version, current }: { version: string; current: "home" | "docs" }) {
  const [hover, setHover] = useState<"home" | "docs" | null>(null);
  const reduced = useReducedMotion();
  const lit = hover ?? current;

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
        <nav className="ml-auto flex items-center gap-1" onMouseLeave={() => setHover(null)}>
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              onMouseEnter={() => setHover(l.key)}
              onFocus={() => setHover(l.key)}
              className={`nav-link relative rounded-full px-3.5 py-1.5 text-[13.5px] no-underline ${
                lit === l.key ? "text-ink" : "text-ink-2"
              }`}
            >
              {lit === l.key ? (
                <motion.span
                  layoutId="nav-pill"
                  className="nav-pill glass glass-live absolute inset-0 -z-10 rounded-full"
                  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28, mass: 0.9 }}
                />
              ) : null}
              <span className="relative">{l.label}</span>
            </Link>
          ))}
        </nav>
        <a
          href="https://github.com/alloy-luau"
          className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-2 no-underline transition-colors hover:text-ink"
          aria-label="Alloy on GitHub"
          title="Alloy on GitHub"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
