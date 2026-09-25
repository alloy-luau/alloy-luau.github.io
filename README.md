# Alloy website

Four routes: the landing page at `/`, the docs at `/docs`, the
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

The docs have one page per subject, in six groups: Getting started,
Language, Tooling, Configuration, Reference, and Guides. `lib/docs.ts`
holds the outline. The routes, the sidebar, the search index at
`/docs/search.json`, and the previous and next links all read it. Each
`topic:` article in `content/docs.json` gets a page. An article that
`lib/docs.ts` does not name goes under Guides, so a new article needs no
change here. The hand-written pages are in `components/DocsProse.tsx`.

The docs were one page once, and a diagnostic still links to
`/docs/#<anchor>`. The docs home reads the anchor and sends the reader
to the page that holds it now. A static export has no server redirect,
so this runs in the browser.

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
clone still builds.

`content/rfcs.json` is a build artifact, not a file in git, so the site
cannot drift from the RFC repository. `npm run build` writes it first
when it is absent. Both workflows check out `alloy-luau/rfcs` into
`rfcs-src` with `fetch-depth: 0`, because the merge dates come from the
git history, and run the script with `RFCS_DIR` on that path. A
`RFCS_DIR` that holds no `docs` folder stops the build. The site rebuilds
on a push here, on a nightly schedule at 04:20 UTC, and on the
`rfcs-updated` dispatch that the RFC repository sends when a proposal
lands on its `main`. That dispatch needs a `SITE_DISPATCH_TOKEN` secret
in the RFC repository; without it the nightly build still picks the
change up.

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
