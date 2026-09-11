import type { Metadata } from "next";

import Lava from "@/components/Lava";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import RfcIndex from "@/components/RfcIndex";
import { rfcAreas, rfcPulls, rfcs, version } from "@/lib/content";

export const metadata: Metadata = {
  title: "RFCs",
  description:
    "The merged Alloy proposals: every change to the syntax, the emit, the standard library, the configuration, and the editor, with the design that was agreed before the work began.",
  alternates: { canonical: "/rfcs/" },
  openGraph: {
    title: "Alloy RFCs",
    description: "The merged proposals behind each change to the language, and where an open one lives.",
    url: "/rfcs/",
  },
};

export default function Rfcs() {
  return (
    <>
      <Nav version={version} current="rfcs" />

      <section className="relative overflow-hidden border-b border-line">
        <Lava
          blobs={[
            { size: 460, x: "-4%", y: "-20%", color: "var(--accent)", opacity: 0.42, depth: 0.6 },
            { size: 340, x: "80%", y: "50%", color: "var(--alx)", opacity: 0.28, depth: 0.4, duration: 19 },
          ]}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 pt-14 pb-12">
          <Reveal>
            <div className="eyebrow">The process</div>
            <h1 className="display mb-3 mt-2 text-[36px] font-extrabold leading-[1.05] md:text-[46px]">
              A change to the language is written down first.
            </h1>
            <p className="prose m-0 max-w-[62ch] text-[17px] text-ink-2">
              An RFC is one Markdown file that says what changes, why, what the compiler emits, and what it costs. It
              stays open for at least two weeks, so there is time to read it and to raise a concern. The proposals on
              this page are the merged ones: the design is settled and the feature may be built. A proposal that is
              still under discussion is an open pull request.
            </p>
            <p className="mt-4 text-[14px]">
              <a href={rfcPulls}>The open proposals live on GitHub →</a>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <Lava
          blobs={[
            { size: 520, x: "70%", y: "-10%", color: "var(--accent)", opacity: 0.2, depth: 0.5, duration: 22 },
            { size: 300, x: "10%", y: "80%", color: "#7a58e0", opacity: 0.24, depth: 0.7, duration: 26 },
          ]}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 py-10">
          <RfcIndex rfcs={rfcs} areas={rfcAreas} />
        </div>
      </section>

      <footer className="mx-auto max-w-[1240px] border-t border-line px-5 py-6 text-[13px] text-muted">
        Alloy {version}. The RFC repository is <a href="https://github.com/alloy-luau/rfcs">alloy-luau/rfcs</a>.
      </footer>
    </>
  );
}
