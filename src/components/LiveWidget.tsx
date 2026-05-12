"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Flame from "./Flame";
import Avatar from "./Avatar";
import { store, useEmberStore, startSimulator } from "@/lib/store";
import { promptForToday } from "@/lib/prompts";

function relativeTime(ms: number) {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function LiveWidget() {
  const s = useEmberStore();
  const [, force] = useState(0);
  const prompt = useMemo(promptForToday, []);

  // start partner sim
  useEffect(() => {
    startSimulator();
    const t = setInterval(() => force((n) => n + 1), 15_000); // refresh "ago"
    return () => clearInterval(t);
  }, []);

  const lastMoment = s.widget[0];
  const inSync =
    s.thumbSync.youTouching && s.thumbSync.partnerTouching && s.thumbSync.syncSince;

  return (
    <div className="space-y-4">
      <Header />
      {!s.hasPaired ? <NotPairedCard /> : null}

      {/* The Live Widget */}
      <section
        className={clsx(
          "relative overflow-hidden rounded-[28px] p-5",
          "bg-gradient-to-br from-violet/30 via-spark/20 to-ember/30",
          "border border-white/10",
        )}
      >
        <div className="absolute inset-0 pointer-events-none opacity-70">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-ember/40 blur-3xl" />
          <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-violet/50 blur-3xl" />
        </div>

        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[.22em] text-ink/70 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-ember animate-pulse2" />
              live widget
            </div>
            <h2 className="serif italic text-3xl mt-1 leading-tight">
              {s.partner?.name ? `${s.partner.name},` : "your partner"}{" "}
              <span className="ember-text not-italic">right now</span>
            </h2>
          </div>
          <div className="flex -space-x-2">
            <Avatar name={s.partner?.name} emoji={s.partner?.emoji} color={s.partner?.color} size={44} ring />
            <Avatar name={s.you?.name} emoji={s.you?.emoji} color={s.you?.color} size={44} />
          </div>
        </div>

        {/* presence */}
        <div className="relative mt-4 flex items-center gap-3">
          <div
            className={clsx(
              "h-2 w-2 rounded-full",
              s.partnerStatus.isHere ? "bg-emerald-400 animate-pulse2" : "bg-muted",
            )}
          />
          <div className="text-sm">
            <span className="text-ink/90">
              {s.partnerStatus.isHere ? "here with you" : "out in the world"}
            </span>
            <span className="text-muted"> &middot; {s.partnerStatus.activity}</span>
          </div>
        </div>
        <div className="relative mt-1 text-xs text-muted">
          last opened {relativeTime(s.partnerStatus.lastSeen)}
        </div>

        {/* latest moment */}
        <LatestMoment item={lastMoment} />

        {/* sync ring (thumb kiss) */}
        <SyncRing inSync={!!inSync} />

        {/* controls */}
        <div className="relative mt-5 flex gap-2">
          <button
            className="btn btn-primary flex-1 tap"
            onClick={() => {
              store.sendKiss();
            }}
          >
            send a kiss
          </button>
          <a className="btn btn-ghost tap" href="/connect#prompt">
            today's prompt
          </a>
        </div>
      </section>

      {/* Today's prompt teaser */}
      <a
        href="/connect#prompt"
        className="card flex items-center gap-3 tap"
      >
        <div className="h-10 w-10 grid place-items-center rounded-2xl bg-gradient-to-br from-ember/30 to-spark/30">
          <span aria-hidden>✨</span>
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-muted">today's prompt</div>
          <div className="text-ink/95 text-balance">{prompt.text}</div>
        </div>
        <span className="text-muted">›</span>
      </a>

      {/* Streak strip */}
      <StreakStrip />

      {/* Live photo wall */}
      <PhotoWall />
    </div>
  );
}

function Header() {
  const today = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="pt-1">
      <div className="text-[11px] uppercase tracking-[.22em] text-muted">{today}</div>
      <h1 className="serif text-[40px] leading-none mt-1">
        <span className="ember-text">Ember</span>
      </h1>
      <p className="text-muted text-sm mt-1">a live widget for the two of you.</p>
    </div>
  );
}

function NotPairedCard() {
  return (
    <a
      href="/settings"
      className="card flex items-center gap-3 tap border border-ember/40"
    >
      <Flame size={44} />
      <div className="flex-1">
        <div className="font-semibold">Pair with someone</div>
        <div className="text-sm text-muted">
          Add their name to start your flame. (No account needed.)
        </div>
      </div>
      <span className="btn btn-primary">Start</span>
    </a>
  );
}

function LatestMoment({ item }: { item?: { kind: string; data?: string; caption?: string; from: string } }) {
  if (!item) {
    return (
      <div className="relative mt-4 rounded-2xl bg-black/30 border border-white/10 p-4 text-sm text-muted">
        no moments yet — say hi with a kiss, or send a photo from Connect.
      </div>
    );
  }
  return (
    <div className="relative mt-4 rounded-2xl overflow-hidden bg-black/40 border border-white/10">
      {item.kind === "photo" && item.data ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.data} alt={item.caption ?? "moment"} className="w-full aspect-[4/3] object-cover" />
      ) : item.kind === "doodle" && item.data ? (
        <div className="aspect-[4/3] grid place-items-center bg-gradient-to-br from-violet/40 to-spark/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.data} alt="doodle" className="max-h-full max-w-full" />
        </div>
      ) : item.kind === "kiss" ? (
        <div className="aspect-[4/3] grid place-items-center">
          <KissPrint />
        </div>
      ) : (
        <div className="p-5 text-lg serif italic text-balance">{item.caption}</div>
      )}
      <div className="px-3 py-2 text-xs text-muted flex items-center justify-between">
        <span>{item.from === "you" ? "you" : "them"}</span>
        <span>just now</span>
      </div>
    </div>
  );
}

