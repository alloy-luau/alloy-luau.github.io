import { LENS_MAP } from "@/lib/lens-map";

// The optics behind the glass, after Apple's description of Liquid
// Glass: the material "bends, shapes, and concentrates light" at its
// edge rather than scattering it, and the regular variant "blurs and
// adjusts the luminosity of background content". Each filter blurs the
// backdrop, then displaces it through a map that is neutral in the
// middle and leans toward the rim, so the center stays flat and the
// edge lenses. A negative scale samples inward, so the rim magnifies
// what is behind it, as a convex edge does, and never reaches past the
// element's bounds. Chromium applies it through `backdrop-filter:
// url(#...)`; other browsers fall back to a blur.

function Lens({ id, blur, scale }: { id: string; blur: number; scale: number }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feImage href={LENS_MAP} preserveAspectRatio="none" result="map" />
      <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="soft" />
      <feDisplacementMap in="soft" in2="map" scale={-scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
}

export default function LensFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <Lens id="liquid-lens" blur={4} scale={30} />
        <Lens id="liquid-lens-soft" blur={2} scale={16} />
      </defs>
    </svg>
  );
}
