"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

import BrandMark from "@/components/BrandMark";

// The hero's text. The headline types itself on every load; the chips
// slide in from the right one by one; the diamond of the mark turns.

const LINES: { text: string; accent?: boolean; br?: boolean }[] = [
  { text: "Write Alloy.", br: true },
  { text: "Ship " },
  { text: "plain Luau", accent: true },
  { text: ", line for line." },
];

const CHIPS = ["emit never adds a line", "strict by default", "luau-lsp does the typing", "Roblox and plain Luau"];

const TOTAL = LINES.reduce((n, l) => n + l.text.length, 0);

// The whole headline is always in the layout; the characters not yet
// typed are only invisible, so the lines wrap the same way from the
// first keystroke to the last and never shift.
function Headline({ typed, caret }: { typed: number; caret: boolean }) {
  let left = typed;

  return (
    <>
      {LINES.map((l, i) => {
        const n = Math.min(l.text.length, Math.max(0, left));
        const shown = l.text.slice(0, n);
        const rest = l.text.slice(n);
        const here = caret && left >= 0 && left < l.text.length;
        left -= l.text.length;

        return (
          <span key={i} className={l.accent ? "gradient-text not-italic" : undefined}>
            {shown}
            {here ? <span className="caret" aria-hidden="true" /> : null}
            <span className="invisible" aria-hidden="true">
              {rest}
            </span>
            {l.br ? <br /> : null}
          </span>
        );
      })}
    </>
  );
}

export default function Hero() {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setTyped(TOTAL);

      return;
    }

    setTyped(0);
    let n = 0;
    const timer = window.setInterval(() => {
      n += 1;
      setTyped(n);

      if (n >= TOTAL) window.clearInterval(timer);
    }, 34);

    return () => window.clearInterval(timer);
  }, [reduced]);

  const done = typed === null || typed >= TOTAL;
  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div className="relative mx-auto grid max-w-[1240px] gap-10 px-5 pb-16 pt-20 md:grid-cols-[minmax(0,1fr)_260px] md:items-center md:pt-24">
      <div>
        <motion.div className="eyebrow" {...rise(0)}>
          A strict superset of Luau
        </motion.div>
        <h1 className="display mb-5 mt-3 text-[44px] font-extrabold leading-[1.02] md:text-[72px]">
          <Headline typed={typed ?? TOTAL} caret={!done} />
        </h1>
        <motion.p
          className="mb-6 max-w-[36em] text-[19px] text-ink-2"
          style={{ textWrap: "pretty" }}
          {...rise(0.3)}
        >
          Every Luau file is already an Alloy file. Alloy adds the syntax Luau lacks, compiles each construct to
          fixed Luau on the same line, and gives the editor a language server that sees Alloy.
        </motion.p>
        <div className="mb-7 flex flex-wrap gap-2">
          {CHIPS.map((f, i) => (
            <motion.span
              key={f}
              className="chip glass glass-live"
              initial={reduced ? false : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.55 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              {f}
            </motion.span>
          ))}
        </div>
        <motion.div className="flex flex-wrap gap-3" {...rise(0.9)}>
          <Link
            href="/docs/"
            className="btn-primary rounded-full px-5 py-2.5 font-medium text-white no-underline shadow-[var(--shadow)] transition-transform hover:-translate-y-0.5"
          >
            Read the book
          </Link>
          <a
            href="#install"
            className="glass glass-live rounded-full px-5 py-2.5 font-medium text-ink no-underline transition-transform hover:-translate-y-0.5"
          >
            Install
          </a>
        </motion.div>
      </div>
      <motion.div className="hidden md:block" {...rise(0.2)}>
        <div className="drop-shadow-[0_30px_50px_rgba(122,88,224,0.45)]">
          <BrandMark size={250} spin="once" />
        </div>
      </motion.div>
    </div>
  );
}
