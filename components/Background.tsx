"use client";

import { useEffect, useRef } from "react";

// The hero's background: a flow field of slow, bright streaks over a
// still CSS glow. The canvas clears every frame and each streak redraws
// its last few positions, brightest at the head, so a trail ends where
// its memory does and never burns in. A pointer over the hero pulls
// the streaks toward it; when it leaves, they return to the field.
// With reduced motion the field draws once and holds.

type Particle = { x: number; y: number; life: number; hue: number; trail: number[] };

/** Points a streak remembers: its visible length. */
const TRAIL = 12;

const VIOLET = [155, 126, 240] as const;
const LILAC = [201, 181, 255] as const;
const CYAN = [92, 198, 238] as const;
const WARM = [255, 208, 138] as const;

function colorOf(hue: number, alpha: number): string {
  const c = hue < 0.55 ? VIOLET : hue < 0.8 ? LILAC : hue < 0.94 ? CYAN : WARM;

  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

export default function Background({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let raf = 0;
    let t = 0;
    // The pointer, in canvas space, and how much pull it has: the pull
    // eases in and out so the streaks bend and unbend smoothly.
    const mouse = { x: 0, y: 0, want: 0, pull: 0 };

    const seed = (p: Particle): Particle => {
      p.x = Math.random() * width;
      p.y = Math.random() * height;
      p.life = 80 + Math.random() * 160;
      p.hue = Math.random();
      p.trail.length = 0;

      return p;
    };

    const resize = () => {
      // Capped below the display's ratio: the streaks are soft anyway,
      // and the fill rate of the canvas is the hero's main cost.
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const count = Math.min(360, Math.floor((width * height) / 10000));
      particles = Array.from({ length: count }, () => seed({ x: 0, y: 0, life: 0, hue: 0, trail: [] }));
    };

    // The field: two layered sine waves, turning slowly with time.
    const angle = (x: number, y: number): number => {
      const s = 0.0035;

      return (
        Math.sin(x * s + t * 0.4) * Math.cos(y * s * 1.3 - t * 0.3) * 2.4 +
        Math.sin((x + y) * s * 0.5 + t * 0.2) * 1.2
      );
    };

    // Draws a streak: three runs of its history, dim at the tail and
    // bright at the head.
    const draw = (p: Particle) => {
      const n = p.trail.length / 2;

      if (n < 2) return;

      const fade = Math.min(1, p.life / 60);
      const runs = 2;
      const per = Math.ceil((n - 1) / runs);

      for (let r = 0; r < runs; r += 1) {
        const from = r * per;
        const to = Math.min(n - 1, from + per);

        if (from >= to) continue;

        ctx.strokeStyle = colorOf(p.hue, (0.08 + 0.16 * r) * fade);
        ctx.beginPath();
        ctx.moveTo(p.trail[from * 2], p.trail[from * 2 + 1]);

        for (let i = from + 1; i <= to; i += 1) {
          ctx.lineTo(p.trail[i * 2], p.trail[i * 2 + 1]);
        }

        ctx.stroke();
      }
    };

    // `steps` are frames at 60 Hz; `dt` scales one call to the time that
    // passed, so the motion is the same at any frame rate.
    const step = (steps: number, dt = 1) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width, height);

      mouse.pull += (mouse.want - mouse.pull) * Math.min(1, 0.06 * dt);

      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let s = 0; s < steps; s += 1) {
        const last = s + 1 === steps;

        for (const p of particles) {
          const a = angle(p.x, p.y);
          let vx = Math.cos(a);
          let vy = Math.sin(a);

          if (mouse.pull > 0.01) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const d = Math.hypot(dx, dy) || 1;
            // Full pull near the pointer, none past 420px; a particle
            // right on the pointer gets a swirl so they do not pile up.
            const reach = Math.max(0, 1 - d / 420);
            const w = reach * reach * mouse.pull;
            const swirl = d < 40 ? 1 : 0;
            const tx = (dx / d) * (1 - swirl) + (-dy / d) * swirl;
            const ty = (dy / d) * (1 - swirl) + (dx / d) * swirl;
            vx = vx * (1 - w) + tx * w;
            vy = vy * (1 - w) + ty * w;
          }

          const speed = 1.6 * dt;
          p.x += vx * speed;
          p.y += vy * speed;
          p.trail.push(p.x, p.y);

          if (p.trail.length > TRAIL * 2) {
            p.trail.splice(0, 2);
          }

          p.life -= dt;

          if (last) draw(p);

          if (p.life <= 0 || p.x < -10 || p.y < -10 || p.x > width + 10 || p.y > height + 10) {
            seed(p);
          }
        }
      }

      t += 0.004 * dt;
    };

    // The loop runs only while the hero is on screen. A frame's motion
    // scales with the time since the last one, capped so a stall after
    // a tab switch does not fling the streaks.
    let visible = true;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(3, (now - last) / (1000 / 60));
      last = now;

      if (visible) step(1, dt);

      raf = window.requestAnimationFrame(loop);
    };

    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    seen.observe(canvas);

    resize();

    if (reduced) {
      step(140);
    } else {
      raf = window.requestAnimationFrame(loop);
    }

    const onResize = () => {
      resize();

      if (reduced) step(140);
    };

    // The pointer is read on the window, so content over the canvas
    // does not hide it; inside the canvas it pulls, outside it lets go.
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.want = inside ? 1 : 0;
    };

    const onLeave = () => {
      mouse.want = 0;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      window.cancelAnimationFrame(raf);
      seen.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={className} role="presentation" />;
}
