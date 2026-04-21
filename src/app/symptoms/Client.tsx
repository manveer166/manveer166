"use client";
import { useState, useTransition } from "react";
import type { SymptomRow } from "@/lib/db";

const empty = {
  description: "",
  severity: 3,
  mood: 3,
  notes: "",
  occurred_at: "",
};

const MOOD_LABELS = ["😞", "😕", "😐", "🙂", "😄"];

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function SymptomsClient({ initial }: { initial: SymptomRow[] }) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState(empty);
  const [pending, start] = useTransition();

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return;
    start(async () => {
      const row = (await api("/api/symptoms", "POST", {
        description: form.description.trim(),
        severity: form.severity,
        mood: form.mood,
        notes: form.notes || null,
        occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : new Date().toISOString(),
      })) as SymptomRow;
      setItems([row, ...items]);
      setForm(empty);
    });
  }

  async function remove(id: string) {
    await api(`/api/symptoms/${id}`, "DELETE");
    setItems(items.filter((s) => s.id !== id));
  }

  const sevColor = (s: number | null) =>
    s == null ? "text-muted" : s >= 7 ? "text-bad" : s >= 4 ? "text-warn" : "text-good";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Symptoms</h1>
      <p className="text-sm text-muted mb-6">
        Severity 0 (none) to 10 (worst), mood 1 (bad) to 5 (great).
      </p>

      <form onSubmit={add} className="card mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">What's going on?</label>
          <input
            required
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Dull headache behind right eye"
          />
        </div>
        <div>
          <label className="label">Severity: {form.severity}</label>
          <input
            type="range"
            min={0}
            max={10}
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="label">
            Mood: {MOOD_LABELS[form.mood - 1]} ({form.mood}/5)
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={form.mood}
            onChange={(e) => setForm({ ...form, mood: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="label">When</label>
          <input
            type="datetime-local"
            className="input"
            value={form.occurred_at}
            onChange={(e) => setForm({ ...form, occurred_at: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Notes</label>
          <input
            className="input"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <button className="btn btn-primary sm:col-span-2 justify-center" disabled={pending}>
          {pending ? "Saving…" : "Log symptom"}
        </button>
      </form>

      <div className="space-y-2">
        {items.length === 0 && <p className="text-muted text-sm">No symptoms logged yet.</p>}
        {items.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`pill ${sevColor(s.severity)}`}>
                    severity {s.severity ?? "—"}/10
                  </span>
                  {s.mood != null && (
                    <span className="pill">
                      mood {MOOD_LABELS[s.mood - 1]} {s.mood}/5
                    </span>
                  )}
                  <span className="text-xs text-muted">
                    {new Date(s.occurred_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{s.description}</p>
                {s.notes && <p className="text-xs text-muted mt-1">{s.notes}</p>}
              </div>
              <button className="btn" onClick={() => remove(s.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
