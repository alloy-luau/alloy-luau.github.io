"use client";

import { useEffect } from "react";

// The lens for every glass surface, built per element from its real
// size and corner radius, after the optical model of the liquidglass
// WebGL library (ybouane) and Apple's description of the material.
//
// The surface is a rounded slab with a quarter-circle bevel `Z` px
// deep. Light refracts by the slope of that bevel: strongly at the rim,
// not at all across the flat middle. Each element gets its own SVG
// filter whose displacement map is a canvas rendering of that slope
// field, so a wide pill and a tall card each bend light along their
// own outline. Red is bent a touch wider than green and blue for the
// faint chromatic split of real glass, at the cost of one extra pass.
// Chromium applies the filter through `backdrop-filter: url(#id)`; a
// browser without that keeps the CSS fallback.

/** Bevel depth in px, as the library's default `zRadius`. */
const Z = 40;
/** Displacement at the rim in px, the map's full scale. */
const SCALE = 22;
/** The chromatic split: red bends this much more, blue this much less. */
const CHROMA = 0.05;
/** Map resolution on the long side. */
const RES = 128;
/** The largest surface that gets the lens, in CSS px of area. A bigger
 *  one takes a plain GPU blur: an SVG backdrop filter renders on the
 *  CPU every frame its backdrop moves, and the big cards sit over the
 *  moving lava. */
const MAX_LENS_AREA = 60000;

const SELECTOR = ".glass, .icon-seat";

/** The signed distance from `(x, y)` to a rounded rectangle centered
 *  at the origin with half size `(hx, hy)` and corner radius `r`. */
function sdf(x: number, y: number, hx: number, hy: number, r: number): number {
  const qx = Math.abs(x) - hx + r;
  const qy = Math.abs(y) - hy + r;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));

  return Math.min(Math.max(qx, qy), 0) + outside - r;
}

/** The slope of the bevel at `d` px inside the edge: steep at the rim,
 *  zero past `z`. */
function slope(d: number, z: number): number {
  if (d <= 0) return 8;
  if (d >= z) return 0;

  return (z - d) / Math.sqrt(d * (2 * z - d));
}

