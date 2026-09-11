import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Lava from "@/components/Lava";
import Markdown from "@/components/Markdown";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import { areaLabel, formatDate, rfc, rfcBody, rfcPulls, rfcSource, rfcs, version } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

// A static export needs at least one path for a dynamic route. Until
// the first RFC merges there is none, so the route builds one page that
// answers with the 404.
export function generateStaticParams() {
  return rfcs.length > 0 ? rfcs.map((r) => ({ slug: r.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = rfc(slug);

  if (!found) return { title: "RFC" };

  return {
    title: found.title,
    description: found.summary,
    alternates: { canonical: `/rfcs/${slug}/` },
    openGraph: { title: `${found.title} · Alloy RFC`, description: found.summary, url: `/rfcs/${slug}/` },
  };
}

export default async function RfcPage({ params }: Props) {
  const { slug } = await params;
  const found = rfc(slug);

  if (!found) notFound();

  return (
    <>
      <Nav version={version} current="rfcs" />

      <section className="relative overflow-hidden border-b border-line">
        <Lava
          blobs={[
            { size: 420, x: "-4%", y: "-30%", color: "var(--accent)", opacity: 0.36, depth: 0.6 },
            { size: 300, x: "84%", y: "60%", color: "var(--alx)", opacity: 0.24, depth: 0.4, duration: 21 },
          ]}
        />
        <div className="relative mx-auto max-w-[860px] px-5 pt-10 pb-10">
          <Reveal now>
            <p className="m-0 text-[13.5px]">
              <Link href="/rfcs/" className="text-muted no-underline">
                ← Every RFC
              </Link>
            </p>
            <h1 className="display mt-3 mb-4 text-[30px] font-extrabold leading-[1.1] md:text-[38px]">{found.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">{areaLabel(found.area)}</span>
              <time className="font-mono text-[12.5px] text-muted" dateTime={found.merged}>
                Merged {formatDate(found.merged)}
              </time>
              {found.status === "Implemented" ? <span className="chip shipped">Implemented</span> : null}
              <a href={rfcSource(found.slug)} className="ml-auto text-[13.5px]">
                The file on GitHub →
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <article className="mx-auto max-w-[860px] px-5 py-10">
        <Markdown text={rfcBody(found.markdown)} />
      </article>

      <footer className="mx-auto max-w-[860px] border-t border-line px-5 py-6 text-[13px] text-muted">
        A proposal that is still under discussion is an open pull request: <a href={rfcPulls}>see them all</a>.{" "}
        <Link href="/rfcs/">Back to every RFC</Link>.
      </footer>
    </>
  );
}
