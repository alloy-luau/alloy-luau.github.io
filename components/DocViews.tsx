import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import CodePane from "@/components/CodePane";
import { prose } from "@/components/DocsProse";
import FilterList from "@/components/FilterList";
import Markdown from "@/components/Markdown";
import { contracts, entry, lintGroups, memberGroups, memberLabel, plainText, stdItems, type Entry } from "@/lib/content";
import {
  article,
  categories,
  childrenOf,
  docHref,
  entryLabel,
  entrySlug,
  errorReport,
  groupOf,
  neighbours,
  pageAt,
  subPagesOf,
  type Page,
} from "@/lib/docs";
import { inline } from "@/lib/inline";

// The parts of a docs page: the trail above it, the body for each kind
// of page, and the previous and next links under it.

const md = (text: string): ReactNode =>
  inline(text).map((n, j) => <Fragment key={j}>{n}</Fragment>);

/** Docs / Reference / Keywords / struct, each one a link but the last. */
export function Crumbs({ page }: { page: Page }) {
  const trail: { title: string; path: string }[] = [{ title: "Docs", path: "/docs/" }];
  const group = groupOf(page);

  if (page.path !== `/docs/${group.slug}/`) trail.push({ title: group.title, path: `/docs/${group.slug}/` });

  const parent = page.parent ? pageAt(page.parent) : undefined;

  if (parent) trail.push({ title: parent.title, path: parent.path });

  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        {trail.map((t) => (
          <li key={t.path}>
            <Link href={t.path}>{t.title}</Link>
          </li>
        ))}
        <li aria-current="page">{page.title}</li>
      </ol>
    </nav>
  );
}

