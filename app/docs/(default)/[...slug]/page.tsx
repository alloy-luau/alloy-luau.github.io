import type { Metadata } from "next";

import { DocArticle, docMetadata, docSlugs } from "@/components/DocPages";
import { latest } from "@/lib/docs";

type Props = { params: Promise<{ slug: string[] }> };

// Every page of lib/docs.ts but the docs home, which has a route of its own.
export function generateStaticParams() {
  return docSlugs(latest);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return docMetadata(latest, (await params).slug, true);
}

export default async function DocPage({ params }: Props) {
  return <DocArticle docs={latest} slug={(await params).slug} />;
}
