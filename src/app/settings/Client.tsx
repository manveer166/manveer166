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
}) {
  return (
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

function makeCode() {
  const a = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}
