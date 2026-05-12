import clsx from "clsx";

export default function Avatar({
  name,
  emoji,
  color,
  size = 40,
  className,
  ring,
}: {
  name?: string;
  emoji?: string;
  color?: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const initials = (name ?? "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={clsx(
        "relative grid place-items-center rounded-full font-semibold text-black",
        ring && "ring-2 ring-ember/70 ring-offset-2 ring-offset-bg",
        className,
      )}
      style={{
        width: size,
        height: size,
        background:
          color ??
          "linear-gradient(135deg, #ffd089, #ff7a45 55%, #ff4d8d)",
        fontSize: size * 0.4,
      }}
    >
      {emoji ? <span style={{ fontSize: size * 0.55 }}>{emoji}</span> : initials || "•"}
    </div>
  );
}
