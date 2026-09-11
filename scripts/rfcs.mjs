// Reads the merged RFCs out of the sibling rfcs repository and writes
// content/rfcs.json, which the /rfcs route renders.
//
// The merge date comes from git, not from the file: the commit that
// added the file to main. A proposal that is still a pull request has
// no such commit, so it never reaches the site.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = process.env.RFCS_DIR ?? join(root, "..", "rfcs");
const folder = join(source, "docs");
const out = join(root, "content", "rfcs.json");

/** The first `# ` heading, or the slug when the file carries none. */
function titleOf(text, slug) {
  const m = text.match(/^#\s+(.+?)\s*$/m);

  return m ? m[1] : slug;
}

/** The `**Status**: Implemented` line an RFC takes when its feature
 *  ships. A merged RFC without one is accepted and not built yet. */
function statusOf(text) {
  const m = text.match(/^\*\*Status\*\*:\s*(.+?)\s*$/m);

  return m ? m[1] : "Accepted";
}

/** The prose under `## Summary`, as one line. */
function summaryOf(text) {
  const at = text.search(/^##\s+Summary\s*$/m);

  if (at < 0) return "";

  const rest = text.slice(at).split("\n").slice(1);
  const body = [];

  for (const line of rest) {
    if (/^##\s/.test(line)) break;

    body.push(line);
  }

  return body
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The day the file landed on main, as `2026-09-10`, or null when no
 *  commit added it. */
function mergedOn(file) {
  const args = ["log", "--diff-filter=A", "--follow", "--format=%aI", "-1"];

  for (const ref of ["main", "HEAD"]) {
    try {
      const line = execFileSync("git", [...args, ref, "--", `docs/${file}`], {
        cwd: source,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();

      if (line) return line.slice(0, 10);
    } catch {
      // The ref is missing, or git is not here. Try the next one.
    }
  }

  return null;
}

function write(rfcs) {
  writeFileSync(out, `${JSON.stringify({ rfcs }, null, 2)}\n`);
}

if (!existsSync(folder)) {
  write([]);
  console.log(`no rfcs checkout at ${folder}; wrote an empty list`);
  process.exit(0);
}

const files = readdirSync(folder)
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .sort();

const rfcs = [];
let pending = 0;

for (const file of files) {
  const merged = mergedOn(file);

  if (!merged) {
    pending += 1;
    continue;
  }

  const text = readFileSync(join(folder, file), "utf8");
  const slug = file.slice(0, -3);

  rfcs.push({
    slug,
    title: titleOf(text, slug),
    area: slug.split("-")[0],
    status: statusOf(text),
    summary: summaryOf(text),
    merged,
    markdown: text,
  });
}

// Newest first, so the index opens on what just landed.
rfcs.sort((a, b) => (a.merged === b.merged ? a.title.localeCompare(b.title) : b.merged.localeCompare(a.merged)));
write(rfcs);

const skipped = pending > 0 ? `, ${pending} not on main yet` : "";
console.log(`wrote ${rfcs.length} rfcs to content/rfcs.json${skipped}`);
