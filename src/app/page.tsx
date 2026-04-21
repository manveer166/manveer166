import Link from "next/link";
import { Sparkline } from "@/components/Chart";
import { labelFor } from "@/lib/vital-types";
import WeeklyDigest from "./WeeklyDigest";
import { q } from "@/lib/db";
import { ANTHROPIC_ENABLED } from "@/lib/env";

export const dynamic = "force-dynamic";

const DASHBOARD_TYPES = [
  "HKQuantityTypeIdentifierHeartRate",
  "HKQuantityTypeIdentifierRestingHeartRate",
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierBodyMass",
  "HKQuantityTypeIdentifierBloodPressureSystolic",
  "HKQuantityTypeIdentifierBloodPressureDiastolic",
  "HKQuantityTypeIdentifierOxygenSaturation",
  "HKQuantityTypeIdentifierBloodGlucose",
];

export default function Dashboard() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();

  const medsCount = q.countActiveMeds();
  const allergyCount = q.count("allergies");
  const recordCount = q.count("records");
  const foodCount = q.countFoodSince(since);
  const vitals = q.vitalsSince(since);

  type Series = { unit: string | null; series: { t: number; v: number }[] };
  const byType = new Map<string, Series>();
  for (const v of vitals) {
    const entry: Series = byType.get(v.type) ?? { unit: v.unit, series: [] };
    entry.series.push({ t: new Date(v.measured_at).getTime(), v: v.value });
    byType.set(v.type, entry);
  }

  const ordered = DASHBOARD_TYPES.filter((t) => byType.has(t)).concat(
    Array.from(byType.keys()).filter((t) => !DASHBOARD_TYPES.includes(t)),
  );

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active medications" value={medsCount} href="/medications" />
        <StatCard label="Known allergies" value={allergyCount} href="/allergies" />
        <StatCard label="Medical records" value={recordCount} href="/records" />
        <StatCard label="Food entries (30d)" value={foodCount} href="/food" />
      </div>

      <section className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Vitals — last 30 days</h2>
          <div className="flex gap-3 text-sm">
            <Link className="text-accent" href="/trends">
              Trends →
            </Link>
            <Link className="text-accent" href="/apple-health">
              Import Apple Health →
            </Link>
          </div>
        </div>
        {ordered.length === 0 ? (
          <p className="text-muted text-sm">
            No vitals yet. Log some on the Vitals page or import an Apple Health export.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ordered.slice(0, 9).map((type) => {
              const { unit, series } = byType.get(type)!;
              const last = series[series.length - 1];
              return (
                <div key={type} className="border border-edge rounded-lg p-3">
                  <div className="text-xs text-muted">{labelFor(type)}</div>
                  <div className="text-2xl font-medium mt-1">
                    {Math.round(last.v * 10) / 10}
                    <span className="text-sm text-muted ml-1">{unit ?? ""}</span>
                  </div>
                  <Sparkline data={series} />
                  <div className="text-[10px] text-muted">
                    {series.length} reading{series.length === 1 ? "" : "s"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {ANTHROPIC_ENABLED ? (
        <WeeklyDigest />
      ) : (
        <section className="card">
          <h2 className="font-semibold mb-1">Weekly summary</h2>
          <p className="text-sm text-muted">
            Add <code>ANTHROPIC_API_KEY</code> to <code>.env.local</code> and restart to enable the
            AI-generated weekly digest.
          </p>
        </section>
      )}

      <section className="card mt-6">
        <h2 className="font-semibold mb-2">Disclaimer</h2>
        <p className="text-sm text-muted">
          This dashboard is an informational tool, not medical advice. For anything urgent, contact
          emergency services or your doctor.
        </p>
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card hover:border-accent transition-colors">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="text-3xl font-semibold mt-2">{value}</div>
    </Link>
  );
}
