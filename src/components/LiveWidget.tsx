"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Flame from "./Flame";
import Avatar from "./Avatar";
import ShareSheet from "./ShareSheet";
import {
  store,
  useEmberStore,
  startSimulator,
  activeShare,
  isQuiet,
} from "@/lib/store";
import { promptForToday } from "@/lib/prompts";

function untilLabel(ms: number) {
  const s = Math.max(0, Math.floor((ms - Date.now()) / 1000));
  if (s < 60) return `fades in ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `fades in ${m}m`;
  const h = Math.floor(m / 60);
  return `fades in ${h}h`;
}
function agoLabel(ms: number) {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function LiveWidget() {
  const s = useEmberStore();
  const [, force] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const prompt = useMemo(promptForToday, []);

  useEffect(() => {
    startSimulator();
    const t = setInterval(() => force((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  const theirShare = activeShare(s, "partner");
  const yourShare = activeShare(s, "you");
  const quiet = isQuiet(s);

  return (
    <div className="space-y-4">
      <Header />
      {!s.hasPaired ? <NotPairedCard /> : null}

      <section
        className={clsx(
          "relative overflow-hidden rounded-[28px] p-5 border border-white/10",
          quiet
            ? "bg-gradient-to-br from-black/60 to-black/30"
            : "bg-gradient-to-br from-violet/30 via-spark/20 to-ember/30",
        )}
      >
        <div className="absolute inset-0 pointer-events-none opacity-70">
          {!quiet && (
            <>
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-ember/40 blur-3xl" />
              <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-violet/50 blur-3xl" />
            </>
          )}
        </div>

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[.22em] text-ink/70 flex items-center gap-2">
              <span
                className={clsx(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  quiet ? "bg-muted" : "bg-ember animate-pulse2",
                )}
              />
              live widget
            </div>
            <h2 className="serif italic text-3xl mt-1 leading-tight">
              {quiet ? (
                <>quiet hours</>
              ) : (
                <>
                  {s.partner?.name ?? "your partner"},{" "}
                  <span className="ember-text not-italic">right now</span>
                </>
              )}
            </h2>
          </div>
          <QuietToggle quiet={quiet} until={s.quietUntil} />
        </div>

        {/* Their share */}
        <div className="relative mt-4">
          {quiet ? (
            <div className="text-sm text-muted">
              you stopped broadcasting and dimmed incoming. nothing is being sent
              either way until you tap to come back.
            </div>
          ) : theirShare ? (
            <SharePreview share={theirShare} who={s.partner?.name ?? "them"} />
          ) : (
            <div className="rounded-2xl bg-black/30 border border-white/10 p-4 text-sm text-muted">
              no recent share — that's fine. shares only show up here when{" "}
              {s.partner?.name ?? "they"} actively send one.
            </div>
          )}
        </div>

        {/* Your share, mirrored back so you know what you're putting out */}
        <div className="relative mt-3">
          <div className="text-[11px] uppercase tracking-wider text-muted">
            what they're seeing from you
          </div>
          <div className="mt-1">
            {yourShare ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="text-xl">{yourShare.emoji ?? "✨"}</div>
                <div className="flex-1 text-sm">
                  <div className="text-ink/90">{yourShare.label ?? yourShare.caption}</div>
                  <div className="text-[11px] text-muted">{untilLabel(yourShare.expiresAt)}</div>
                </div>
                <button
                  className="btn btn-ghost text-xs"
                  onClick={() => store.clearMyShare()}
                >
                  clear
                </button>
              </div>
            ) : (
              <div className="text-sm text-muted">
                nothing right now. you'll only show up on their widget when you
                pick a share.
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="relative mt-5 flex gap-2">
          <button
            className="btn btn-primary flex-1 tap"
            onClick={() => setSheetOpen(true)}
            disabled={quiet}
          >
            share now
          </button>
          <button
            className="btn btn-ghost tap"
            onClick={() => store.sendKissInvite()}
            disabled={quiet || !s.sharePrefs.allowKisses}
            aria-label="send a soft kiss invite"
          >
            💗 invite
          </button>
        </div>

        <div className="relative mt-3 text-[11px] text-muted leading-relaxed">
          no presence, no read receipts, no last-seen. only the things either of
          you chooses to send — and every share fades on its own.
        </div>
      </section>

      <a href="/connect#prompt" className="card flex items-center gap-3 tap">
        <div className="h-10 w-10 grid place-items-center rounded-2xl bg-gradient-to-br from-ember/30 to-spark/30">
          <span aria-hidden>✨</span>
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-muted">today's prompt</div>
          <div className="text-ink/95 text-balance">{prompt.text}</div>
        </div>
        <span className="text-muted">›</span>
      </a>

      <StreakStrip />
      <PhotoWall />

      {sheetOpen ? <ShareSheet onClose={() => setSheetOpen(false)} /> : null}
    </div>
  );
}

function Header() {
  const today = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="pt-1">
      <div className="text-[11px] uppercase tracking-[.22em] text-muted">{today}</div>
      <h1 className="serif text-[40px] leading-none mt-1">
        <span className="ember-text">Ember</span>
      </h1>
      <p className="text-muted text-sm mt-1">a soft place to land for the two of you.</p>
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

function SharePreview({
  share,
  who,
}: {
  share: import("@/lib/store").Share;
  who: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-black/40 border border-white/10">
      {share.kind === "photo" && share.data ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={share.data} alt={share.caption ?? ""} className="w-full aspect-[4/3] object-cover" />
      ) : share.kind === "doodle" && share.data ? (
        <div className="aspect-[4/3] grid place-items-center bg-gradient-to-br from-violet/40 to-spark/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={share.data} alt="doodle" className="max-h-full max-w-full" />
        </div>
      ) : share.kind === "status" ? (
        <div className="flex items-center gap-4 p-5">
          <div className="text-4xl">{share.emoji ?? "✨"}</div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted">
              {who} chose to share
            </div>
            <div className="serif text-2xl">{share.label}</div>
          </div>
        </div>
      ) : (
        <div className="p-5 flex items-start gap-3">
          {share.emoji ? <div className="text-2xl">{share.emoji}</div> : null}
          <div className="serif italic text-lg text-balance">
            {share.caption || share.label}
          </div>
        </div>
      )}
      <div className="px-3 py-2 text-[11px] text-muted flex items-center justify-between">
        <span>shared {agoLabel(share.createdAt)}</span>
        <span>{untilLabel(share.expiresAt)}</span>
      </div>
    </div>
  );
}

function QuietToggle({ quiet, until }: { quiet: boolean; until: number | null }) {
  const [open, setOpen] = useState(false);
  if (quiet) {
    return (
      <button
        onClick={() => store.endQuiet()}
        className="flex flex-col items-end text-[11px] text-muted tap"
        aria-label="end quiet hours"
      >
        <div className="h-9 w-9 rounded-full grid place-items-center bg-edge">
          <span aria-hidden>🌙</span>
        </div>
        <div className="mt-1">
          until {until ? new Date(until).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </div>
      </button>
    );
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-9 w-9 rounded-full grid place-items-center bg-black/40 border border-white/10 tap"
        aria-label="go quiet"
      >
        <span aria-hidden>🌙</span>
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl glass p-2 z-10">
          <div className="text-[11px] uppercase tracking-wider text-muted px-2 pt-1 pb-1.5">
            go quiet for…
          </div>
          {[1, 4, 12].map((h) => (
            <button
              key={h}
              onClick={() => {
                store.goQuiet(h);
                setOpen(false);
              }}
              className="block w-full text-left px-2 py-1.5 rounded-xl hover:bg-edge text-sm"
            >
              {h} hour{h > 1 ? "s" : ""}
            </button>
          ))}
          <div className="text-[11px] text-muted px-2 pt-1.5">
            we pause everything in both directions. no notifications go out.
          </div>
        </div>
      ) : null}
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
  const photos = s.memories.filter((m) => m.kind === "photo" && m.data);
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
            <img src={p.data} alt={p.title} className="w-full h-40 object-cover" />
            <div className="p-2 text-[11px] text-muted truncate">{p.title}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
