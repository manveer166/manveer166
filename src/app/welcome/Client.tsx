"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Flame from "@/components/Flame";
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

type Step = 0 | 1 | 2 | 3;

export default function WelcomeClient() {
  const s = useEmberStore();
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [you, setYou] = useState({
    name: s.you?.name ?? "",
    emoji: s.you?.emoji ?? "🔥",
    color: s.you?.color ?? COLORS[0],
  });
  const [partner, setPartner] = useState({
    name: s.partner?.name ?? "",
    emoji: s.partner?.emoji ?? "🌙",
    color: s.partner?.color ?? COLORS[1],
  });

  // If already paired, jump straight in.
  useEffect(() => {
    if (s.hasPaired) router.replace("/");
  }, [s.hasPaired, router]);

  function next() {
    setStep((n) => Math.min(3, n + 1) as Step);
  }
  function back() {
    setStep((n) => Math.max(0, n - 1) as Step);
  }
  function done() {
    if (!you.name.trim() || !partner.name.trim()) return;
    const code = makeCode();
    store.pair(you, partner, code);
    router.replace("/");
  }

  return (
    <div className="min-h-[100dvh] flex flex-col py-2">
      <Dots step={step} />

      <div className="flex-1 mt-2">
        {step === 0 ? <StepIntro /> : null}
        {step === 1 ? <StepPrivacy /> : null}
        {step === 2 ? (
          <StepPair
            you={you}
            partner={partner}
            setYou={setYou}
            setPartner={setPartner}
          />
        ) : null}
        {step === 3 ? <StepConsent you={you} partner={partner} /> : null}
      </div>

      <div className="pt-4 flex gap-2">
        {step > 0 ? (
          <button className="btn btn-ghost flex-1" onClick={back}>
            back
          </button>
        ) : null}
        {step < 3 ? (
          <button
            className="btn btn-primary flex-1"
            onClick={next}
            disabled={step === 2 && (!you.name.trim() || !partner.name.trim())}
          >
            {step === 0 ? "begin" : step === 1 ? "got it" : "looks good"}
          </button>
        ) : (
          <button className="btn btn-primary flex-1" onClick={done}>
            light the flame
          </button>
        )}
      </div>
    </div>
  );
}

function Dots({ step }: { step: Step }) {
  return (
    <div className="flex justify-center gap-2 pt-1">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={clsx(
            "h-1.5 rounded-full transition-all",
            i === step ? "w-8 bg-ember" : "w-2 bg-edge",
          )}
        />
      ))}
    </div>
  );
}

function StepIntro() {
  return (
    <section className="flex flex-col items-center text-center pt-10 px-2">
      <Flame size={140} intense />
      <h1 className="serif text-[44px] leading-none mt-6">
        <span className="ember-text">Ember</span>
      </h1>
      <p className="serif italic text-xl text-ink/80 mt-3 text-balance">
        a soft place to land for the two of you.
      </p>
      <p className="text-muted mt-4 text-sm max-w-xs text-balance">
        one minute a day. one small share. no feeds, no scrolling, no people you
        don't know.
      </p>
    </section>
  );
}

function StepPrivacy() {
  return (
    <section className="pt-6 px-1">
      <div className="text-[11px] uppercase tracking-[.22em] text-muted">our promise</div>
      <h2 className="serif text-3xl mt-1">
        nothing about you is shared <em className="ember-text">unless you send it.</em>
      </h2>
      <p className="text-muted text-sm mt-3 text-balance">
        most couples apps drift toward "are they online", "did they read this",
        "where are they". we made that impossible by design.
      </p>

      <ul className="mt-5 space-y-2">
        <Rule
          title="no presence"
          body="no online dot. no &quot;is here&quot;. no green/grey circle."
        />
        <Rule
          title="no last-seen"
          body="we never show when either of you last opened the app."
        />
        <Rule
          title="no read receipts"
          body="they'll never know whether you saw something."
        />
        <Rule
          title="everything fades"
          body="every share has an expiry you pick. nothing piles up."
        />
        <Rule
          title="one-tap quiet"
          body="pause both directions for a few hours. no explanation owed."
        />
      </ul>
    </section>
  );
}

function Rule({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-edge bg-black/30 p-3">
      <span className="text-ember mt-0.5">✓</span>
      <div>
        <div className="text-ink text-sm font-medium">{title}</div>
        <div className="text-muted text-xs mt-0.5">{body}</div>
      </div>
    </li>
  );
}

function StepPair({
  you,
  partner,
  setYou,
  setPartner,
}: {
  you: { name: string; emoji: string; color: string };
  partner: { name: string; emoji: string; color: string };
  setYou: (v: typeof you) => void;
  setPartner: (v: typeof partner) => void;
}) {
  return (
    <section className="pt-6 px-1 space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-[.22em] text-muted">just two names</div>
        <h2 className="serif text-3xl mt-1">
          who is your <em className="ember-text">spark?</em>
        </h2>
      </div>

      <div className="card space-y-3">
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
      </div>

      <div className="card space-y-3">
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
      </div>

      <p className="text-xs text-muted text-center">
        no accounts, no email, no phone number. just you two.
      </p>
    </section>
  );
}

function StepConsent({
  you,
  partner,
}: {
  you: { name: string; emoji: string; color: string };
  partner: { name: string; emoji: string; color: string };
}) {
  return (
    <section className="pt-6 px-1 text-center">
      <div className="flex items-center justify-center -space-x-3">
        <Avatar name={you.name} emoji={you.emoji} color={you.color} size={72} />
        <Avatar name={partner.name} emoji={partner.emoji} color={partner.color} size={72} ring />
      </div>
      <h2 className="serif text-3xl mt-5 text-balance">
        {you.name} & {partner.name},{" "}
        <span className="ember-text">your flame is ready.</span>
      </h2>
      <p className="text-muted text-sm mt-3 max-w-xs mx-auto text-balance">
        a tiny check-in every day keeps it lit. you can stop any time and the
        app forgets cleanly — there's no cloud holding your data hostage.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Pill>🌙 quiet</Pill>
        <Pill>⏳ fades</Pill>
        <Pill>🔒 local</Pill>
      </div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-edge bg-black/30 py-3 text-sm">
      {children}
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
