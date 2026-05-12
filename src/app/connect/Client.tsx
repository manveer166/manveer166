"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { store, useEmberStore } from "@/lib/store";
import { CHALLENGES, promptForToday } from "@/lib/prompts";
import Flame from "@/components/Flame";
import ShareSheet from "@/components/ShareSheet";

export default function ConnectClient() {
  const s = useEmberStore();
  const prompt = useMemo(promptForToday, []);
  const today = new Date().toISOString().slice(0, 10);
  const answered = s.prompts.find((p) => p.promptId === prompt.id && p.date === today);
  const [sheet, setSheet] = useState(false);

  return (
    <div className="space-y-5 pt-2">
      <div>
        <div className="text-[11px] uppercase tracking-[.22em] text-muted">connect</div>
        <h1 className="serif text-3xl">
          things to do <em className="ember-text">together</em>
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <GratitudeCard />

        <section id="prompt" className="card">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ember animate-pulse2" />
          today's prompt
        </div>
        <p className="serif italic text-2xl mt-2 text-balance">{prompt.text}</p>
        <PromptAnswer prompt={prompt} answered={answered} />
      </section>

      </div>

      <button
        className="w-full card flex items-center gap-3 tap"
        onClick={() => setSheet(true)}
      >
        <div className="h-12 w-12 rounded-2xl grid place-items-center bg-gradient-to-br from-ember2/40 via-ember/40 to-spark/40 text-2xl">
          ✨
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold">Share something</div>
          <div className="text-sm text-muted">
            status, photo, doodle, or note — fades on its own.
          </div>
        </div>
        <span className="text-muted">›</span>
      </button>

      <section>
        <h3 className="font-semibold mb-2 px-1">Arcade</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GameCard title="Who's more likely" sub="fast-paced Q&A" grad="from-spark/70 to-ember/70" href="#wml" />
          <GameCard title="Truth tap" sub="reveal one thing" grad="from-violet/70 to-sky/40" href="#truth" />
          <GameCard title="20 questions" sub="guess what they're thinking" grad="from-ember/70 to-ember2/70" href="#twenty" />
          <GameCard title="Bucket list" sub="add one, share later" grad="from-sky/40 to-violet/60" href="#bucket" />
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <WhoIsMoreLikely />
        <BucketList />
      </div>
      <ChallengesShelf />

      <CheckInButton />

      {sheet ? <ShareSheet onClose={() => setSheet(false)} /> : null}
    </div>
  );
}

function PromptAnswer({
  prompt,
  answered,
}: {
  prompt: { id: string; text: string };
  answered?: { answerYou?: string; answerPartner?: string };
}) {
  const [text, setText] = useState(answered?.answerYou ?? "");
  const [saved, setSaved] = useState(!!answered?.answerYou);
  return (
    <div className="mt-4">
      <textarea
        className="textarea"
        placeholder="say what you'd say to them…"
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
      />
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-muted">
          {answered?.answerPartner ? (
            <span>
              they said: <em className="text-ink/90 serif">“{answered.answerPartner}”</em>
            </span>
          ) : saved ? (
            "saved — only sent when they answer too"
          ) : (
            "stays private until they answer too"
          )}
        </div>
        <button
          className="btn btn-primary"
          disabled={!text.trim()}
          onClick={() => {
            store.answerPrompt(prompt.id, prompt.text, text.trim());
            setSaved(true);
          }}
        >
          {saved ? "update" : "send"}
        </button>
      </div>
    </div>
  );
}

