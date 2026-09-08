"use client";

import dynamic from "next/dynamic";

// The editor touches the DOM and loads wasm, so it renders on the client
// alone; the shell shows until it is ready.
const Playground = dynamic(() => import("./Playground"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-[1400px] px-5 py-10 font-mono text-[13px] text-muted">Loading the playground…</div>
  ),
});

export default function PlaygroundLoader() {
  return <Playground />;
}
