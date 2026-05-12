"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { useEmberStore } from "@/lib/store";

type Filter = "today" | "all" | "photos" | "questions";

export default function MemoriesClient() {
  const s = useEmberStore();
  const [f, setF] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return s.memories.filter((m) => {
      if (f === "today") return m.date === today;
      if (f === "photos") return m.kind === "photo";
      if (f === "questions") return m.kind === "note" && m.title?.startsWith("Q:");
      return true;
    });
  }, [s.memories, f]);

  const grouped = useMemo(() => {
    const g = new Map<string, typeof filtered>();
    for (const m of filtered) {
      const list = g.get(m.date) ?? [];
      list.push(m);
      g.set(m.date, list);
    }
    return Array.from(g.entries());
  }, [filtered]);

  return (
    <div className="space-y-4 pt-2">
      <div>
        <div className="text-[11px] uppercase tracking-[.22em] text-muted">memories</div>
        <h1 className="serif text-3xl">
          save your <em className="ember-text">moments</em>
        </h1>
      </div>

      <div className="flex gap-2 overflow-x-auto scroll-x">
        {(["today", "all", "photos", "questions"] as Filter[]).map((k) => (
          <button
            key={k}
            onClick={() => setF(k)}
            className={clsx(
              "px-4 py-2 rounded-full text-sm capitalize whitespace-nowrap tap border",
              f === k
                ? "bg-ink text-black border-ink"
                : "bg-black/30 text-muted border-edge",
            )}
          >
            {k}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="card text-center text-muted py-12">
          <p>no memories yet.</p>
          <p className="text-sm mt-1">answer today's prompt or send a photo to start.</p>
        </div>
      ) : null}

      {grouped.map(([date, items]) => (
        <section key={date} className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted px-1">
            {prettyDate(date)}
          </div>
          {items.map((m) => (
            <article key={m.id} className="card">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wider text-ember">
                  {m.kind === "photo"
                    ? "Photo"
                    : m.kind === "milestone"
                      ? "Bucket"
                      : m.kind === "challenge"
                        ? "Challenge"
                        : m.title?.startsWith("Q:")
                          ? "Question"
                          : "Note"}
                </div>
                <div className="text-[10px] text-muted">{shortTime(m.createdAt)}</div>
              </div>
              <h4 className="serif text-xl mt-1 text-balance">{m.title.replace(/^Q:\s*/, "")}</h4>
              {m.body ? <p className="text-ink/85 mt-1 text-sm">{m.body}</p> : null}
              {m.data ? (
                <div className="mt-3 rounded-2xl overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.data} alt={m.title} className="w-full max-h-72 object-cover" />
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}

function prettyDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString([], { month: "long", day: "numeric", weekday: "long" });
}
function shortTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
