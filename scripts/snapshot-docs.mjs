// Freezes the docs of one Alloy release under content/versions/. Run it
// when a release is cut, then commit the result:
//
//   ALLOY=/path/to/alloy node scripts/snapshot-docs.mjs 0.2.0 2026-12-01
//
// `$ALLOY` is the binary of that release; without it the script runs
// the `alloy` on the path. The day is the day of the release, and
// today when it is left out.
//
// The script writes the doc table of the binary, `alloy doc --json`,
// and the tour chapters with the Luau that binary emits. A chapter the
// binary cannot compile is left out of that release. When the result
// equals the snapshot of the next older release, the two share one
// folder.
//
// The site keeps one release for each minor line, `0.1` or `0.2`: the
// newest patch replaces the older ones of its line.
//
// The latest release that is no candidate is the default of the site.
// The script copies its files to content/docs.json and
// content/slides.json, which the landing page and the playground read,
// and stamps content/updated.json. A candidate stays in the list only
// while it is newer than that release.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const versionsDir = join(root, "content", "versions");
const versionsFile = join(versionsDir, "versions.json");
const [version, date = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version) || !/^\d{4}-\d\d-\d\d$/.test(date)) {
  console.error("usage: [ALLOY=<binary>] node scripts/snapshot-docs.mjs <version> [<yyyy-mm-dd>]");
  process.exit(1);
}

const alloy = process.env.ALLOY ?? "alloy";
const run = (args, cwd) => spawnSync(alloy, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const load = (path) => JSON.parse(readFileSync(path, "utf8"));

/** Semver order: the numbers first, then a release over its candidates,
 *  then the parts of the candidate, a number as a number. */
function compare(a, b) {
  const split = (v) => {
    const [core, pre] = v.split("-");

    return [core.split(".").map(Number), pre ? pre.split(".") : null];
  };
  const [ca, pa] = split(a);
  const [cb, pb] = split(b);

  for (let i = 0; i < 3; i++) if (ca[i] !== cb[i]) return ca[i] - cb[i];

  if (!pa || !pb) return pa ? -1 : pb ? 1 : 0;

  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if (pa[i] === undefined || pb[i] === undefined) return pa[i] === undefined ? -1 : 1;

    const [na, nb] = [Number(pa[i]), Number(pb[i])];

    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      if (na !== nb) return na - nb;
    } else if (pa[i] !== pb[i]) {
      return pa[i] < pb[i] ? -1 : 1;
    }
  }

  return 0;
}

// The doc table, from the binary of the release.
const table = run(["doc", "--json"], root);

if (table.status !== 0) {
  console.error(`\`${alloy} doc --json\` failed:\n${table.stderr}`);
  process.exit(1);
}

const docs = JSON.parse(table.stdout);

if (docs.version !== version) {
  console.error(`${alloy} is Alloy ${docs.version}, not ${version}. Set ALLOY to the binary of ${version}.`);
  process.exit(1);
}

// The tour chapters, with the Luau this binary emits for each.
const tour = load(join(root, "content", "slides.json"));
const scratch = mkdtempSync(join(tmpdir(), "alloy-snapshot-"));
const slides = [];

try {
  for (const slide of tour.slides) {
    const file = `${slide.id}${slide.id === "markup" ? ".alx" : ".aly"}`;

    writeFileSync(join(scratch, file), slide.src);

    const built = run(["build", file], scratch);

    if (built.status !== 0) {
      console.warn(`docs ${version}: the chapter \`${slide.id}\` does not compile, so this release leaves it out`);
      continue;
    }

    // The emit keeps every source line in place, so lines carry trailing
    // padding; the tour shows them without it.
    const emit = built.stdout
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trimEnd();

    slides.push({ ...slide, emit });
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

const snapshot = { "docs.json": json(docs), "slides.json": json({ ...tour, slides }) };
// Two releases share a folder when all but the version line is equal.
const body = (text) => text.replace(/^\s*"version": "[^"]+",\n/m, "");
const same = (dir) =>
  Object.entries(snapshot).every(([file, text]) => {
    const path = join(versionsDir, dir, file);

    return existsSync(path) && body(readFileSync(path, "utf8")) === body(text);
  });

mkdirSync(versionsDir, { recursive: true });

let versions = (existsSync(versionsFile) ? load(versionsFile) : []).filter((r) => r.version !== version);
const older = versions.filter((r) => compare(r.version, version) < 0).sort((a, b) => compare(b.version, a.version))[0];
let folder = version;

if (older && same(older.docs)) {
  folder = older.docs;
} else {
  rmSync(join(versionsDir, version), { recursive: true, force: true });
  mkdirSync(join(versionsDir, version), { recursive: true });

  for (const [file, text] of Object.entries(snapshot)) writeFileSync(join(versionsDir, version, file), text);
}

versions.push({ version, date, prerelease: version.includes("-"), docs: folder });
versions.sort((a, b) => compare(b.version, a.version));

// A candidate goes once a release that is no candidate is newer.
const stable = versions.find((r) => !r.prerelease);

if (stable) versions = versions.filter((r) => !r.prerelease || compare(r.version, stable.version) > 0);

// One set of pages a minor line: the newest patch stands for the line.
// The export writes about 60 MB for each release it shows, and GitHub
// Pages stops at 1 GB.
const line = (v) => v.split(".").slice(0, 2).join(".");
const lines = new Set();

versions = versions.filter((r) => {
  if (r.prerelease) return true;
  if (lines.has(line(r.version))) return false;

  lines.add(line(r.version));

  return true;
});

writeFileSync(versionsFile, json(versions));

// A second run, or a candidate that left, can leave a folder no release uses.
const used = new Set(versions.map((r) => r.docs));

for (const entry of readdirSync(versionsDir, { withFileTypes: true })) {
  if (entry.isDirectory() && !used.has(entry.name)) rmSync(join(versionsDir, entry.name), { recursive: true });
}

// The default release feeds the landing page and the playground too.
// content/slides.json is also where each chapter is written, so a
// chapter the default release cannot compile stops the copy.
if (stable?.version === version && slides.length < tour.slides.length) {
  console.error(`docs ${version}: the default release must compile each chapter; content/ keeps its files`);
  process.exit(1);
}

if (stable?.version === version) {
  writeFileSync(join(root, "content", "docs.json"), snapshot["docs.json"]);
  writeFileSync(join(root, "content", "slides.json"), snapshot["slides.json"]);
  // A piece that changed in this release takes the day of the release.
  spawnSync(process.execPath, [join(root, "scripts", "stamp-updated.mjs")], {
    stdio: "inherit",
    env: { ...process.env, DOCS_DATE: process.env.DOCS_DATE ?? date },
  });
}

console.log(
  folder === version
    ? `docs ${version}: ${docs.entries.length} entries, ${docs.lints.length} lints, ${slides.length} chapters`
    : `docs ${version}: the same docs as ${folder}`,
);
