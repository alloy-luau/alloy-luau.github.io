import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AnchorRedirect from "@/components/AnchorRedirect";
import { intro } from "@/components/DocsProse";
import { Crumbs, PageBody, Pager } from "@/components/DocViews";
import UpdatedPill from "@/components/UpdatedPill";
import { plainText } from "@/lib/content";
import type { Docs } from "@/lib/docs";

// The two pages of the docs, for any release: the home and one page of
// the outline. The routes under /docs and under /docs/v/<version> both
// render these, each with its own release.

/** The slug of every page of a release but the home. */
export function docSlugs(docs: Docs): { slug: string[] }[] {
  return docs.pages
    .filter((p) => p.path !== docs.home)
    .map((p) => ({ slug: p.path.slice(docs.home.length).split("/").filter(Boolean) }));
}

const at = (docs: Docs, slug: string[]) => docs.pageAt(`${docs.home}${slug.join("/")}/`);

/** The head of one page. A release that is not the default one keeps
 *  out of the search engines, so a reader lands on the current text. */
export function docMetadata(docs: Docs, slug: string[], indexed: boolean): Metadata {
  const page = at(docs, slug);

  if (!page) return { title: "Docs" };

  const parent = page.parent ? docs.pageAt(page.parent) : undefined;
  const title = parent ? `${page.title} · ${parent.title}` : page.title;
  const description = plainText(page.summary) || undefined;

  return {
    title: indexed ? title : `${title} · ${docs.data.version}`,
    description,
    alternates: { canonical: page.path },
    openGraph: { title: `${title} · Alloy docs`, description, url: page.path },
    ...(indexed ? {} : { robots: { index: false } }),
  };
}

export function DocArticle({ docs, slug }: { docs: Docs; slug: string[] }) {
  const page = at(docs, slug);

  if (!page) notFound();

  const v = page.view;
  const code = Boolean(page.parent);
  const date = docs.pageDate(page);

  return (
    <article>
      <Crumbs docs={docs} page={page} />
      <header className="mb-8">
        <h1
          className={`mt-3 mb-3 leading-[1.1] ${
            code ? "font-mono text-[28px] font-medium md:text-[34px]" : "display text-[32px] font-extrabold md:text-[42px]"
          }`}
        >
          {page.title}
        </h1>
        {v.kind === "slide" ? (
          <p className="lede" dangerouslySetInnerHTML={{ __html: v.slide.title }} />
        ) : v.kind === "group" ? (
          <p className="lede">{page.summary}</p>
        ) : null}
        {date ? <UpdatedPill date={date} /> : null}
      </header>
      <PageBody docs={docs} page={page} />
      <Pager docs={docs} page={page} />
    </article>
  );
}

/** The docs home: what Alloy is, and a map of every group of pages.
 *  `date` is the day the text last changed, or the day of the release.
 *  The default release also sends an old `/docs/#<anchor>` link on. */
export function DocsHome({ docs, date, dateLabel, redirect = false }: { docs: Docs; date?: string; dateLabel: string; redirect?: boolean }) {
  const { liveGroups, pages } = docs;

  return (
    <article>
      {redirect ? <AnchorRedirect moved={docs.movedAnchors()} /> : null}
      <header className="mb-10">
        <div className="eyebrow">The Alloy docs</div>
        <h1 className="display mt-2 mb-3 text-[36px] font-extrabold leading-[1.05] md:text-[48px]">
          Everything the compiler knows.
        </h1>
        <p className="prose m-0 max-w-[60ch] text-[17px] text-ink-2">
          Start with the install, then read the language pages in order. Look up one keyword, std type, error, or lint in
          the reference. The reference pages carry the same text the editor shows on hover, generated from the
          compiler&apos;s own table.
        </p>
        <div className="mt-5">
          <UpdatedPill date={date} label={dateLabel} size="md" />
        </div>
      </header>

      <section className="mb-12">
        <h2 id="intro" className="display mb-4 text-[24px] font-bold">
          Introduction
        </h2>
        {intro}
      </section>

      {liveGroups.map((g) => {
        const items = pages.filter((p) => p.group === g.slug && p.view.kind !== "group" && p.view.kind !== "home" && !p.parent);

        return (
          <section key={g.slug} className="mb-10">
            <h2 id={g.slug} className="display mb-1 text-[24px] font-bold">
              <Link href={`${docs.home}${g.slug}/`} className="text-ink no-underline hover:text-accent-ink">
                {g.title}
              </Link>
            </h2>
            <p className="m-0 mb-4 text-[15px] text-ink-2">{g.blurb}</p>
            <ul className="home-links">
              {items.map((p) => (
                <li key={p.path}>
                  <Link href={p.path}>{p.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <Pager docs={docs} page={docs.pageAt(docs.home)!} />

      <footer className="mt-10 border-t border-line pt-6 text-[13px] text-muted">
        Alloy {docs.data.version}. The reference text is generated by <code className="font-mono">alloy doc --json</code>.
      </footer>
    </article>
  );
}
