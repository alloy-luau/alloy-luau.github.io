import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocsHome } from "@/components/DocPages";
import { docsOf, others } from "@/lib/versions";

type Props = { params: Promise<{ version: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { version } = await params;

  return {
    title: `Docs · ${version}`,
    description: `The docs of Alloy ${version}.`,
    alternates: { canonical: `/docs/v/${version}/` },
    robots: { index: false },
  };
}

export default async function VersionDocs({ params }: Props) {
  const { version } = await params;
  const docs = docsOf(version);
  const release = others.find((r) => r.version === version);

  if (!docs || !release) notFound();

  return <DocsHome docs={docs} date={release.date} dateLabel="Released" />;
}
