"use client";
import { useState, useTransition } from "react";
import type { Medication, Dose } from "@/lib/db";

const empty = {
  name: "",
  dosage: "",
  schedule: "",
  benefits: "",
  side_effects: "",
  instructions: "",
  started_on: "",
  notes: "",
  active: true,
};

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function MedicationsClient({
  initial,
  doses: initialDoses,
}: {
  initial: Medication[];
  doses: Dose[];
}) {
  const [items, setItems] = useState(initial);
  const [doses, setDoses] = useState(initialDoses);
  const [form, setForm] = useState(empty);
  const [pending, start] = useTransition();

  async function add(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const row = (await api("/api/medications", "POST", {
        ...form,
        started_on: form.started_on || null,
      })) as Medication;
      setItems([row, ...items]);
      setForm(empty);
    });
  }

  async function toggle(id: string, active: boolean) {
    const row = (await api(`/api/medications/${id}`, "PATCH", { active })) as Medication;
    setItems(items.map((m) => (m.id === id ? row : m)));
  }

  async function remove(id: string) {
    await api(`/api/medications/${id}`, "DELETE");
    setItems(items.filter((m) => m.id !== id));
    setDoses(doses.filter((d) => d.medication_id !== id));
  }

  async function logDose(medication_id: string, skipped: boolean) {
    const row = (await api("/api/doses", "POST", { medication_id, skipped })) as Dose;
    setDoses([row, ...doses]);
  }

  const todayKey = new Date().toDateString();
  const dosesByMed = new Map<string, Dose[]>();
  for (const d of doses) {
    const arr = dosesByMed.get(d.medication_id) ?? [];
    arr.push(d);
    dosesByMed.set(d.medication_id, arr);
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold mb-6">Medications</h1>

      <form onSubmit={add} className="card mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Name</label>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Atorvastatin"
          />
        </div>
        <div>
          <label className="label">Dosage</label>
          <input
            className="input"
            value={form.dosage}
            onChange={(e) => setForm({ ...form, dosage: e.target.value })}
            placeholder="20 mg"
          />
        </div>
        <div>
          <label className="label">Schedule</label>
          <input
            className="input"
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
            placeholder="Once daily at night"
          />
        </div>
        <div>
          <label className="label">Started on</label>
          <input
            type="date"
            className="input"
            value={form.started_on}
            onChange={(e) => setForm({ ...form, started_on: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">What it does for me</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.benefits}
            onChange={(e) => setForm({ ...form, benefits: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Side effects to watch</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.side_effects}
            onChange={(e) => setForm({ ...form, side_effects: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Instructions</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
        </div>
        <button className="btn btn-primary sm:col-span-2 justify-center" disabled={pending}>
          {pending ? "Saving…" : "Add medication"}
        </button>
      </form>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-muted text-sm">No medications yet.</p>}
        {items.map((m) => {
          const medDoses = dosesByMed.get(m.id) ?? [];
          const takenToday = medDoses.some(
            (d) => !d.skipped && new Date(d.taken_at).toDateString() === todayKey,
          );
          return (
            <div key={m.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{m.name}</h3>
                    {m.dosage && <span className="pill">{m.dosage}</span>}
                    {!m.active && <span className="pill text-warn">inactive</span>}
                    {m.active === 1 && takenToday && (
                      <span className="pill text-good">taken today</span>
                    )}
                  </div>
                  {m.schedule && <p className="text-sm text-muted mt-1">{m.schedule}</p>}
                  {m.benefits && (
                    <p className="text-sm mt-2">
                      <span className="text-muted">Benefits: </span>
                      {m.benefits}
                    </p>
                  )}
                  {m.side_effects && (
                    <p className="text-sm mt-1">
                      <span className="text-muted">Side effects: </span>
                      {m.side_effects}
                    </p>
                  )}
                  {m.instructions && (
                    <p className="text-sm mt-1">
                      <span className="text-muted">Instructions: </span>
                      {m.instructions}
                    </p>
                  )}
                  {m.active === 1 && <Adherence doses={medDoses} />}
                </div>
                <div className="flex flex-col gap-2">
                  {m.active === 1 && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => logDose(m.id, false)}
                        disabled={takenToday}
                      >
                        {takenToday ? "✓ Taken" : "Log dose"}
                      </button>
                      <button className="btn" onClick={() => logDose(m.id, true)}>
                        Skipped
                      </button>
                    </>
                  )}
                  <button className="btn" onClick={() => toggle(m.id, m.active !== 1)}>
                    {m.active === 1 ? "Inactive" : "Active"}
                  </button>
                  <button className="btn" onClick={() => remove(m.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Adherence({ doses }: { doses: Dose[] }) {
  const days: { key: string; taken: boolean; skipped: boolean }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const match = doses.find((x) => new Date(x.taken_at).toDateString() === key);
    days.push({
      key,
      taken: !!match && !match.skipped,
      skipped: !!match && !!match.skipped,
    });
  }
  const takenCount = days.filter((d) => d.taken).length;
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {days.map((d) => (
            <div
              key={d.key}
              title={d.key + (d.taken ? " — taken" : d.skipped ? " — skipped" : "")}
              className={`w-3 h-3 rounded-sm ${
                d.taken ? "bg-good" : d.skipped ? "bg-bad/60" : "bg-edge"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted">{takenCount}/14 days</span>
      </div>
    </div>
  );
}
