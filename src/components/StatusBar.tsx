"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

export default function StatusBar() {
  const path = usePathname();
  const { partner, you, quietUntil } = useStore((s) => ({
    partner: s.partner,
    you: s.you,
    quietUntil: s.quietUntil,
  }));
  const quiet = !!quietUntil && quietUntil > Date.now();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (path?.startsWith("/welcome")) return null;

  return (
    <div className="px-4 flex items-center justify-between text-[12px] text-muted">
      <div className="flex items-center gap-2">
        <span
          className={
            "inline-block w-1.5 h-1.5 rounded-full " +
            (quiet ? "bg-muted" : "bg-ember animate-pulse2")
          }
        />
        <span>
          {you?.name ?? "you"} &middot; {partner?.name ?? "pair to begin"}
          {quiet ? " · 🌙 quiet" : ""}
        </span>
      </div>
      <div className="tabular-nums">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
