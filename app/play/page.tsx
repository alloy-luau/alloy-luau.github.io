import type { Metadata } from "next";

import PlaygroundLoader from "@/components/PlaygroundLoader";

export const metadata: Metadata = {
  title: "Playground",
  description: "Write Alloy in the browser: the compiler, the type checker, completion, and hover, with the emitted Luau beside it.",
  alternates: { canonical: "/play/" },
};

export default function Play() {
  return <PlaygroundLoader />;
}
