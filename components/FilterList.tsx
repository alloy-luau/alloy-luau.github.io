"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/** The docs' search field: a glass pill with a magnifier. */
export function SearchField({
  value,
  onChange,
  label,
  onFocus,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  onFocus?: () => void;
  className?: string;
}) {
  return (
    <div className={`search glass ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={label}
        aria-label={label}
      />
    </div>
  );
}

/** A filter over a list the server drew. Each `[data-filter]` element
 *  carries its own lower-case text, and a `[data-filter-group]` hides
 *  when none of its items match. The items stay server components, so
 *  the painted code in them ships no tokenizer. */
export default function FilterList({ label, children }: { label: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = root.current;

    if (!el) return;

    const q = query.trim().toLowerCase();
    let n = 0;

    for (const item of el.querySelectorAll<HTMLElement>("[data-filter]")) {
      item.hidden = q !== "" && !(item.dataset.filter ?? "").includes(q);

      if (!item.hidden) n += 1;
    }

    for (const group of el.querySelectorAll<HTMLElement>("[data-filter-group]")) {
      group.hidden = group.querySelector("[data-filter]:not([hidden])") === null;
    }

    setShown(q ? n : null);
  }, [query]);

  return (
    <div ref={root}>
      <SearchField value={query} onChange={setQuery} label={label} className="mb-2 max-w-[420px]" />
      <p className="m-0 mb-4 min-h-[1.4em] text-[13px] text-muted" aria-live="polite">
        {shown === null ? "" : shown === 0 ? "Nothing matches." : `${shown} ${shown === 1 ? "match" : "matches"}`}
      </p>
      {children}
    </div>
  );
}
