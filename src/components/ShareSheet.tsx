"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import {
  SHARE_DURATIONS,
  STATUS_PRESETS,
  store,
  useEmberStore,
} from "@/lib/store";

type Tab = "status" | "photo" | "doodle" | "note";

export default function ShareSheet({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("status");
  const [duration, setDuration] = useState(SHARE_DURATIONS[1]); // 1h default
  const s = useEmberStore();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[540px] glass rounded-t-3xl p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[.22em] text-muted">share now</div>
            <div className="serif italic text-2xl">
              one moment, on your terms.
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost text-sm">
            close
          </button>
        </div>

        {/* tabs */}
        <div className="flex gap-2 overflow-x-auto scroll-x">
          {(["status", "photo", "doodle", "note"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm capitalize whitespace-nowrap border tap",
                tab === t
                  ? "bg-ink text-black border-ink"
                  : "bg-black/30 border-edge text-muted",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* duration */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted mb-1.5">
            fades after
          </div>
          <div className="flex gap-2">
            {SHARE_DURATIONS.map((d) => (
              <button
                key={d.label}
                onClick={() => setDuration(d)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-sm border tap",
                  duration.ms === d.ms
                    ? "border-ember bg-gradient-to-br from-ember2/30 to-spark/30 text-ink"
                    : "border-edge bg-black/30 text-muted",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* body */}
        <div className="pt-1">
          {tab === "status" ? (
            <StatusTab durationMs={duration.ms} onDone={onClose} />
          ) : tab === "photo" ? (
            <PhotoTab durationMs={duration.ms} onDone={onClose} />
          ) : tab === "doodle" ? (
            <DoodleTab durationMs={duration.ms} onDone={onClose} />
          ) : (
            <NoteTab durationMs={duration.ms} onDone={onClose} />
          )}
        </div>

        <div className="pt-1 text-[11px] text-muted text-center">
          {s.partner?.name ? `${s.partner.name} ` : "they "}sees nothing until
          you send. it disappears on its own.
        </div>
      </div>
    </div>
  );
}

function StatusTab({ durationMs, onDone }: { durationMs: number; onDone: () => void }) {
  const [picked, setPicked] = useState<{ emoji: string; label: string } | null>(null);
  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {STATUS_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setPicked(p)}
            className={clsx(
              "rounded-2xl border p-3 flex flex-col items-center gap-1 tap",
              picked?.label === p.label
                ? "border-ember bg-gradient-to-br from-ember2/30 to-spark/30"
                : "border-edge bg-black/30",
            )}
          >
            <span className="text-2xl">{p.emoji}</span>
            <span className="text-[11px] text-ink/90 text-center leading-tight">
              {p.label}
            </span>
          </button>
        ))}
      </div>
      <button
        disabled={!picked}
        className="btn btn-primary w-full mt-3"
        onClick={() => {
          if (!picked) return;
          store.share({
            kind: "status",
            emoji: picked.emoji,
            label: picked.label,
            ms: durationMs,
          });
          onDone();
        }}
      >
        share status
      </button>
    </div>
  );
}

function PhotoTab({ durationMs, onDone }: { durationMs: number; onDone: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(f);
  }
  return (
    <div>
      {preview ? (
        <div className="rounded-2xl overflow-hidden border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="w-full max-h-72 object-cover" />
          <div className="p-3 space-y-2">
            <input
              className="input"
              placeholder="a short note (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={80}
            />
            <div className="flex gap-2">
              <button className="btn btn-ghost flex-1" onClick={() => setPreview(null)}>
                redo
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={() => {
                  store.share({
                    kind: "photo",
                    data: preview!,
                    caption: caption.trim() || undefined,
                    ms: durationMs,
                  });
                  onDone();
                }}
              >
                send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="w-full rounded-2xl border border-dashed border-white/15 bg-black/20 py-8 text-muted hover:text-ink hover:border-ember/60 transition"
          onClick={() => fileRef.current?.click()}
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
    </div>
  );
}

function DoodleTab({ durationMs, onDone }: { durationMs: number; onDone: () => void }) {
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

  return (
    <div>
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-panel2">
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
      <div className="flex gap-2 mt-3">
        <button className="btn btn-ghost flex-1" onClick={() => setPaths([])}>
          clear
        </button>
        <button
          className="btn btn-primary flex-1"
          disabled={paths.length === 0}
          onClick={() => {
            const all = [...paths, cur].filter(Boolean);
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 220"><rect width="300" height="220" fill="#1a1722"/>${all
              .map(
                (d) =>
                  `<path d="${d}" stroke="#ff4d8d" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
              )
              .join("")}</svg>`;
            const data = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
            store.share({ kind: "doodle", data, ms: durationMs });
            onDone();
          }}
        >
          send
        </button>
      </div>
    </div>
  );
}

function NoteTab({ durationMs, onDone }: { durationMs: number; onDone: () => void }) {
  const [text, setText] = useState("");
  return (
    <div>
      <textarea
        className="textarea"
        rows={4}
        placeholder="one line, off the top of your head."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={140}
      />
      <button
        className="btn btn-primary w-full mt-2"
        disabled={!text.trim()}
        onClick={() => {
          store.share({ kind: "note", caption: text.trim(), ms: durationMs });
          onDone();
        }}
      >
        send note
      </button>
    </div>
  );
}
