"use client";
import { useState, useTransition } from "react";
import { browserClient } from "@/lib/supabase/client";
import type { Medication } from "@/lib/types";

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

export default function MedicationsClient({ initial }: { initial: Medication[] }) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState(empty);
  const [pending, start] = useTransition();

  const sb = browserClient();

  async function add(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const { data: user } = await sb.auth.getUser();
      const uid = user.user?.id;
      if (!uid) return;
      const payload = {
        ...form,
        user_id: uid,
        started_on: form.started_on || null,
      };
      const { data } = await sb.from("medications").insert(payload).select().single();
      if (data) {
        setItems([data, ...items]);
        setForm(empty);
      }
    });
  }

  async function toggle(id: string, active: boolean) {
    await sb.from("medications").update({ active }).eq("id", id);
    setItems(items.map((m) => (m.id === id ? { ...m, active } : m)));
  }

  async function remove(id: string) {
    await sb.from("medications").delete().eq("id", id);
    setItems(items.filter((m) => m.id !== id));
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
            placeholder="Lowers LDL cholesterol"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Side effects to watch</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.side_effects}
            onChange={(e) => setForm({ ...form, side_effects: e.target.value })}
            placeholder="Muscle pain, liver enzyme changes"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Instructions</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            placeholder="Avoid grapefruit juice"
          />
        </div>
        <button className="btn btn-primary sm:col-span-2 justify-center" disabled={pending}>
          {pending ? "Saving…" : "Add medication"}
        </button>
      </form>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-muted text-sm">No medications yet.</p>}
        {items.map((m) => (
          <div key={m.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{m.name}</h3>
                  {m.dosage && <span className="pill">{m.dosage}</span>}
                  {!m.active && <span className="pill text-warn">inactive</span>}
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
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={() => toggle(m.id, !m.active)}>
                  {m.active ? "Mark inactive" : "Mark active"}
                </button>
                <button className="btn" onClick={() => remove(m.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
