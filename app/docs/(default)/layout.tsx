import type { ReactNode } from "react";

import DocsShell from "@/components/DocsShell";
import { current } from "@/lib/content";
import { latest } from "@/lib/docs";
import { menu } from "@/lib/versions";

// One frame for every docs page of the default release. It survives a
// navigation between them, so the sidebar keeps its folds and its scroll.
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsShell nav={latest.nav} base={latest.base} menu={menu(current.version)}>
      {children}
    </DocsShell>
  );
}
