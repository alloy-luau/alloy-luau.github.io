// Copies the TextMate grammars from the VS Code extension into
// `lib/grammars`, so the site paints code with the editor's own rules.
// Usage: node scripts/grammars.mjs   (EXT_DIR overrides the checkout)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const ext = process.env.EXT_DIR ?? path.join(root, "../extensions/vscode");
const from = path.join(ext, "syntaxes");
const to = path.join(root, "lib/grammars");

fs.mkdirSync(to, { recursive: true });

for (const name of ["aly", "alx", "daly"]) {
  const file = `${name}.tmLanguage.json`;

  fs.copyFileSync(path.join(from, file), path.join(to, file));
  console.log(`grammars: ${file}`);
}
