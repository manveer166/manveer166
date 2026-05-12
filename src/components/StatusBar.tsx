"use client";

import { useEffect, useState } from "react";
import { usePair } from "@/lib/store";

export default function StatusBar() {
  const { partner, you } = usePair();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-4 flex items-center justify-between text-[12px] text-muted">
      <div className="flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-ember animate-pulse2" />
        <span>{you?.name ?? "you"} &middot; {partner?.name ?? "pair to begin"}</span>
      </div>
      <div className="tabular-nums">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
