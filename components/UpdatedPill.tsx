import { formatDate } from "@/lib/content";

// The day a piece of the book last changed, as a glass pill beside its
// heading. The dates come from content/updated.json, which the content
// script stamps from the hash of each piece.
export default function UpdatedPill({
  date,
  label = "Updated",
  size = "sm",
}: {
  date?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  if (!date) {
    return null;
  }

  const sizing = size === "md" ? "px-3.5 py-1.5 text-[12.5px]" : "px-2.5 py-1 text-[11px]";

  return (
    <span
      className={`glass glass-live inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-mono font-normal tracking-normal ${sizing}`}
      title={`Last updated ${date}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent-ink shadow-[0_0_8px_var(--accent)]" aria-hidden />
      <span className="text-muted">{label}</span>
      <time dateTime={date} className="text-ink">
        {formatDate(date)}
      </time>
    </span>
  );
}