/** The page before and the page after, in sidebar order. */
export function Pager({ page }: { page: Page }) {
  const { prev, next } = neighbours(page);

  return (
    <nav aria-label="Previous and next pages" className="pager">
      {prev ? (
        <Link href={prev.path} className="card pager-link" rel="prev">
          <small>← Previous</small>
          <span>{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.path} className="card pager-link pager-next" rel="next">
          <small>Next →</small>
          <span>{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}

/** A grid of pages, each with its one-line summary. */
export function Cards({ items, filter = false }: { items: Page[]; filter?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((p) => (
        <Link
          key={p.path}
          href={p.path}
          className="doc-card"
          data-filter={filter ? `${p.title} ${plainText(p.summary)}`.toLowerCase() : undefined}
        >
          <span className={p.parent ? "font-mono text-[14px]" : "display text-[16px] font-bold"}>{p.title}</span>
          {p.summary ? <span className="doc-card-summary">{md(p.summary)}</span> : null}
          {p.view.kind === "entry" && stdLine(p.view.entry) ? (
            <span className="doc-card-summary font-mono text-[12px] text-muted">{stdLine(p.view.entry)}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

/** The members a std card lists, from the summary cards of the tour. */
function stdLine(e: Entry): string | undefined {
  return e.group === "Std" ? stdItems.find((s) => s[2] === e.key)?.[1] : undefined;
}

/** One std type: the signature, the overview, an index of the members,
 *  then a card for each of them. */
function StdEntry({ entry: e }: { entry: Entry }) {
  const groups = memberGroups(e);

  return (
    <>
      {e.signature ? <CodePane code={e.signature} mode="alloy" className="mb-3" /> : null}
      <Markdown text={e.markdown} />
      {groups.length > 0 ? (
        <nav className="member-index" aria-label={`${e.key} members`}>
          {groups.flatMap((g) =>
            g.members.map((m) => (
              <a key={`${g.kind}-${m.name}`} href={`#${m.name}`} className="chip glass">
                {m.name}
              </a>
            )),
          )}
        </nav>
      ) : null}
      {groups.map((g) => (
        <div key={g.kind}>
          <h2 className="member-kind" id={`kind-${g.kind}`}>
            {g.title}
          </h2>
          {g.members.map((m) => (
            <section key={m.name} className="member glass">
              <h3 id={m.name}>{memberLabel(e, m)}</h3>
              <CodePane code={m.signature} mode="alloy" className="mb-2" />
              <div className="prose">
                <p>{md(m.doc)}</p>
              </div>
              <CodePane code={m.example} mode="alloy" />
            </section>
          ))}
        </div>
      ))}
    </>
  );
}

const LINT_INTRO =
  "`alloy flux` and `alloy lint` run them. The `[lint]` table in alloy.toml sets `deny`, `warn`, and `allow` lists by lint or by group, and `strict = true` turns the pedantic group on. A lint whose rewrite keeps the program the same carries that rewrite, and `alloy flux --fix` applies it. The language server shows the same lints as warnings.";

/** A reference category: its entries on this page when they are short,
 *  or a card for each entry page when they are long. */
function Category({ page, slug }: { page: Page; slug: string }) {
  const cat = categories.find((c) => c.slug === slug)!;
  const intro = entry(`topic:${slug}`);

  return (
    <>
      {intro ? (
        <Markdown text={article(intro.markdown).body} />
      ) : (
        <div className="prose">
          <p>{md(slug === "lints" ? LINT_INTRO : page.summary)}</p>
        </div>
      )}
      <FilterList label={`Filter ${cat.title.toLowerCase()}`}>
        {slug === "lints" ? (
          lintGroups.map((g) => (
            <section key={g.name} data-filter-group className="mb-8">
              <h2 id={g.name} data-toc={g.name} className="display mb-1 text-[20px] font-bold">
                {g.name} <span className="chip ml-2 text-[11px]">{g.lints.length}</span>
              </h2>
              <div className="prose">
                <p>{md(g.summary)}</p>
              </div>
              <Cards
                filter
                items={childrenOf(page).filter((p) => p.view.kind === "lint" && p.view.lint.group === g.name)}
              />
            </section>
          ))
        ) : cat.paged ? (
          <Cards filter items={childrenOf(page)} />
        ) : (
          cat.entries.map((e) => (
            <section key={e.key} className="entry" data-filter={`${e.key} ${plainText(e.markdown)}`.toLowerCase()}>
              <h2 id={entrySlug(e.key)}>{entryLabel(e.key)}</h2>
              <Markdown text={e.markdown} />
            </section>
          ))
        )}
      </FilterList>
    </>
  );
}

/** The body of a page, by kind. */
export function PageBody({ page }: { page: Page }) {
  const v = page.view;

  switch (v.kind) {
    case "home":
      return null;

    case "group":
      return <Cards items={childrenOf(page)} />;

    case "prose":
      return prose[v.id] ?? null;

    case "slide": {
      const s = v.slide;
      const topic = v.topic ? entry(`topic:${v.topic}`) : undefined;

      return (
        <>
          <div className="prose">
            <p>{s.thesis}</p>
          </div>
          <CodePane
            code={s.src}
            mode={s.mode === "alx" ? "alx" : "alloy"}
            label="Alloy"
            note={s.mode === "alx" ? "component.alx" : `${s.id}.aly`}
            numbers
            className="mb-2"
          />
          <CodePane code={s.emit} mode="luau" label="Emitted Luau" note="same line count" emit numbers className="mb-2" />
          <ul className="pointlist">
            {s.points.map((p, j) => (
              <li key={j} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </ul>
          {topic ? (
            <div className="mt-10">
              <Markdown text={`# In depth\n\n${article(topic.markdown).body}`} />
            </div>
          ) : null}
        </>
      );
    }

    case "topic": {
      const subs = subPagesOf(page);

      return (
        <>
          <Markdown text={article(entry(`topic:${v.name}`)?.markdown ?? "").body} />
          {v.name === "strict" ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {contracts.map((c) => (
                <article key={c.title} className="overflow-hidden rounded-xl border border-line bg-panel">
                  <div className="p-4">
                    <h3 className="display m-0 mb-1 text-[16px] font-bold">{c.title}</h3>
                    <p className="m-0 text-[14px] text-ink-2">{c.body}</p>
                  </div>
                  <CodePane code={c.code} mode="alloy" className="rounded-none border-0 border-t" />
                </article>
              ))}
            </div>
          ) : null}
          {subs.length > 0 ? (
            <div className="mt-8">
              <Cards items={subs} />
            </div>
          ) : null}
        </>
      );
    }

    case "category":
      return <Category page={page} slug={v.slug} />;

    case "entry": {
      const e = v.entry;

      if (e.group === "Std") return <StdEntry entry={e} />;

      if (e.group === "Errors") {
        const report = errorReport(e.markdown);

        return (
          <>
            {report.anchor ? (
              <p className="callout">
                The rule behind this error is on the <Link href={docHref(report.anchor)}>{report.title}</Link> page.
              </p>
            ) : null}
            <Markdown text={article(report.body).body} />
          </>
        );
      }

      return <Markdown text={e.markdown} />;
    }

    case "lint": {
      const l = v.lint;

      return (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            <Link href={`/docs/reference/lints/#${l.group}`} className="chip no-underline">
              {l.group}
            </Link>
            <span className="chip">{l.default === "strict" ? "off until [lint] strict" : l.default}</span>
          </div>
          <div className="prose">
            <p>
              <b>{md(`${l.summary.charAt(0).toUpperCase()}${l.summary.slice(1)}.`)}</b>
            </p>
          </div>
          <Markdown text={l.detail} />
          <div className="prose">
            <p>
              Set its level in the <code>[lint]</code> table of <Link href="/docs/configuration/alloy-toml/">alloy.toml</Link>,
              or for one file with <Link href="/docs/configuration/alloy-lint/">--@alloy-lint</Link>.
            </p>
          </div>
        </>
      );
    }
  }
}
