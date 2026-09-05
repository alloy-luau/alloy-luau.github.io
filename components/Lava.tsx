"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

export type Blob = {
  /** Diameter in pixels. */
  size: number;
  /** Position of the center, as CSS lengths or percentages. */
  x: string;
  y: string;
  color: string;
  opacity?: number;
  /** Seconds per drift cycle. */
  duration?: number;
  /** How far the blob leans toward the pointer, 0 to 1. */
  depth?: number;
};

// The lava behind a section: blurred blobs that drift on their own
// loops and lean toward the pointer while it is over the section. The
// layer fills its parent, which must be `position: relative`.

export default function Lava({ blobs, className = "" }: { blobs: Blob[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18, mass: 1.2 });
  const sy = useSpring(my, { stiffness: 40, damping: 18, mass: 1.2 });

  useEffect(() => {
    const el = ref.current?.parentElement;

    if (!el || reduced) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // From -1 to 1 across the section, both ways.
      mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
      my.set(((e.clientY - r.top) / r.height) * 2 - 1);
    };

    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [mx, my, reduced]);

  return (
    <div ref={ref} className={`lava ${className}`} aria-hidden="true">
      {blobs.map((b, i) => (
        <LavaBlob key={i} blob={b} sx={sx} sy={sy} index={i} still={reduced === true} />
      ))}
    </div>
  );
}

function LavaBlob({
  blob,
  sx,
  sy,
  index,
  still,
}: {
  blob: Blob;
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
  index: number;
  still: boolean;
}) {
  const depth = (blob.depth ?? 0.5) * 90;
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);

  return (
    <motion.div
      className="lava-blob-seat"
      style={{ x, y, left: blob.x, top: blob.y, width: blob.size, height: blob.size }}
    >
      <div
        className={`lava-blob ${still ? "" : `lava-drift-${(index % 3) + 1}`}`}
        style={{
          ["--blob" as string]: blob.color,
          opacity: blob.opacity ?? 0.5,
          animationDuration: `${blob.duration ?? 14 + index * 3}s`,
        }}
      />
    </motion.div>
  );
}
