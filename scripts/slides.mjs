// Writes the emit of each tour chapter from the compiler, so the tour
// shows the Luau that `alloy build` writes today. Each chapter's `src` in
// content/slides.json compiles as `<id>.aly` (`<id>.alx` for the markup
// chapter) in a scratch folder, so a message that names the file reads
// `macros.aly:5`. A chapter that does not compile stops the run.
//
// The compiler is `$ALLOY` when set, else the one in ../crates through
// cargo, the same compiler `npm run content` takes the doc table from.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "content", "slides.json");
const content = JSON.parse(readFileSync(path, "utf8"));
const alloy = process.env.ALLOY
  ? [process.env.ALLOY]
  : ["cargo", "run", "-q", "--manifest-path", join(root, "..", "crates", "Cargo.toml"), "--bin", "alloy", "--"];

const scratch = mkdtempSync(join(tmpdir(), "alloy-slides-"));
try {
  for (const slide of content.slides) {
    const file = `${slide.id}${slide.id === "markup" ? ".alx" : ".aly"}`;
    writeFileSync(join(scratch, file), slide.src);
    const run = spawnSync(alloy[0], [...alloy.slice(1), "build", file], { cwd: scratch, encoding: "utf8" });
    if (run.status !== 0) {
      throw new Error(`${slide.id} does not compile:\n${run.stderr}${run.stdout}`);
    }
    // The emit keeps every source line in place, so lines carry trailing
    // padding; the tour shows them without it.
    slide.emit = run.stdout
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trimEnd();
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

writeFileSync(path, `${JSON.stringify(content, null, 2)}\n`);
console.log(`wrote the emit of ${content.slides.length} tour chapters`);
