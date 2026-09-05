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
      </div>
    </header>
  );
}
