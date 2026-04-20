"use client";
import { useState, useTransition } from "react";
import { browserClient } from "@/lib/supabase/client";
import { MANUAL_VITAL_TYPES, labelFor } from "@/lib/vital-types";

type Row = {
  id: string;
  type: string;
  value: number;
  unit: string | null;
  measured_at: string;
  source: string | null;
};

export default function VitalsClient({ initial }: { initial: Row[] }) {
  const [items, setItems] = useState(initial);
  const [type, setType] = useState(MANUAL_VITAL_TYPES[0].type);
  const [value, setValue] = useState("");
  const [when, setWhen] = useState("");
  const [pending, start] = useTransition();
  const sb = browserClient();

  const meta = MANUAL_VITAL_TYPES.find((t) => t.type === type)!;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return;
    start(async () => {
      const { data: user } = await sb.auth.getUser();
      const uid = user.user?.id;
      if (!uid) return;
      const payload = {
        user_id: uid,
        type,
        value: Number(value),
        unit: meta.unit || null,
        measured_at: when ? new Date(when).toISOString() : new Date().toISOString(),
        source: "manual",
      };
      const { data } = await sb.from("vitals").insert(payload).select().single();
      if (data) {
        setItems([data, ...items]);
        setValue("");
        setWhen("");
      }
    });
  }

  async function remove(id: string) {
    await sb.from("vitals").delete().eq("id", id);
    setItems(items.filter((v) => v.id !== id));
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Vitals</h1>

      <form onSubmit={add} className="card mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Metric</label>
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
            {MANUAL_VITAL_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
                {t.unit ? ` (${t.unit})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Value</label>
          <input
            type="number"
            step="any"
            required
            className="input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div>
          <label className="label">When</label>
          <input
            type="datetime-local"
            className="input"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
        </div>
        <button className="btn btn-primary sm:col-span-4 justify-center" disabled={pending}>
          {pending ? "Saving…" : "Log vital"}
        </button>
      </form>

      <div className="card">
        <div className="grid grid-cols-4 gap-3 text-xs uppercase tracking-wide text-muted pb-2 border-b border-edge">
          <div>Metric</div>
          <div>Value</div>
          <div>When</div>
          <div className="text-right">Source</div>
        </div>
        {items.length === 0 && (
          <p className="text-muted text-sm pt-3">No vitals yet.</p>
        )}
        {items.map((v) => (
          <div
            key={v.id}
            className="grid grid-cols-4 gap-3 py-2 border-b border-edge last:border-0 text-sm items-center"
          >
            <div>{labelFor(v.type)}</div>
            <div>
              {v.value} <span className="text-muted">{v.unit ?? ""}</span>
            </div>
            <div className="text-muted">{new Date(v.measured_at).toLocaleString()}</div>
            <div className="flex items-center justify-end gap-2">
              <span className="pill">{v.source ?? "—"}</span>
              <button className="btn" onClick={() => remove(v.id)}>
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
