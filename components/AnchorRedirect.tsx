"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** The docs were one page once, and a diagnostic still links to
 *  `/docs/#<anchor>`. This sends such a link on to the page that holds
 *  the anchor now. A static export has no server redirect, so it runs
 *  here, in the browser. */
export default function AnchorRedirect({ moved }: { moved: Record<string, string> }) {
  const router = useRouter();

  useEffect(() => {
    const go = () => {
      const to = moved[decodeURIComponent(window.location.hash.slice(1))];

      if (to) router.replace(to);
    };

    go();
    window.addEventListener("hashchange", go);

    return () => window.removeEventListener("hashchange", go);
  }, [moved, router]);

  return null;
}
