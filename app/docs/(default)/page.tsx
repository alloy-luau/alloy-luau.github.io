import type { Metadata } from "next";

import { DocsHome } from "@/components/DocPages";
import { updatedAll } from "@/lib/content";
import { latest } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "The Alloy docs: install, the language beside its emitted Luau, the toolchain, the configuration, and a reference for every keyword, std type, error kind, and lint.",
  alternates: { canonical: "/docs/" },
  openGraph: {
    title: "The Alloy docs",
    description:
      "Every Alloy construct with its emitted Luau beside it, the toolchain and its configuration, and a reference for every keyword, std type, and lint.",
    url: "/docs/",
  },
};

export default function Docs() {
  return <DocsHome docs={latest} date={updatedAll} dateLabel="Last updated" redirect />;
}
