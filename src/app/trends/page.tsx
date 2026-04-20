import { serverClient, requireUser } from "@/lib/supabase/server";
import { labelFor } from "@/lib/vital-types";
import { LineChart } from "@/components/Chart";

export const dynamic = "force-dynamic";

type Vital = {
  type: string;
  value: number;
  unit: string | null;
  measured_at: string;
};

function groupByDay(rows: Vital[]): { t: number; v: number }[] {
  const days = new Map<string, { sum: number; n: number; t: number }>();
  for (const r of rows) {
    const d = new Date(r.measured_at);
    const key = d.toISOString().slice(0, 10);
    const entry = days.get(key) ?? { sum: 0, n: 0, t: d.getTime() };
    entry.sum += r.value;
    entry.n += 1;
    days.set(key, entry);
  }
  return Array.from(days.values())
    .map((e) => ({ t: e.t, v: e.sum / e.n }))
    .sort((a, b) => a.t - b.t);
}

export default async function TrendsPage() {
  const user = await requireUser();
  if (!user) return null;
  const sb = await serverClient();

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString();
  const { data } = await sb
    .from("vitals")
    .select("type, value, unit, measured_at")
    .gte("measured_at", since)
    .order("measured_at", { ascending: true })
    .limit(20000);

  const byType = new Map<string, Vital[]>();
  for (const r of data ?? []) {
    const arr = byType.get(r.type) ?? [];
    arr.push(r);
    byType.set(r.type, arr);
  }

  const sorted = Array.from(byType.entries()).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold mb-2">Trends</h1>
      <p className="text-sm text-muted mb-6">Daily averages for the last 180 days.</p>

      {sorted.length === 0 && (
        <div className="card text-sm text-muted">
          No vitals yet. Log some on the Vitals page or import an Apple Health export.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map(([type, rows]) => {
          const series = groupByDay(rows);
          const unit = rows[0]?.unit ?? "";
          const last = series[series.length - 1];
          return (
            <div key={type} className="card">
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="font-semibold">{labelFor(type)}</h2>
                {last && (
                  <span className="text-muted text-sm">
                    latest {Math.round(last.v * 10) / 10} {unit}
                  </span>
                )}
              </div>
              <LineChart data={series} yUnit={unit ? " " + unit : ""} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
