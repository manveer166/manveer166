import MedicationsClient from "./Client";
import { db, q, type Medication, type Dose } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function MedicationsPage() {
  const meds = q.medications();
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();
  const doses = db()
    .prepare(
      "select id, medication_id, taken_at, skipped from medication_doses where taken_at >= ? order by taken_at desc",
    )
    .all(since) as Dose[];
  return (
    <MedicationsClient initial={meds as Medication[]} doses={doses} />
  );
}
