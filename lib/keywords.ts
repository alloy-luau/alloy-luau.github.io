// The words the site paints as keywords, in the docs and the playground.
// The Alloy half matches `alloy doc` (its Keywords section); the Luau
// half is the language's own. Add a word here when the compiler learns
// one, so both painters agree.
export const LUAU_KEYWORDS = [
  "and", "break", "do", "else", "elseif", "end", "for", "function", "if", "in",
  "local", "not", "or", "repeat", "return", "then", "until", "while", "continue",
];

export const ALLOY_KEYWORDS = [
  "after", "as", "async", "attribute", "await", "band", "bnot", "bor", "bxor",
  "case", "class", "const", "declare", "default", "delete", "destroy", "each",
  "enum", "export", "extends", "extern", "for", "from", "global", "impl",
  "import", "in", "interface", "is", "local", "macro", "match", "namespace",
  "new", "on", "open", "private", "public", "read", "remote", "requires",
  "satisfies", "shl", "shr", "struct", "trait", "try", "type", "where", "with",
  "write",
];

export const KEYWORDS = new Set([...LUAU_KEYWORDS, ...ALLOY_KEYWORDS]);
