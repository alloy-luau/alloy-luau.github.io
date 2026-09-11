# Alloy website

Four routes: the landing page at `/`, the reference at `/docs`, the
playground at `/play`, and the merged proposals at `/rfcs`. Next.js with
TypeScript, Tailwind, and Framer Motion. The build is a static export.

```sh
npm ci
npm run dev        # http://localhost:3000
npm run build      # writes out/
```

The reference reads `content/docs.json`, which the compiler writes from
its own documentation table, the same text the editor shows on hover:

```sh
npm run content    # ../crates/scripts/docs-content.sh: alloy doc --json, then the RFCs
```

Run it after a change to `alloy/src/docs.rs` or `lint.rs` in the `alloy` repository, checked out beside this one as `../crates`. The
tour on both pages reads `content/slides.json`: each chapter's source and
its emitted Luau.

The `/rfcs` route reads `content/rfcs.json`, which `scripts/rfcs.mjs`
writes from the RFC repository, checked out beside this one as
`../rfcs`:

```sh
npm run content:rfcs   # ../rfcs/docs/*.md -> content/rfcs.json
```

Only a file that a commit added to `main` reaches the site, so a
proposal that is still a pull request never appears. The merge date on
each card is that commit's date. With no `../rfcs` checkout the script
writes an empty list and the index renders its empty state, so a fresh
CI clone still builds.

`npm run lint` runs Biome over the sources. `npm run typecheck` runs
`tsc --noEmit`.

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
