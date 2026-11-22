import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import DocsShell from "@/components/DocsShell";
import { current } from "@/lib/content";
import { docsOf, menu, others } from "@/lib/versions";

type Props = { children: ReactNode; params: Promise<{ version: string }> };

// The export writes a folder for each release in this list, and no other.
export const dynamicParams = false;

export function generateStaticParams() {
  return others.map((r) => ({ version: r.version }));
}

// The frame of the docs of one release that is not the default one. A
// line above the page says which release the reader is in.
export default async function VersionLayout({ children, params }: Props) {
  const { version } = await params;
  const docs = docsOf(version);
  const release = others.find((r) => r.version === version);

  if (!docs || !release) notFound();

  return (
    <DocsShell nav={docs.nav} base={docs.base} menu={menu(version)}>
      <p className="callout mb-6">
        {release.prerelease ? (
          <>
            These are the docs of Alloy {version}, a release candidate. The latest release is{" "}
            <Link href="/docs/">Alloy {current.version}</Link>.
          </>
        ) : (
          <>
            These are the docs of Alloy {version}. The latest release is <Link href="/docs/">Alloy {current.version}</Link>.
          </>
        )}
      </p>
      {children}
    </DocsShell>
  );
}
