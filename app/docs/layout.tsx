import type { ReactNode } from "react";

import DocsShell from "@/components/DocsShell";
import { nav } from "@/lib/docs";

// One frame for every docs page. It survives a navigation between them,
// so the sidebar keeps its folds and its scroll.
export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsShell nav={nav}>{children}</DocsShell>;
}