function GameCard({
  title,
  sub,
  grad,
  href,
}: {
  title: string;
  sub: string;
  grad: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className={clsx(
        "rounded-3xl p-4 aspect-[1.2/1] flex flex-col justify-between bg-gradient-to-br border border-white/10 tap",
        grad,
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-white/80">Play</div>
      <div>
        <div className="font-semibold text-white text-lg leading-tight">{title}</div>
        <div className="text-white/80 text-xs">{sub}</div>
      </div>
    </a>
  );
}

const WML_QUESTIONS = [
  "Who's more likely to set 15 alarms and sleep through all of them?",
  "Who's more likely to text back instantly?",
  "Who's more likely to cry at a Pixar movie?",
  "Who's more likely to lose their keys?",
  "Who's more likely to overpack for a weekend trip?",
  "Who's more likely to take a 2-hour shower?",
  "Who's more likely to say 'just one more episode'?",
  "Who's more likely to befriend the waiter?",
];

function WhoIsMoreLikely() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<"you" | "them" | null>(null);
  const s = useEmberStore();
  const q = WML_QUESTIONS[i % WML_QUESTIONS.length];

  return (
    <section id="wml" className="card">
      <div className="text-[11px] uppercase tracking-wider text-muted">who's more likely</div>
      <p className="serif text-2xl mt-2 leading-tight text-balance">{q}</p>
      <div className="flex gap-2 mt-4">
        <button
          className={clsx("btn flex-1", pick === "you" ? "btn-primary" : "btn-ghost")}
          onClick={() => setPick("you")}
        >
          {s.you?.name || "you"}
        </button>
        <button
          className={clsx("btn flex-1", pick === "them" ? "btn-primary" : "btn-ghost")}
          onClick={() => setPick("them")}
        >
          {s.partner?.name || "them"}
        </button>
      </div>
      <div className="flex justify-between mt-3 items-center text-sm text-muted">
        <button
          className="text-ink/80"
          onClick={() => {
            setPick(null);
            setI((n) => n + 1);
          }}
        >
          next →
        </button>
        <span>{pick ? "saved" : "tap one"}</span>
      </div>
    </section>
  );
}

function BucketList() {
  const s = useEmberStore();
  const [text, setText] = useState("");
  const items = s.memories.filter((m) => m.kind === "milestone");
  return (
    <section id="bucket" className="card">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Bucket list</div>
        <span className="pill">{items.length} added</span>
      </div>
      <div className="flex gap-2 mt-3">
        <input
          className="input"
          placeholder="e.g. cherry blossoms in Tokyo"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!text.trim()) return;
            store.addMemory({ kind: "milestone", title: text.trim() });
            store.checkIn();
            setText("");
          }}
        >
          add
        </button>
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {items.slice(0, 5).map((m) => (
            <li key={m.id} className="text-sm text-ink/90 flex items-center gap-2">
              <span className="text-ember">○</span>
              <span className="flex-1">{m.title}</span>
              <button
                className="text-muted text-xs"
                onClick={() => store.removeMemory(m.id)}
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ChallengesShelf() {
  return (
    <section>
      <h3 className="font-semibold mb-2 px-1">Daily challenges</h3>
      <div className="flex gap-3 overflow-x-auto scroll-x pb-2">
        {CHALLENGES.map((c, i) => (
          <div
            key={i}
            className="shrink-0 w-64 rounded-3xl p-4 border border-white/10 bg-gradient-to-br from-violet/30 to-spark/30"
          >
            <div className="text-[10px] uppercase tracking-wider text-white/70">Challenge</div>
            <p className="serif text-lg mt-1 leading-tight text-balance">{c}</p>
            <button
              className="btn btn-ghost mt-3 text-xs"
              onClick={() => store.addMemory({ kind: "challenge", title: c })}
            >
              save for later
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function GratitudeCard() {
  const s = useEmberStore();
  const today = new Date().toISOString().slice(0, 10);
  const existing = s.memories.find(
    (m) => m.kind === "gratitude" && m.date === today,
  );
  const [text, setText] = useState(existing?.body ?? "");
  const [aboutPartner, setAboutPartner] = useState(!!existing?.aboutPartner);
  const [doShare, setDoShare] = useState(false);

  if (existing) {
    return (
      <section className="card">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
          <span aria-hidden>🙏</span>
          today's gratitude
        </div>
        <p className="serif italic text-xl mt-2 text-balance">“{existing.body}”</p>
        <div className="text-xs text-muted mt-2">
          saved {existing.aboutPartner ? "(about them)" : "(for yourself)"} ·
          you can add another tomorrow.
        </div>
        <a href="/memories#gratitude" className="text-sm text-ember mt-3 inline-block">
          open the gratitude jar →
        </a>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
        <span aria-hidden>🙏</span>
        one gratitude
      </div>
      <p className="serif italic text-lg mt-2 text-balance text-ink/90">
        one thing you're glad about today — small is fine.
      </p>
      <textarea
        className="textarea mt-3"
        rows={2}
        maxLength={140}
        placeholder="the way the morning light hit the kitchen…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink/85">
          <input
            type="checkbox"
            checked={aboutPartner}
            onChange={(e) => setAboutPartner(e.target.checked)}
          />
          <span>about them</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-ink/85">
          <input
            type="checkbox"
            checked={doShare}
            onChange={(e) => setDoShare(e.target.checked)}
            disabled={!s.sharePrefs.allowShares}
          />
          <span>share with them for 24h</span>
        </label>
      </div>
      <button
        className="btn btn-primary mt-3 w-full"
        disabled={!text.trim()}
        onClick={() => {
          store.addGratitude(text, { aboutPartner, share: doShare });
          setText("");
          setDoShare(false);
        }}
      >
        save
      </button>
      <div className="text-[11px] text-muted mt-2">
        kept private unless you tick "share". counts toward your flame either way.
      </div>
    </section>
  );
}

function CheckInButton() {
  const s = useEmberStore();
  const today = new Date().toISOString().slice(0, 10);
  const done = s.lastCheckinDate === today;
  return (
    <button
      className={clsx("w-full rounded-3xl p-4 text-left tap", done ? "card" : "btn-primary text-black")}
      onClick={() => store.checkIn()}
    >
      <div className="flex items-center gap-3">
        <Flame size={36} intense={!done} />
        <div className="flex-1">
          <div className="font-semibold">{done ? "today is locked in" : "tap to keep your flame"}</div>
          <div className={clsx("text-sm", done ? "text-muted" : "text-black/70")}>
            {s.flameDays} day streak {done ? "secured" : "— one tap to add today"}
          </div>
        </div>
      </div>
    </button>
  );
}
