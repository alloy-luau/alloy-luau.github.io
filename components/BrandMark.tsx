/** The icon from aly-symbol.png, as its two layers on one canvas: the
 *  A and the diamond, each in the icon's own purple render. The diamond
 *  can turn once on load, or under the pointer. */
export default function BrandMark({
  size = 260,
  spin = "none",
  className = "",
}: {
  size?: number;
  spin?: "none" | "once" | "hover";
  className?: string;
}) {
  return (
    <span
      className={`brandmark brandmark-${spin} ${className}`}
      style={{ width: size }}
      aria-hidden="true"
    >
      <img className="brandmark-a" src="/mark-a.png" alt="" />
      <img className="brand-diamond" src="/mark-diamond.png" alt="" />
    </span>
  );
}
