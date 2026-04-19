import Link from "next/link";
import { serverClient, requireUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VITAL_LABELS: Record<string, { label: string; unit?: string }> = {
  HKQuantityTypeIdentifierHeartRate: { label: "Heart rate", unit: "bpm" },
  HKQuantityTypeIdentifierRestingHeartRate: { label: "Resting HR", unit: "bpm" },
  HKQuantityTypeIdentifierStepCount: { label: "Steps (latest)" },
  HKQuantityTypeIdentifierBodyMass: { label: "Weight" },
  HKQuantityTypeIdentifierOxygenSaturation: { label: "SpO₂" },
  HKQuantityTypeIdentifierVO2Max: { label: "VO₂ max" },
  HKQuantityTypeIdentifierBloodPressureSystolic: { label: "BP systolic", unit: "mmHg" },
  HKQuantityTypeIdentifierBloodPressureDiastolic: { label: "BP diastolic", unit: "mmHg" },
  HKQuantityTypeIdentifierBloodGlucose: { label: "Blood glucose" },
};

export default async function Dashboard() {
  const user = await requireUser();
  if (!user) return null;
  const sb = await serverClient();

  const [{ count: medsCount }, { count: allergyCount }, { count: recordCount }, vitals] =
    await Promise.all([
      sb.from("medications").select("*", { count: "exact", head: true }).eq("active", true),
      sb.from("allergies").select("*", { count: "exact", head: true }),
      sb.from("records").select("*", { count: "exact", head: true }),
      sb
        .from("vitals")
        .select("type, value, unit, measured_at")
        .order("measured_at", { ascending: false })
        .limit(500),
    ]);

  const latest = new Map<string, { value: number; unit: string | null; measured_at: string }>();
  for (const v of vitals.data ?? []) {
    if (!latest.has(v.type)) latest.set(v.type, v);
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Active medications" value={medsCount ?? 0} href="/medications" />
        <StatCard label="Known allergies" value={allergyCount ?? 0} href="/allergies" />
        <StatCard label="Medical records" value={recordCount ?? 0} href="/records" />
      </div>

      <section className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Latest vitals</h2>
          <Link className="text-sm text-accent" href="/apple-health">
            Import from Apple Health →
          </Link>
        </div>
        {latest.size === 0 ? (
          <p className="text-muted text-sm">
            No vitals yet. Import an Apple Health export to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from(latest.entries()).slice(0, 12).map(([type, v]) => {
              const meta = VITAL_LABELS[type] ?? { label: type.replace(/^HK.*Identifier/, "") };
              return (
                <div key={type} className="border border-edge rounded-lg p-3">
                  <div className="text-xs text-muted">{meta.label}</div>
                  <div className="text-xl font-medium">
                    {Math.round(v.value * 10) / 10}
                    <span className="text-sm text-muted ml-1">{v.unit ?? meta.unit ?? ""}</span>
                  </div>
                  <div className="text-[10px] text-muted mt-1">
                    {new Date(v.measured_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card">
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
