import Link from "next/link";

import Background from "@/components/Background";
import CodePane from "@/components/CodePane";
import Hero from "@/components/Hero";
import Icon, { iconFor } from "@/components/Icon";
import Lava from "@/components/Lava";
import BrandMark from "@/components/BrandMark";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import TiltCard from "@/components/TiltCard";
import { commands, contracts, slides, version } from "@/lib/content";

const hero = slides.find((s) => s.id === "safe");

export default function Home() {
  return (
    <>
      <Nav version={version} current="home" />

      {/* Hero */}
      <section className="hero-ground relative overflow-hidden border-b border-line">
        <Background className="absolute inset-0 h-full w-full" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(18,15,30,0.15) 0%, rgba(18,15,30,0.55) 70%, #120f1e 100%)" }}
        />
        <Hero />
      </section>

      {/* One chapter, in both panes */}
      {hero ? (
        <section className="relative overflow-hidden border-b border-line">
          <Lava
            blobs={[
              { size: 460, x: "-6%", y: "-10%", color: "var(--accent)", opacity: 0.5, depth: 0.6 },
              { size: 380, x: "78%", y: "60%", color: "var(--alx)", opacity: 0.32, depth: 0.4, duration: 19 },
              { size: 260, x: "40%", y: "85%", color: "#7a58e0", opacity: 0.4, depth: 0.8, duration: 23 },
            ]}
          />
          <div className="relative mx-auto max-w-[1240px] px-5 py-16">
            <Reveal>
              <div className="eyebrow">{hero.eyebrow}</div>
              <h2
                className="display mb-3 mt-2 text-[28px] font-bold leading-[1.1] md:text-[36px]"
                dangerouslySetInnerHTML={{ __html: hero.title }}
              />
              <p className="mb-6 max-w-[42em] text-[17px] text-ink-2">{hero.thesis}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-0 overflow-hidden rounded-xl border border-line shadow-[0_40px_80px_-40px_rgba(155,126,240,0.5)] lg:grid-cols-2">
                <CodePane code={hero.src} mode="alloy" label="Alloy" note="safe.aly" numbers className="rounded-none border-0" />
                <CodePane
                  code={hero.emit}
                  mode="luau"
                  label="Emitted Luau"
                  note="same line count"
                  emit
                  numbers
                  className="rounded-none border-0 border-t border-line lg:border-l lg:border-t-0"
                />
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Strictness */}
      <section id="strict" className="dots relative border-b border-line bg-ground-2">
        <Lava
          blobs={[
            { size: 520, x: "30%", y: "-20%", color: "var(--accent)", opacity: 0.26, depth: 0.5 },
            { size: 320, x: "85%", y: "70%", color: "var(--warm)", opacity: 0.1, depth: 0.7, duration: 21 },
          ]}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 py-16">
          <Reveal>
            <div className="eyebrow">Strict by default</div>
            <h2 className="display mb-3 mt-2 text-[28px] font-bold leading-[1.1] md:text-[36px]">
              The checker runs strict. The compiler holds the rest.
            </h2>
            <p className="mb-8 max-w-[42em] text-[17px] text-ink-2">
              Luau strict mode is the floor: <code className="rounded border border-line bg-ground px-1.5 font-mono text-[0.88em]">alloy init</code>{" "}
              writes it into <code className="rounded border border-line bg-ground px-1.5 font-mono text-[0.88em]">.luaurc</code> and{" "}
              <code className="rounded border border-line bg-ground px-1.5 font-mono text-[0.88em]">.config.luau</code>. Five contracts the
              checker cannot see are compile errors on top.
            </p>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {contracts.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.06} className="h-full">
                <TiltCard className="h-full">
                  <article className="card flex h-full flex-col overflow-hidden">
                    <div className="p-5">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="icon-seat">
                          <Icon name={c.icon} />
                        </span>
                        <h3 className="display m-0 text-[18px] font-bold">{c.title}</h3>
                      </div>
                      <p className="m-0 text-[14.5px] text-ink-2">{c.body}</p>
                    </div>
                    <CodePane code={c.code} mode="alloy" className="mt-auto rounded-none rounded-b-[14px] border-0 border-t" />
                  </article>
                </TiltCard>
              </Reveal>
            ))}
            <Reveal delay={0.3} className="h-full">
              <article className="glass glass-live flex h-full flex-col justify-between rounded-[14px] p-5">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="icon-seat">
                      <Icon name="lint" />
                    </span>
                    <h3 className="display m-0 text-[18px] font-bold">And the lints</h3>
                  </div>
                  <p className="m-0 text-[14.5px] text-ink-2">
                    Nil discipline, unreachable and empty defaults, legacy scheduler globals, unused imports. With{" "}
                    <code className="rounded border border-line bg-ground px-1.5 font-mono text-[0.88em]">[lint] strict = true</code>, no
                    implicit <code className="rounded border border-line bg-ground px-1.5 font-mono text-[0.88em]">any</code>.
                  </p>
                </div>
                <Link href="/docs/#lints" className="mt-4 text-[14px]">
                  Every lint, in the book →
                </Link>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Chapters */}
      <section id="chapters" className="relative overflow-hidden border-b border-line">
        <Lava
          blobs={[
            { size: 540, x: "88%", y: "8%", color: "var(--alx)", opacity: 0.22, depth: 0.5 },
            { size: 440, x: "-8%", y: "80%", color: "var(--warm)", opacity: 0.12, depth: 0.7, duration: 25 },
            { size: 360, x: "45%", y: "45%", color: "var(--accent)", opacity: 0.2, depth: 0.35, duration: 17 },
          ]}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 py-16">
          <Reveal>
            <div className="eyebrow">The language</div>
            <h2 className="display mb-8 mt-2 text-[28px] font-bold leading-[1.1] md:text-[36px]">
              Fourteen chapters, each with its emit beside it.
            </h2>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slides.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 0.05} className="h-full">
                <TiltCard className="h-full" max={7}>
                <Link
                  href={`/docs/#${s.id}`}
                  className="card group flex h-full flex-col p-5 no-underline"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="icon-seat">
                      <Icon name={iconFor(s.eyebrow)} size={18} />
                    </span>
                    <span className="eyebrow">{s.eyebrow}</span>
                  </div>
                  <h3
                    className="display mb-2 text-[17px] font-bold text-ink [&_code]:rounded [&_code]:bg-accent-soft [&_code]:px-1.5 [&_code]:font-mono [&_code]:text-[0.8em] [&_code]:text-accent-ink"
                    dangerouslySetInnerHTML={{ __html: s.title }}
                  />
                  <p className="m-0 text-[14px] text-ink-2">{s.thesis}</p>
                  <span className="mt-auto pt-4 text-[13px] text-accent-ink opacity-0 transition-opacity group-hover:opacity-100">
                    Read →
                  </span>
                </Link>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tooling and install */}
      <section id="install" className="dots relative border-b border-line bg-ground-2">
        <Lava
          blobs={[
            { size: 480, x: "55%", y: "90%", color: "var(--accent)", opacity: 0.22, depth: 0.5 },
            { size: 300, x: "5%", y: "20%", color: "var(--alx)", opacity: 0.16, depth: 0.7, duration: 20 },
          ]}
        />
        <div className="relative mx-auto grid max-w-[1240px] gap-10 px-5 py-16 lg:grid-cols-2">
          <Reveal className="flex h-full flex-col">
            <div className="eyebrow">Tooling</div>
            <h2 className="display mb-3 mt-2 text-[28px] font-bold leading-[1.1] md:text-[36px]">One binary, one server, one extension.</h2>
            <p className="mb-5 max-w-[40em] text-[16px] text-ink-2">
              The <code className="rounded border border-line bg-ground px-1.5 font-mono text-[0.88em]">alloy</code> command builds, checks, lints,
              formats, and documents. The language server proxies luau-lsp over a mirror of compiled files, so hover,
              completion, and diagnostics land on Alloy lines. The VS Code extension wires both up.
            </p>
            <div className="mt-auto">
              <CodePane
                code={commands.map(([c, d]) => `${c.padEnd(36)} # ${d}`).join("\n")}
                mode="sh"
                label="Commands"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="flex h-full flex-col">
            <div className="eyebrow">Install</div>
            <h2 className="display mb-3 mt-2 text-[28px] font-bold leading-[1.1] md:text-[36px]">From the repository.</h2>
            <p className="mb-5 max-w-[40em] text-[16px] text-ink-2">
              The build script compiles every crate and the extension, then installs the two binaries into{" "}
              <code className="rounded border border-line bg-ground px-1.5 font-mono text-[0.88em]">~/.alloy/bin</code>. Add that directory to
              your PATH, install the <code className="rounded border border-line bg-ground px-1.5 font-mono text-[0.88em]">.vsix</code>, and open a
              folder with an <code className="rounded border border-line bg-ground px-1.5 font-mono text-[0.88em]">.aly</code> file.
            </p>
            <div className="mt-auto">
              <CodePane
                code={[
                  "scripts/build.sh --release --install   # alloy and alloy-lsp into ~/.alloy/bin",
                  "alloy init                             # alloy.toml, .luaurc, .config.luau",
                  "alloy build                            # src/ to build/, plus the runtime",
                  "alloy check                            # errors and lints, nothing written",
                  "rojo serve .alloy/build.project.json   # the compiled tree, from [mount]",
                ].join("\n")}
                mode="sh"
                label="Shell"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-3 px-5 py-8 text-[13px] text-muted">
        <BrandMark size={18} />
        <span>Alloy {version}</span>
        <span>·</span>
        <Link href="/docs/">The book</Link>
        <span className="ml-auto font-mono text-[12px]">every emit is real compiler output</span>
      </footer>
    </>
  );
}
