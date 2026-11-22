import { docsOf, others } from "@/lib/versions";

// The search index of one release, written as a file by the export.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return others.map((r) => ({ version: r.version }));
}

export async function GET(_: Request, { params }: { params: Promise<{ version: string }> }) {
  return Response.json(docsOf((await params).version)?.searchIndex() ?? []);
}
