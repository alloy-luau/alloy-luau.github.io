import type { MetadataRoute } from "next";

import { SITE, rfcs } from "@/lib/content";
import { pageDate, pages } from "@/lib/docs";

// The export writes this as /sitemap.xml. The docs part comes from the
// same outline as the routes, so a new page is listed with no change here.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, SITE).toString();

  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    ...pages.map((p) => ({
      url: url(p.path),
      lastModified: pageDate(p),
      changeFrequency: "weekly" as const,
      priority: p.path === "/docs/" ? 0.9 : 0.7,
    })),
    { url: url("/play/"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/rfcs/"), changeFrequency: "weekly", priority: 0.6 },
    ...rfcs.map((r) => ({ url: url(`/rfcs/${r.slug}/`), lastModified: r.merged, priority: 0.5 })),
  ];
}
