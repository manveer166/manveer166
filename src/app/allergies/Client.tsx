"use client";
import { useState, useTransition } from "react";
import { browserClient } from "@/lib/supabase/client";
import type { Allergy } from "@/lib/types";

const empty = { allergen: "", severity: "moderate", reaction: "", notes: "" };

export default function AllergiesClient({ initial }: { initial: Allergy[] }) {
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
      const { data } = await sb
        .from("allergies")
        .insert({ ...form, user_id: uid })
        .select()
        .single();
      if (data) {
        setItems([data, ...items]);
        setForm(empty);
      }
    });
  }

  async function remove(id: string) {
    await sb.from("allergies").delete().eq("id", id);
    setItems(items.filter((a) => a.id !== id));
  }

  const color = (s: string | null) =>
    s === "severe" ? "text-bad" : s === "moderate" ? "text-warn" : "text-muted";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Allergies</h1>

      <form onSubmit={add} className="card mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Allergen</label>
          <input
            required
            className="input"
            value={form.allergen}
            onChange={(e) => setForm({ ...form, allergen: e.target.value })}
            placeholder="Peanuts"
          />
        </div>
        <div>
          <label className="label">Severity</label>
          <select
            className="select"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
          >
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Reaction</label>
          <input
            className="input"
            value={form.reaction}
            onChange={(e) => setForm({ ...form, reaction: e.target.value })}
            placeholder="Hives, throat tightness"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Carries EpiPen"
          />
        </div>
        <button className="btn btn-primary sm:col-span-2 justify-center" disabled={pending}>
          {pending ? "Saving…" : "Add allergy"}
        </button>
      </form>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-muted text-sm">No allergies recorded.</p>}
        {items.map((a) => (
          <div key={a.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{a.allergen}</h3>
                  <span className={`pill ${color(a.severity)}`}>{a.severity ?? "unknown"}</span>
                </div>
                {a.reaction && <p className="text-sm mt-1">Reaction: {a.reaction}</p>}
                {a.notes && <p className="text-sm text-muted mt-1">{a.notes}</p>}
              </div>
              <button className="btn" onClick={() => remove(a.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
