"use client";

export default function Flame({ size = 88, intense = false }: { size?: number; intense?: boolean }) {
  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size * 1.15 }}
      aria-hidden
    >
      {/* glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-70"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,177,74,.7), rgba(255,77,141,.25), transparent 70%)",
        }}
      />
      <svg
        viewBox="0 0 64 80"
        width={size}
        height={size * 1.15}
        className="relative animate-flicker"
      >
        <defs>
          <radialGradient id="fl-outer" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor="#fff4cf" />
            <stop offset="35%" stopColor="#ffb14a" />
            <stop offset="75%" stopColor="#ff7a45" />
            <stop offset="100%" stopColor="#ff4d8d" />
          </radialGradient>
          <radialGradient id="fl-inner" cx="50%" cy="65%" r="40%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="60%" stopColor="#ffe39a" />
            <stop offset="100%" stopColor="#ff9a4a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M32 4c4 10 14 14 14 30 0 12-7 22-14 22S18 46 18 34c0-6 3-8 3-12 0 4 3 6 6 6 0-8-3-12 5-24z"
          fill="url(#fl-outer)"
        />
        <ellipse cx="32" cy="50" rx="8" ry="14" fill="url(#fl-inner)" opacity={intense ? 1 : 0.85} />
      </svg>
      {/* sparkles */}
      <span
        className="absolute -top-1 left-3 h-1.5 w-1.5 rounded-full bg-ember2 animate-sparkle"
        style={{ animationDelay: "0.2s" }}
      />
      <span
        className="absolute top-2 -right-1 h-1 w-1 rounded-full bg-white animate-sparkle"
        style={{ animationDelay: "0.9s" }}
      />
      <span
        className="absolute bottom-1 left-1 h-1 w-1 rounded-full bg-spark animate-sparkle"
        style={{ animationDelay: "1.6s" }}
      />
    </div>
  );
}