function KissPrint() {
  return (
    <svg viewBox="0 0 200 200" className="w-32 h-32">
      <defs>
        <radialGradient id="kp" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff8aae" />
          <stop offset="100%" stopColor="#ff4d8d" />
        </radialGradient>
      </defs>
      {[...Array(28)].map((_, i) => (
        <circle
          key={i}
          cx={100 + Math.cos((i / 28) * Math.PI * 2) * (50 + (i % 5) * 4)}
          cy={100 + Math.sin((i / 28) * Math.PI * 2) * (50 + (i % 5) * 4)}
          r={1.2 + (i % 4)}
          fill="url(#kp)"
          opacity={0.7}
        />
      ))}
      <text
        x="100"
        y="115"
        textAnchor="middle"
        className="serif"
        fill="#fff"
        fontSize="48"
        fontStyle="italic"
      >
        xo
      </text>
    </svg>
  );
}

function SyncRing({ inSync }: { inSync: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    if (!holding) {
      store.setYouTouching(false);
      return;
    }
    store.setYouTouching(true);
    const t = setTimeout(() => {
      store.setYouTouching(false);
      setHolding(false);
    }, 8000);
    return () => clearTimeout(t);
  }, [holding]);

  return (
    <div className="relative mt-5">
      <div className="text-[11px] uppercase tracking-[.22em] text-muted mb-2">thumb kiss</div>
      <div
        ref={ref}
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        className={clsx(
          "relative h-28 rounded-2xl border border-white/10 grid place-items-center select-none cursor-pointer overflow-hidden",
          "bg-gradient-to-br from-black/40 to-black/10",
        )}
      >
        <div
          className={clsx(
            "absolute inset-0",
            inSync ? "animate-pulse2" : "",
          )}
          style={{
            background: inSync
              ? "radial-gradient(closest-side, rgba(255,77,141,.45), transparent 70%)"
              : holding
                ? "radial-gradient(closest-side, rgba(255,177,74,.30), transparent 70%)"
                : "transparent",
          }}
        />
        <div className="relative flex items-center gap-6">
          <Thumb on={holding} label="you" />
          <div className="text-2xl serif italic text-muted">+</div>
          <Thumb on={false} partnerOn={true} label="them" />
        </div>
        <div className="absolute bottom-2 inset-x-0 text-center text-[11px] text-muted">
          {inSync ? "in sync ♥" : "hold to send"}
        </div>
      </div>
    </div>
  );
}

function Thumb({ on, partnerOn, label }: { on?: boolean; partnerOn?: boolean; label: string }) {
  // partnerOn driven by simulator (we read store)
  const s = useEmberStore();
  const lit = on ?? (partnerOn ? s.thumbSync.partnerTouching : false);
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={clsx(
          "h-14 w-14 rounded-full grid place-items-center transition",
          lit
            ? "bg-gradient-to-br from-ember2 to-spark shadow-glow scale-110"
            : "bg-edge",
        )}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill={lit ? "white" : "currentColor"}>
          <path d="M9 11V6.5A2.5 2.5 0 0 1 13.5 5L13 8h4.5a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 16.5 18H9V11zM4 11h3v8H4z" />
        </svg>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

function StreakStrip() {
  const s = useEmberStore();
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <a href="/streak" className="card flex items-center gap-3 tap">
      <Flame size={42} />
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted">flame</div>
        <div className="text-xl font-semibold">
          {s.flameDays} <span className="text-muted text-sm font-normal">day streak</span>
        </div>
      </div>
      <div className="flex gap-1">
        {days.map((d, i) => {
          const lit = (s.weeklyMask & (1 << i)) !== 0;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={clsx(
                  "h-6 w-6 rounded-full grid place-items-center text-[10px]",
                  lit
                    ? "bg-gradient-to-br from-ember2 to-spark text-black"
                    : "bg-edge text-muted",
                )}
              >
                {lit ? "✓" : ""}
              </div>
              <div className="text-[9px] text-muted">{d}</div>
            </div>
          );
        })}
      </div>
    </a>
  );
}

function PhotoWall() {
  const s = useEmberStore();
  const photos = s.widget.filter((w) => w.kind === "photo" || w.kind === "doodle");
  if (photos.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="font-semibold">Recent moments</h3>
        <a href="/memories" className="text-sm text-ember">all →</a>
      </div>
      <div className="flex gap-3 overflow-x-auto scroll-x pb-2">
        {photos.slice(0, 12).map((p) => (
          <div
            key={p.id}
            className="shrink-0 w-40 rounded-2xl overflow-hidden border border-white/10 bg-black/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.data} alt={p.caption ?? ""} className="w-full h-40 object-cover" />
            <div className="p-2 text-[11px] text-muted truncate">
              {p.caption ?? (p.from === "you" ? "you" : "them")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
