"use client";

import clsx from "clsx";
import Flame from "@/components/Flame";
import { store, useEmberStore } from "@/lib/store";

export default function StreakClient() {
  const s = useEmberStore();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().toISOString().slice(0, 10);
  const done = s.lastCheckinDate === today;

  const milestones = [3, 7, 14, 30, 60, 100, 365];
  return (
    <div className="space-y-5 pt-2">
      <div>
        <div className="text-[11px] uppercase tracking-[.22em] text-muted">flame</div>
        <h1 className="serif text-3xl">
          grow your <em className="ember-text">flame</em>
        </h1>
      </div>

      <div className="content-grid">
      <section className="card flex flex-col items-center text-center py-8">
        <Flame size={140} intense />
        <div className="mt-4 text-6xl serif font-semibold tabular-nums">{s.flameDays}</div>
        <div className="uppercase tracking-[.22em] text-muted text-xs mt-1">day streak</div>

        <div className="flex gap-3 mt-6">
          {days.map((d, i) => {
            const lit = (s.weeklyMask & (1 << i)) !== 0;
            return (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <div
                  className={clsx(
                    "h-9 w-9 rounded-full grid place-items-center text-sm",
                    lit
                      ? "bg-gradient-to-br from-ember2 to-spark text-black"
                      : "border border-edge text-muted",
                  )}
                >
                  {lit ? "✓" : ""}
                </div>
                <div className="text-[10px] text-muted">{d.slice(0, 2)}</div>
              </div>
            );
          })}
        </div>

        <button
          className={clsx("btn mt-6 w-full max-w-xs", done ? "btn-ghost" : "btn-primary")}
          onClick={() => store.checkIn()}
          disabled={done}
        >
          {done ? "today is locked in" : "tap to keep today"}
        </button>
      </section>

      <section className="card">
        <h3 className="font-semibold">Milestones</h3>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {milestones.map((m) => {
            const hit = s.flameDays >= m;
            return (
              <div
                key={m}
                className={clsx(
                  "rounded-2xl p-3 border text-center",
                  hit
                    ? "border-ember/40 bg-gradient-to-br from-ember/15 to-spark/15"
                    : "border-edge bg-black/20 opacity-80",
                )}
              >
                <div className="text-xl serif font-semibold">{m}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted">days</div>
                {hit ? <div className="mt-1 text-ember text-xs">unlocked</div> : null}
              </div>
            );
          })}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="card">
          <h3 className="font-semibold">Why streaks matter</h3>
          <p className="text-sm text-muted mt-1">
            a one-minute ritual a day beats a perfect weekend a year. answer a prompt, send a photo, or
            a soft kiss — anything keeps the flame.
          </p>
        </section>
      </aside>
      </div>
    </div>
  );
}
