"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Seconds before the motion starts. */
  delay?: number;
  className?: string;
  /** Rise from below on load rather than on scroll. */
  now?: boolean;
};

/** Fades and lifts its children into place, once, when they scroll in. */
export default function Reveal({ children, delay = 0, className = "", now = false }: Props) {
  const reduced = useReducedMotion();
  // `?review` in the address shows every section at rest at once, for a
  // full-page screenshot; a scroll-triggered reveal cannot fire there.
  const review = typeof window !== "undefined" && window.location.search.includes("review");

  if (reduced) return <div className={className}>{children}</div>;

  const visible = { opacity: 1, y: 0 };
  // The same element either way, so hydration keeps one tree; in review
  // the motion starts at rest.
  const hidden = review ? false : { opacity: 0, y: 18 };
  const transition = { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const };

  if (now) {
    return (
      <motion.div className={className} initial={hidden} animate={visible} transition={transition}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={hidden}
      animate={review ? visible : undefined}
      whileInView={visible}
      viewport={{ once: true, margin: "-60px" }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
