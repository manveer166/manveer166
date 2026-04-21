import { labelFor } from "@/lib/vital-types";
import PrintButton from "./PrintButton";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function SummaryPage() {
  const since30 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
  const meds = q.medications();
  const allergies = q.allergies();
  const records = q.records(20);
  const vitals = q.vitalsSince(since30);
  const symptoms = q.symptomsSince(since30);

  const latestByType = new Map<string, { value: number; unit: string | null; measured_at: string }>();
  const statsByType = new Map<string, { n: number; sum: number; min: number; max: number }>();
  for (const v of vitals) {
    if (!latestByType.has(v.type))
      latestByType.set(v.type, { value: v.value, unit: v.unit, measured_at: v.measured_at });
    const s = statsByType.get(v.type) ?? { n: 0, sum: 0, min: Infinity, max: -Infinity };
    s.n++;
    s.sum += v.value;
    s.min = Math.min(s.min, v.value);
    s.max = Math.max(s.max, v.value);
    statsByType.set(v.type, s);
  }

  const activeMeds = meds.filter((m) => m.active === 1);

  return (
    <div className="max-w-3xl print:max-w-none">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <h1 className="text-2xl font-semibold">Doctor summary</h1>
        <PrintButton />
      </div>
      <p className="text-xs text-muted mb-6 print:hidden">
        Printable snapshot for appointments. Use your browser's "Save as PDF" in the print dialog.
      </p>

      <article className="space-y-6 print:text-black">
        <header className="border-b border-edge pb-3">
          <h1 className="hidden print:block text-xl font-semibold">Health summary</h1>
          <div className="text-sm text-muted">
            Generated {new Date().toLocaleDateString()}
          </div>
        </header>

        <section>
          <h2 className="font-semibold mb-2">Allergies</h2>
          {!allergies.length ? (
            <p className="text-sm text-muted">None reported.</p>
          ) : (
            <ul className="text-sm space-y-1 list-disc pl-5">
              {allergies.map((a, i) => (
                <li key={i}>
                  <strong>{a.allergen}</strong>
                  {a.severity ? ` (${a.severity})` : ""}
                  {a.reaction ? ` — ${a.reaction}` : ""}
                  {a.notes ? `. ${a.notes}` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-semibold mb-2">Current medications</h2>
          {!activeMeds.length ? (
            <p className="text-sm text-muted">None.</p>
          ) : (
            <ul className="text-sm space-y-1 list-disc pl-5">
              {activeMeds.map((m, i) => (
                <li key={i}>
                  <strong>{m.name}</strong> {m.dosage ?? ""}
                  {m.schedule ? ` — ${m.schedule}` : ""}
                  {m.benefits ? `. For: ${m.benefits}` : ""}
                  {m.started_on ? ` (since ${m.started_on})` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-semibold mb-2">Vitals — last 30 days</h2>
          {latestByType.size === 0 ? (
            <p className="text-sm text-muted">No readings.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-muted">
                  <th className="py-1">Metric</th>
                  <th className="py-1">Latest</th>
                  <th className="py-1">Range</th>
                  <th className="py-1">Readings</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(latestByType.entries()).map(([type, v]) => {
                  const s = statsByType.get(type)!;
                  return (
                    <tr key={type} className="border-t border-edge">
                      <td className="py-1">{labelFor(type)}</td>
                      <td className="py-1">
                        {v.value} {v.unit ?? ""}
                      </td>
                      <td className="py-1">
                        {s.min.toFixed(1)} – {s.max.toFixed(1)}
                      </td>
                      <td className="py-1">{s.n}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <h2 className="font-semibold mb-2">Symptoms — last 30 days</h2>
          {!symptoms.length ? (
            <p className="text-sm text-muted">None logged.</p>
          ) : (
            <ul className="text-sm space-y-1 list-disc pl-5">
              {symptoms.map((s, i) => (
                <li key={i}>
                  {new Date(s.occurred_at).toLocaleDateString()}: {s.description}
                  {s.severity != null ? ` — severity ${s.severity}/10` : ""}
                  {s.notes ? ` (${s.notes})` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-semibold mb-2">Recent records</h2>
          {!records.length ? (
            <p className="text-sm text-muted">None.</p>
          ) : (
            <ul className="text-sm space-y-1 list-disc pl-5">
              {records.map((r, i) => (
                <li key={i}>
                  {r.taken_on ?? "—"}: <strong>{r.title}</strong>
                  {r.kind ? ` (${r.kind})` : ""}
                  {r.notes ? ` — ${r.notes}` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="text-[10px] text-muted border-t border-edge pt-2">
          Self-reported data. Generated by a personal health dashboard — not a medical record.
        </footer>
      </article>
    </div>
  );
}
