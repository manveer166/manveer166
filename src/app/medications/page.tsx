import { serverClient, requireUser } from "@/lib/supabase/server";
import MedicationsClient from "./Client";

export const dynamic = "force-dynamic";

export default async function MedicationsPage() {
  const user = await requireUser();
  if (!user) return null;
  const sb = await serverClient();

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();
  const [meds, doses] = await Promise.all([
    sb
      .from("medications")
      .select("*")
      .order("active", { ascending: false })
      .order("name"),
    sb
      .from("medication_doses")
      .select("id, medication_id, taken_at, skipped")
      .gte("taken_at", since)
      .order("taken_at", { ascending: false }),
  ]);
  return <MedicationsClient initial={meds.data ?? []} doses={doses.data ?? []} />;
}
