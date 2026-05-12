"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { store, useEmberStore } from "@/lib/store";

const COLORS = [
  "linear-gradient(135deg, #ffd089, #ff7a45 55%, #ff4d8d)",
  "linear-gradient(135deg, #c4b5fd, #8b5cf6 55%, #4338ca)",
  "linear-gradient(135deg, #99f6e4, #14b8a6 55%, #0f766e)",
  "linear-gradient(135deg, #fde68a, #f59e0b 55%, #b45309)",
  "linear-gradient(135deg, #fecaca, #ef4444 55%, #7f1d1d)",
];

const EMOJIS = ["🔥", "🌙", "🌸", "☕️", "🌊", "🌻", "🍓", "🪐", "🦊", "💌"];

export default function SettingsClient() {
  const s = useEmberStore();
  const [you, setYou] = useState({ name: s.you?.name ?? "", emoji: s.you?.emoji ?? "🔥", color: s.you?.color ?? COLORS[0] });
  const [partner, setPartner] = useState({
    name: s.partner?.name ?? "",
    emoji: s.partner?.emoji ?? "🌙",
    color: s.partner?.color ?? COLORS[1],
  });
  const [code, setCode] = useState(s.pairCode ?? "");

  useEffect(() => {
    if (s.you) setYou({ name: s.you.name, emoji: s.you.emoji, color: s.you.color });
    if (s.partner) setPartner({ name: s.partner.name, emoji: s.partner.emoji, color: s.partner.color });
    if (s.pairCode) setCode(s.pairCode);
  }, [s.you, s.partner, s.pairCode]);

  function save() {
    if (!you.name.trim() || !partner.name.trim()) return;
    const c = code.trim() || makeCode();
    store.pair(you, partner, c);
    setCode(c);
  }

  return (
    <div className="space-y-5 pt-2">
      <div>
        <div className="text-[11px] uppercase tracking-[.22em] text-muted">you & them</div>
        <h1 className="serif text-3xl">
          your <em className="ember-text">pair</em>
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
      <section className="card space-y-3">
        <div className="flex items-center gap-3">
          <Avatar name={you.name} emoji={you.emoji} color={you.color} size={56} />
          <div className="flex-1">
            <div className="label">your name</div>
            <input
              className="input"
              placeholder="you"
              value={you.name}
              onChange={(e) => setYou({ ...you, name: e.target.value })}
              maxLength={24}
            />
          </div>
        </div>
        <Picker
          emoji={you.emoji}
          color={you.color}
          onEmoji={(e) => setYou({ ...you, emoji: e })}
          onColor={(c) => setYou({ ...you, color: c })}
        />
      </section>

      <section className="card space-y-3">
        <div className="flex items-center gap-3">
          <Avatar name={partner.name} emoji={partner.emoji} color={partner.color} size={56} />
          <div className="flex-1">
            <div className="label">their name</div>
            <input
              className="input"
              placeholder="them"
              value={partner.name}
              onChange={(e) => setPartner({ ...partner, name: e.target.value })}
              maxLength={24}
            />
          </div>
        </div>
        <Picker
          emoji={partner.emoji}
          color={partner.color}
          onEmoji={(e) => setPartner({ ...partner, emoji: e })}
          onColor={(c) => setPartner({ ...partner, color: c })}
        />
      </section>
      </div>

      <section className="card">
        <div className="label">pair code</div>
        <div className="flex gap-2">
          <input
            className="input font-mono tracking-widest text-center"
            value={code}
            placeholder="auto-generate"
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
          />
          <button className="btn btn-ghost" onClick={() => setCode(makeCode())}>
            new
          </button>
        </div>
        <p className="text-xs text-muted mt-2">
          share this with them so you both see the same flame. (in this preview, the partner side is
          simulated — pairing is local.)
        </p>
      </section>

      <button className="btn btn-primary w-full" onClick={save}>
        {s.hasPaired ? "save" : "start our flame"}
      </button>

      <section className="card space-y-3">
        <div>
          <div className="font-semibold">Privacy</div>
          <div className="text-xs text-muted">
            we never share presence, last-seen, or read receipts. these are the
            only two things ever sent — both off-switch any time.
          </div>
        </div>
        <Toggle
          label="share moments to their widget"
          sub="status, photo, doodle, note — each fades after the time you pick."
          on={s.sharePrefs.allowShares}
          onChange={(v) => store.updatePrefs({ allowShares: v })}
        />
        <Toggle
          label="soft kiss invites"
          sub="a quiet 💗 they can tap back to — never a buzzer."
          on={s.sharePrefs.allowKisses}
          onChange={(v) => store.updatePrefs({ allowKisses: v })}
        />
        <div className="rounded-2xl border border-edge bg-black/30 p-3 text-xs text-muted space-y-1">
          <div>presence broadcasting <span className="text-ink/70">off — always</span></div>
          <div>last-seen <span className="text-ink/70">off — always</span></div>
          <div>read receipts <span className="text-ink/70">off — always</span></div>
        </div>
      </section>

      {s.hasPaired ? (
        <button
          className="btn btn-ghost w-full text-bad"
          onClick={() => {
            if (confirm("Unpair and wipe all local data?")) store.unpair();
          }}
        >
          unpair & wipe data
        </button>
      ) : null}
    </div>
  );
}

function Picker({
  emoji,
  color,
  onEmoji,
  onColor,
}: {
  emoji: string;
  color: string;
  onEmoji: (e: string) => void;
  onColor: (c: string) => void;
}) {  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 overflow-x-auto scroll-x">
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => onEmoji(e)}
            className={
              "h-9 w-9 rounded-full grid place-items-center shrink-0 border " +
              (e === emoji ? "border-ember bg-black/40" : "border-edge bg-black/20")
            }
          >
            <span>{e}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto scroll-x">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColor(c)}
            className={
              "h-9 w-9 rounded-full shrink-0 border " +
              (c === color ? "border-white" : "border-transparent")
            }
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  sub,
  on,
  onChange,
}: {
  label: string;
  sub?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="w-full flex items-start gap-3 text-left tap"
    >
      <div className="flex-1">
        <div className="text-sm text-ink">{label}</div>
        {sub ? <div className="text-xs text-muted mt-0.5">{sub}</div> : null}
      </div>
      <div
        className={
          "shrink-0 h-6 w-11 rounded-full p-0.5 transition " +
          (on ? "bg-gradient-to-r from-ember2 to-spark" : "bg-edge")
        }
      >
        <div
          className={
            "h-5 w-5 rounded-full bg-white transition " +
            (on ? "translate-x-5" : "translate-x-0")
          }
        />
      </div>
    </button>
  );
}

function makeCode() {
  const a = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}
