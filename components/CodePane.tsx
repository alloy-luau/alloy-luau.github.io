import { paint, type Mode } from "@/lib/paint";

type Props = {
  code: string;
  mode?: Mode;
  /** The caption: a language and a file name. */
  label?: string;
  note?: string;
  /** The emitted-Luau look, lighter than a source pane. */
  emit?: boolean;
  numbers?: boolean;
  className?: string;
};

/** The file icon a caption shows: Alloy's own marks for its three file
 *  kinds, and the Charmed Icons set (MIT, littensy/charmed-icons) for
 *  Luau and the plain formats. */
function iconFor(mode: Mode, note?: string): { src: string; alt: string } | null {
  const name = note ?? "";

  if (name.endsWith(".d.aly")) return { src: "/d-aly-symbol.png", alt: "" };
  if (name.endsWith(".alx")) return { src: "/alx-symbol.png", alt: "" };
  if (mode === "alloy" || mode === "alx") return { src: "/aly-symbol.png", alt: "" };
  if (name.endsWith(".d.luau")) return { src: "/icons/luau-def.svg", alt: "" };
  if (name === ".luaurc" || name.endsWith(".config.luau")) return { src: "/icons/luau-config.svg", alt: "" };
  if (mode === "luau") return { src: "/icons/luau.svg", alt: "" };
  if (mode === "toml") return { src: "/icons/toml.svg", alt: "" };
  if (mode === "json") return { src: "/icons/json.svg", alt: "" };
  if (mode === "sh") return { src: "/icons/shell.svg", alt: "" };

  return { src: "/icons/text.svg", alt: "" };
}

/** One code block, painted, with an optional caption bar. */
export default function CodePane({
  code,
  mode = "alloy",
  label,
  note,
  emit = false,
  numbers = false,
  className = "",
}: Props) {
  return (
    <div className={`overflow-hidden rounded-[10px] border border-line ${className}`}>
      {label ? (
        <div
          className={`flex items-center justify-between px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] ${
            emit ? "bg-code-emit text-accent-ink" : "bg-code-bg text-accent-ink"
          } border-b border-line`}
        >
          <span className="flex items-center gap-2">
            {(() => {
              const icon = iconFor(mode, note);

              return icon ? <img src={icon.src} alt={icon.alt} width={14} height={14} className="inline-block" aria-hidden="true" /> : null;
            })()}
            {label}
          </span>
          {note ? <b className="font-medium normal-case tracking-normal opacity-70">{note}</b> : null}
        </div>
      ) : null}
      <pre
        className={`code ${emit ? "emit" : ""}`}
        dangerouslySetInnerHTML={{ __html: paint(code, mode, numbers) }}
      />
    </div>
  );
}
