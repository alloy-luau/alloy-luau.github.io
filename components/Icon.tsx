// Line icons for the cards, drawn on a 24-unit grid with one stroke
// weight, so they sit beside a title like a glyph.

const PATHS: Record<string, string> = {
  // A fork: one input, every branch covered.
  match: "M12 3v6M12 9l-6 6M12 9l6 6M6 15v6M18 15v6M12 9v12",
  // A box with its fields checked.
  struct: "M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10M8 14l2 2 3-3",
  // A contract: a page with a seal.
  trait: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h4M16 17l1.5 1.5L20 16",
  // A padlock.
  sealed: "M7 11V8a5 5 0 0110 0v3M5 11h14v10H5zM12 15v3",
  // A signal over the wire.
  wire: "M4 12h4l2-5 3 10 2-5h5M12 3v2M12 19v2",
  // A magnifier over a line.
  lint: "M10 4a6 6 0 100 12 6 6 0 000-12zM14.5 14.5L20 20M7 10h6",
  // Chapter eyebrows.
  operators: "M5 8h6M8 5v6M13 16h6M5 16l3 3M8 16l-3 3M18 6a2 2 0 100 4 2 2 0 000-4",
  modules: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  concurrency: "M13 2L4 14h7l-1 8 9-12h-7z",
  data: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  control: "M6 3v18M6 9c0-3 3-4 6-4h2M18 5a2 2 0 100 4 2 2 0 000-4M14 5h2M6 15c0 3 3 4 6 4h2M18 17a2 2 0 100 4 2 2 0 000-4M14 19h2",
  types: "M4 4h7v7H4zM17 3l4 7h-8zM17.5 14a3.5 3.5 0 100 7 3.5 3.5 0 000-7M4 14l7 7M11 14l-7 7",
  sugar: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8zM5 4l.6 1.4L7 6l-1.4.6L5 8l-.6-1.4L3 6l1.4-.6z",
  compile: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1",
  metadata: "M3 12l9-9 9 9-9 9zM12 7a1.5 1.5 0 100 3 1.5 1.5 0 000-3",
  networking: "M12 20v-6M8 10a6 6 0 018 0M5 7a10 10 0 0114 0M12 14a1 1 0 100 2 1 1 0 000-2",
  ui: "M3 5h18v14H3zM3 10h18M8 10v9",
  testing: "M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M8 15h8",
};

export default function Icon({ name, size = 22, className = "" }: { name: string; size?: number; className?: string }) {
  const d = PATHS[name] ?? PATHS.sugar;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

/** The icon for a chapter's eyebrow. */
export function iconFor(eyebrow: string): string {
  const key = eyebrow.toLowerCase().replace(/\s+/g, "");
  const named: Record<string, string> = { controlflow: "control", compiletime: "compile" };

  return named[key] ?? (PATHS[key] ? key : "sugar");
}
