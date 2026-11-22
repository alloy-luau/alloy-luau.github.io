import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocArticle, docMetadata, docSlugs } from "@/components/DocPages";
import { docsOf, others } from "@/lib/versions";

type Props = { params: Promise<{ version: string; slug: string[] }> };

export const dynamicParams = false;

// Every page of every release under /docs/v/.
export function generateStaticParams() {
  return others.flatMap((r) => docSlugs(docsOf(r.version)!).map((p) => ({ version: r.version, ...p })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { version, slug } = await params;
  const docs = docsOf(version);

  return docs ? docMetadata(docs, slug, false) : { title: "Docs" };
}

export default async function VersionDocPage({ params }: Props) {
  const { version, slug } = await params;
  const docs = docsOf(version);

  if (!docs) notFound();

  return <DocArticle docs={docs} slug={slug} />;
}
