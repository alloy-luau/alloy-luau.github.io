// The releases the docs cover. The default release is the latest one
// that is no candidate, and it lives at `/docs`. Each other release
// lives at `/docs/v/<version>`. scripts/snapshot-docs.mjs writes the
// files this module reads. Only the server reads this module: it loads
// the snapshots from disk at build time.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import versionsJson from "@/content/versions/versions.json";
import { current, dataset } from "@/lib/content";
import { buildDocs, latest, type Docs } from "@/lib/docs";

export type Release = {
  version: string;
  /** The day of the release, as `2026-11-16`. */
  date: string;
  prerelease: boolean;
  /** The folder under content/versions that holds the snapshot. Two
   *  releases with the same docs share one folder. */
  docs: string;
};

/** Every release with docs, the newest first. */
export const releases: Release[] = versionsJson;

const stable = releases.find((r) => !r.prerelease);

if (stable && stable.version !== current.version) {
  throw new Error(
    `content/docs.json is Alloy ${current.version}, and the latest release in versions.json is ${stable.version}. Run scripts/snapshot-docs.mjs for ${stable.version}.`,
  );
}

/** The releases that live under `/docs/v/`: all but the default one. */
export const others: Release[] = releases.filter((r) => r.version !== current.version);

const built = new Map<string, Docs>();

/** The docs of one release, or undefined when the site has none. */
export function docsOf(version: string): Docs | undefined {
  if (version === current.version) return latest;

  const release = others.find((r) => r.version === version);

  if (!release) return undefined;

  let docs = built.get(version);

  if (!docs) {
    const read = (file: string) =>
      JSON.parse(readFileSync(join(process.cwd(), "content", "versions", release.docs, file), "utf8"));

    // The snapshot of one release can stand for a later one, so the
    // version on the page is the one the reader chose.
    docs = buildDocs(dataset({ ...read("docs.json"), version }, read("slides.json")), `/docs/v/${version}`, false);
    built.set(version, docs);
  }

  return docs;
}

/** What the version menu of the sidebar needs: each release and where
 *  its docs start. */
export function menu(version: string) {
  return {
    version,
    latest: current.version,
    releases: releases.map((r) => ({
      version: r.version,
      prerelease: r.prerelease,
      base: r.version === current.version ? "/docs" : `/docs/v/${r.version}`,
    })),
  };
}

export type VersionMenu = ReturnType<typeof menu>;
