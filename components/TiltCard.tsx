"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Degrees of tilt at the card's edge. */
  max?: number;
};

// A card that tilts toward the pointer, with a light that follows it
// and a gradient border that brightens on hover. The transform sits on
// the wrapper, so the children lay out as usual. Under reduced motion
// the card is still.

export default function TiltCard({ children, className = "", max = 9 }: Props) {
  const reduced = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const glareX = useTransform(px, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(py, [0, 1], ["0%", "100%"]);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  if (reduced) {
    return <div className={`tilt ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      className={`tilt ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
      <motion.div
        aria-hidden="true"
        className="tilt-glare"
        style={{ "--gx": glareX, "--gy": glareY } as Record<string, unknown>}
      />
    </motion.div>
  );
}
