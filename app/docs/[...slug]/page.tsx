import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Crumbs, PageBody, Pager } from "@/components/DocViews";
import UpdatedPill from "@/components/UpdatedPill";
import { plainText } from "@/lib/content";
import { pageAt, pageDate, pages } from "@/lib/docs";

type Props = { params: Promise<{ slug: string[] }> };

const at = (slug: string[]) => pageAt(`/docs/${slug.join("/")}/`);

// Every page of lib/docs.ts but the docs home, which has a route of its own.
export function generateStaticParams() {
  return pages.filter((p) => p.path !== "/docs/").map((p) => ({ slug: p.path.split("/").filter(Boolean).slice(1) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = at((await params).slug);

  if (!page) return { title: "Docs" };

  const parent = page.parent ? pageAt(page.parent) : undefined;
  const title = parent ? `${page.title} · ${parent.title}` : page.title;
  const description = plainText(page.summary) || undefined;

  return {
    title,
    description,
    alternates: { canonical: page.path },
    openGraph: { title: `${title} · Alloy docs`, description, url: page.path },
  };
}

export default async function DocPage({ params }: Props) {
  const page = at((await params).slug);

  if (!page) notFound();

  const v = page.view;
  const code = Boolean(page.parent);
  const date = pageDate(page);

  return (
    <article>
      <Crumbs page={page} />
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
      <PageBody page={page} />
      <Pager page={page} />
    </article>
  );
}
