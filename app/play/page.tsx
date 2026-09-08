import type { Metadata } from "next";

import Nav from "@/components/Nav";
import PlaygroundLoader from "@/components/PlaygroundLoader";
import { version } from "@/lib/content";

export const metadata: Metadata = {
  title: "Playground",
  description: "Write Alloy in the browser: the compiler, the type checker, completion, and hover, with the emitted Luau beside it.",
  alternates: { canonical: "/play/" },
};

export default function Play() {
  return (
    <>
      <Nav version={version} current="play" />
      <PlaygroundLoader />
    </>
  );
}
