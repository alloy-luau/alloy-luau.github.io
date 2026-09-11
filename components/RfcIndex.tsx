"use client";

import Link from "next/link";
import { Fragment, useState } from "react";

import { inline } from "@/components/Markdown";
import Reveal from "@/components/Reveal";
import { areaLabel, formatDate, rfcPulls, rfcSource, type Rfc } from "@/lib/content";

/** The merged RFCs as cards, with a row of area filters above them. The
 *  filter runs here, in the browser: the page itself is static. */
export default function RfcIndex({ rfcs, areas }: { rfcs: Rfc[]; areas: string[] }) {
  const [area, setArea] = useState<string>("all");
  const shown = area === "all" ? rfcs : rfcs.filter((r) => r.area === area);

  if (rfcs.length === 0) {
    return (
      <Reveal className="mx-auto max-w-[620px]">
        <div className="glass glass-live rounded-[14px] p-8 text-center">
          <h2 className="display m-0 mb-2 text-[20px] font-bold">No proposal has merged yet.</h2>
          <p className="m-0 text-[15px] text-ink-2">
            The first RFCs are open pull requests. Read them there, and say what you think, while the design is still
            open.
          </p>
          <a href={rfcPulls} className="btn-primary mt-5 inline-flex rounded-full px-5 py-2.5 font-medium text-[14px] text-white no-underline">
            The open proposals on GitHub
          </a>
        </div>
      </Reveal>
    );
  }

  return (
    <>
      <Reveal>
        <fieldset className="rfc-filters">
          <legend className="sr-only">Filter by area</legend>
          <button
            type="button"
            className="chip glass pick"
            aria-pressed={area === "all"}
            onClick={() => setArea("all")}
          >
            All <small>{rfcs.length}</small>
          </button>
          {areas.map((a) => (
            <button
              key={a}
              type="button"
              className="chip glass pick"
              aria-pressed={area === a}
              onClick={() => setArea(a)}
            >
              {areaLabel(a)} <small>{rfcs.filter((r) => r.area === a).length}</small>
            </button>
          ))}
        </fieldset>
      </Reveal>
      <div className="mt-6 grid gap-4 md:grid-cols-2" data-rfc-list data-count={shown.length}>
        {shown.map((r, i) => (
          <Reveal key={r.slug} delay={(i % 4) * 0.05} className="h-full">
            <article className="card flex h-full flex-col p-5" data-rfc={r.slug} data-area={r.area}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="chip">{areaLabel(r.area)}</span>
                <time className="font-mono text-[12px] text-muted" dateTime={r.merged}>
                  Merged {formatDate(r.merged)}
                </time>
                {r.status === "Implemented" ? <span className="chip shipped">Implemented</span> : null}
              </div>
              <h2 className="display m-0 mb-2 text-[19px] font-bold leading-[1.25]">
                <Link href={`/rfcs/${r.slug}/`} className="no-underline">
                  {r.title}
                </Link>
              </h2>
              <p className="m-0 text-[14.5px] text-ink-2">
                {inline(r.summary).map((n, j) => (
                  <Fragment key={j}>{n}</Fragment>
                ))}
              </p>
              <div className="mt-auto flex items-center gap-4 pt-4 text-[13.5px]">
                <Link href={`/rfcs/${r.slug}/`}>Read the RFC →</Link>
                <a href={rfcSource(r.slug)} className="text-muted">
                  The file on GitHub
                </a>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </>
  );
}
