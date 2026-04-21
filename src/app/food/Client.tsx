"use client";
import { useMemo, useState, useTransition } from "react";
import type { FoodEntry } from "@/lib/db";

const empty = {
  description: "",
  meal: "lunch" as FoodEntry["meal"],
  calories: "",
  notes: "",
  eaten_at: "",
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

export default function FoodClient({
  initial,
  allergens,
}: {
  initial: FoodEntry[];
  allergens: string[];
}) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState(empty);
  const [pending, start] = useTransition();

  const allergenSet = useMemo(() => allergens.map((a) => a.toLowerCase()), [allergens]);
  function scan(desc: string): string[] {
    const lower = desc.toLowerCase();
    return allergenSet.filter((a) => a && lower.includes(a));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const desc = form.description.trim();
    if (!desc) return;
    start(async () => {
      const flagged = scan(desc);
      const row = (await api("/api/food", "POST", {
        description: desc,
        meal: form.meal,
        calories: form.calories ? Number(form.calories) : null,
        notes: form.notes || null,
        eaten_at: form.eaten_at ? new Date(form.eaten_at).toISOString() : new Date().toISOString(),
        flagged_allergens: flagged,
      })) as FoodEntry;
      setItems([row, ...items]);
      setForm(empty);
    });
  }

  async function remove(id: string) {
    await api(`/api/food/${id}`, "DELETE");
    setItems(items.filter((i) => i.id !== id));
  }

  const todays = items.filter(
    (i) => new Date(i.eaten_at).toDateString() === new Date().toDateString(),
  );
  const caloriesToday = todays.reduce((s, i) => s + (i.calories ?? 0), 0);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-2">Food log</h1>
      <p className="text-sm text-muted mb-6">
        Entries are scanned against your allergies — anything matching gets flagged.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Entries today" value={todays.length} />
        <Stat label="Calories today" value={caloriesToday || "—"} />
        <Stat label="Known allergens" value={allergens.length} />
      </div>

      <form onSubmit={add} className="card mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">What did you eat?</label>
          <input
            required
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Grilled chicken salad with peanut dressing"
          />
          {form.description && scan(form.description).length > 0 && (
            <p className="text-bad text-xs mt-1">
              ⚠ Contains allergen(s): {scan(form.description).join(", ")}
            </p>
          )}
        </div>
        <div>
          <label className="label">Meal</label>
          <select
            className="select"
            value={form.meal ?? "lunch"}
            onChange={(e) => setForm({ ...form, meal: e.target.value as FoodEntry["meal"] })}
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
            <option value="drink">Drink</option>
          </select>
        </div>
        <div>
          <label className="label">Calories (optional)</label>
          <input
            type="number"
            className="input"
            value={form.calories}
            onChange={(e) => setForm({ ...form, calories: e.target.value })}
          />
        </div>
        <div>
          <label className="label">When</label>
          <input
            type="datetime-local"
            className="input"
            value={form.eaten_at}
            onChange={(e) => setForm({ ...form, eaten_at: e.target.value })}
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
          {pending ? "Saving…" : "Log food"}
        </button>
      </form>

      <div className="space-y-2">
        {items.length === 0 && <p className="text-muted text-sm">No entries yet.</p>}
        {items.map((i) => (
          <div key={i.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {i.meal && <span className="pill">{i.meal}</span>}
                  <span className="text-xs text-muted">
                    {new Date(i.eaten_at).toLocaleString()}
                  </span>
                  {i.calories && <span className="pill">{i.calories} kcal</span>}
                </div>
                <p className="text-sm mt-1">{i.description}</p>
                {i.notes && <p className="text-xs text-muted mt-1">{i.notes}</p>}
                {i.flagged_allergens && i.flagged_allergens.length > 0 && (
                  <p className="text-bad text-xs mt-1">⚠ {i.flagged_allergens.join(", ")}</p>
                )}
              </div>
              <button className="btn" onClick={() => remove(i.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
