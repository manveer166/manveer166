"use client";
import { useState } from "react";

export default function WeeklyDigest() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    setText("");
    try {
      const res = await fetch("/api/digest", { method: "POST" });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Weekly summary</h2>
        <button className="btn btn-primary" onClick={run} disabled={busy}>
          {busy ? "Generating…" : text ? "Regenerate" : "Generate"}
        </button>
      </div>
      <p className="text-xs text-muted mb-3">
        Claude looks at your last 7 days of vitals, food, and any recent records, then tells you
        what changed and what to watch.
      </p>
      {err && <p className="text-bad text-sm">{err}</p>}
      {text && (
        <div className="whitespace-pre-wrap text-sm border border-edge rounded-lg p-4 bg-[#0e1116]">
          {text}
        </div>
      )}
    </section>
  );
}
