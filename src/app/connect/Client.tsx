"use client";

import { useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { store, useEmberStore } from "@/lib/store";
import { CHALLENGES, promptForToday } from "@/lib/prompts";
import Flame from "@/components/Flame";

export default function ConnectClient() {
  const s = useEmberStore();
  const prompt = useMemo(promptForToday, []);
  const today = new Date().toISOString().slice(0, 10);
  const answered = s.prompts.find((p) => p.promptId === prompt.id && p.date === today);

  return (
    <div className="space-y-5 pt-2">
      <div>
        <div className="text-[11px] uppercase tracking-[.22em] text-muted">connect</div>
        <h1 className="serif text-3xl">
          fun things for <em className="ember-text">the two of you</em>
        </h1>
      </div>

      <section id="prompt" className="card">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ember animate-pulse2" />
          today's prompt
        </div>
        <p className="serif italic text-2xl mt-2 text-balance">{prompt.text}</p>
        <PromptAnswer prompt={prompt} answered={answered} />
      </section>

      <PhotoToWidget />

      <Doodle />

      <section>
        <h3 className="font-semibold mb-2 px-1">Arcade</h3>
        <div className="grid grid-cols-2 gap-3">
          <GameCard
            title="Who's more likely"
            sub="fast-paced Q&A"
            grad="from-spark/70 to-ember/70"
            href="#wml"
          />
          <GameCard
            title="Truth tap"
            sub="reveal one thing"
            grad="from-violet/70 to-sky/40"
            href="#truth"
          />
          <GameCard
            title="20 questions"
            sub="guess what they're thinking"
            grad="from-ember/70 to-ember2/70"
            href="#twenty"
          />
          <GameCard
            title="Bucket list"
            sub="add one, share later"
            grad="from-sky/40 to-violet/60"
            href="#bucket"
          />
        </div>
      </section>

      <WhoIsMoreLikely />
      <BucketList />
      <ChallengesShelf />

      <CheckInButton />
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
            "waiting on them…"
          ) : (
            "saved privately until they answer too"
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

function PhotoToWidget() {
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function pick() {
    fileRef.current?.click();
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(f);
  }
  function send() {
    if (!preview) return;
    store.addWidget({ kind: "photo", from: "you", data: preview, caption: caption.trim() || undefined });
    store.checkIn();
    setPreview(null);
    setCaption("");
  }
  return (
    <section className="card">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-spark to-violet grid place-items-center text-xl">📸</div>
        <div className="flex-1">
          <div className="font-semibold">Send to their widget</div>
          <div className="text-sm text-muted">a photo or doodle lands right on their phone.</div>
        </div>
      </div>

      {preview ? (
        <div className="mt-3 rounded-2xl overflow-hidden border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="w-full max-h-80 object-cover" />
          <div className="p-3 space-y-2">
            <input
              className="input"
              placeholder="add a tiny caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={80}
            />
            <div className="flex gap-2">
              <button className="btn btn-ghost flex-1" onClick={() => setPreview(null)}>
                cancel
              </button>
              <button className="btn btn-primary flex-1" onClick={send}>
                send to their widget
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="mt-3 w-full rounded-2xl border border-dashed border-white/15 bg-black/20 py-6 text-muted hover:text-ink hover:border-ember/60 transition"
          onClick={pick}
        >
          tap to pick a photo
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />
    </section>
  );
}

function Doodle() {
  const ref = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [cur, setCur] = useState<string>("");
  const drawing = useRef(false);

  function pt(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 300;
    const y = ((e.clientY - r.top) / r.height) * 220;
    return { x, y };
  }
  function down(e: React.PointerEvent) {
    drawing.current = true;
    const { x, y } = pt(e);
    setCur(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const { x, y } = pt(e);
    setCur((c) => `${c} L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  function up() {
    if (!drawing.current) return;
    drawing.current = false;
    if (cur) setPaths((p) => [...p, cur]);
    setCur("");
  }
  function clear() {
    setPaths([]);
    setCur("");
  }
  function send() {
    if (paths.length === 0 && !cur) return;
    const all = [...paths, cur].filter(Boolean);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 220">
      <rect width="300" height="220" fill="#1a1722"/>
      ${all.map((d) => `<path d="${d}" stroke="#ff4d8d" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}
    </svg>`;
    const data = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    store.addWidget({ kind: "doodle", from: "you", data, caption: "doodle" });
    store.checkIn();
    clear();
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Doodle to widget</div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={clear}>
            clear
          </button>
          <button className="btn btn-primary" onClick={send} disabled={paths.length === 0}>
            send
          </button>
        </div>
      </div>
      <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-panel2">
        <svg
          ref={ref}
          viewBox="0 0 300 220"
          className="w-full aspect-[300/220] touch-none"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        >
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              stroke="#ff4d8d"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {cur ? (
            <path d={cur} stroke="#ff4d8d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          ) : null}
        </svg>
      </div>
    </section>
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
