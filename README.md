# Alloy website

Two pages: the landing page at `/` and the reference at `/docs`. Next.js
with TypeScript, Tailwind, and Framer Motion. The build is a static
export.

```sh
npm ci
npm run dev        # http://localhost:3000
npm run build      # writes out/
```

The reference reads `content/docs.json`, which the compiler writes from
its own documentation table, the same text the editor shows on hover:

```sh
npm run content    # runs ../crates/scripts/docs-content.sh: alloy doc --json
```

Run it after a change to `alloy/src/docs.rs` or `lint.rs` in the `alloy` repository, checked out beside this one as `../crates`. The
tour on both pages reads `content/slides.json`: each chapter's source and
its emitted Luau.

`npm run review` drives Chrome through puppeteer-core against the
served site at `http://127.0.0.1:1750` and writes element screenshots,
hover states included, to `shots/`. `npm run review:lens` does the same
over a striped backdrop, so the lens at every glass edge is visible. It
is how the glass surfaces were checked against Apple's Liquid Glass
renders and the liquidglass WebGL library.

`npm run perf` measures the frame rate on three sections of the served
site in headless Chrome. Headless has no GPU, so a drop there points at
work that a real display would also feel.

`npm run review:firefox` drives Firefox through WebDriver BiDi and
checks that the nav pill moves, the Docs link navigates, and the glass
falls back to a blur there.