/** Renders the displacement map of one element as a data URL. */
function mapFor(w: number, h: number, radius: number): string {
  const long = Math.max(w, h);
  const k = RES / long;
  const mw = Math.max(8, Math.round(w * k));
  const mh = Math.max(8, Math.round(h * k));
  const canvas = document.createElement("canvas");
  canvas.width = mw;
  canvas.height = mh;
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  const img = ctx.createImageData(mw, mh);
  const hx = w / 2;
  const hy = h / 2;
  const r = Math.min(radius, hx, hy);
  const e = 1;
  // A small control has a shallow bevel and a short reach, so the lens
  // never samples past its own far edge: past the element the backdrop
  // is empty, and the glass would go dark.
  const z = Math.min(Z, 0.45 * Math.min(w, h));
  const reach = Math.min(SCALE, 0.3 * Math.min(w, h));

  for (let j = 0; j < mh; j += 1) {
    for (let i = 0; i < mw; i += 1) {
      // The pixel in element px, centered.
      const x = (i + 0.5) / k - hx;
      const y = (j + 0.5) / k - hy;
      const d = -sdf(x, y, hx, hy, r);
      // The inward direction: minus the gradient of the distance field.
      const gx = (sdf(x + e, y, hx, hy, r) - sdf(x - e, y, hx, hy, r)) / (2 * e);
      const gy = (sdf(x, y + e, hx, hy, r) - sdf(x, y - e, hx, hy, r)) / (2 * e);
      const len = Math.hypot(gx, gy) || 1;
      // Refraction along the bevel slope, in px, capped at the reach, and
      // scaled to the map's full range, which the filter reads as SCALE.
      const px = Math.min(reach, slope(Math.max(d, 0), z) * 0.34 * 2.5 * 0.69 * 30 * (z / Z));
      const bend = px / SCALE;
      const ux = (-gx / len) * bend;
      const uy = (-gy / len) * bend;
      const at = (j * mw + i) * 4;
      img.data[at] = Math.round(128 + ux * 127);
      img.data[at + 1] = Math.round(128 + uy * 127);
      img.data[at + 2] = 0;
      img.data[at + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);

  return canvas.toDataURL("image/png");
}

function blurFor(el: Element): number {
  if (el.classList.contains("icon-seat")) return 2;
  if (el.classList.contains("nav-pill") || el.classList.contains("chip")) return 1.5;
  if (el.classList.contains("search")) return 2;

  return 3;
}

export default function GlassLens() {
  useEffect(() => {
    // Gecko parses `backdrop-filter: url()` but does not render it the
    // way Blink does, and an element it cannot render takes no clicks.
    // Firefox keeps the CSS blur instead.
    const gecko = CSS.supports("-moz-appearance", "none");

    if (gecko || (!CSS.supports("backdrop-filter", "url(#x)") && !CSS.supports("-webkit-backdrop-filter", "url(#x)"))) {
      return;
    }

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    const defs = document.createElementNS(ns, "defs");
    svg.appendChild(defs);
    document.body.appendChild(svg);

    const ids = new WeakMap<Element, string>();
    let next = 0;

    const build = (el: Element) => {
      try {
        buildLens(el);
      } catch {
        // The lens is decoration; a failure must never reach the page.
      }
    };

    const buildLens = (el: Element) => {
      const rect = el.getBoundingClientRect();

      if (rect.width < 4 || rect.height < 4) return;

      const style = getComputedStyle(el);
      const radius = Number.parseFloat(style.borderTopLeftRadius) || 0;
      let id = ids.get(el);

      if (!id) {
        next += 1;
        id = `lens-${next}`;
        ids.set(el, id);
      }

      if (rect.width * rect.height > MAX_LENS_AREA) {
        const value = "blur(10px) saturate(125%)";
        (el as HTMLElement).style.setProperty("backdrop-filter", value);
        (el as HTMLElement).style.setProperty("-webkit-backdrop-filter", value);

        return;
      }

      const map = mapFor(rect.width, rect.height, radius);

      if (!map) return;

      const blur = blurFor(el);
      const s = SCALE;
      const old = defs.querySelector(`#${id}`);

      if (old) old.remove();

      const f = document.createElementNS(ns, "filter");
      f.setAttribute("id", id);
      f.setAttribute("x", "0");
      f.setAttribute("y", "0");
      f.setAttribute("width", "100%");
      f.setAttribute("height", "100%");
      f.setAttribute("color-interpolation-filters", "sRGB");
      // Two passes: the wider red bend, and green with blue together.
      f.innerHTML = `
        <feImage href="${map}" preserveAspectRatio="none" result="map"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="soft"/>
        <feDisplacementMap in="soft" in2="map" scale="${s * (1 + CHROMA)}" xChannelSelector="R" yChannelSelector="G" result="dr"/>
        <feDisplacementMap in="soft" in2="map" scale="${s}" xChannelSelector="R" yChannelSelector="G" result="dgb"/>
        <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
        <feColorMatrix in="dgb" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/>
        <feComposite in="r" in2="gb" operator="arithmetic" k2="1" k3="1"/>
      `;
      defs.appendChild(f);
      // A tinted control keeps its own hue; a clear one gets a little
      // more color from what it bends.
      const value = el.classList.contains("nav-pill") ? `url(#${id})` : `url(#${id}) saturate(125%)`;
      (el as HTMLElement).style.setProperty("backdrop-filter", value);
      (el as HTMLElement).style.setProperty("-webkit-backdrop-filter", value);
    };

    // A resize rebuilds the map once the size settles, not on every
    // frame of a spring.
    const pending = new Map<Element, number>();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target;
        window.clearTimeout(pending.get(el));
        pending.set(
          el,
          window.setTimeout(() => {
            pending.delete(el);
            build(el);
          }, 140),
        );
      }
    });

    const attach = () => {
      for (const el of document.querySelectorAll(SELECTOR)) {
        if (!ids.has(el)) {
          build(el);
          observer.observe(el);
        }
      }
    };

    attach();

    // Elements that mount later, such as the moving nav pill.
    const mutations = new MutationObserver(attach);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();

      for (const t of pending.values()) window.clearTimeout(t);

      svg.remove();
    };
  }, []);

  return null;
}
