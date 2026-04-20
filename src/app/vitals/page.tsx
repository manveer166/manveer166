import { serverClient, requireUser } from "@/lib/supabase/server";
import VitalsClient from "./Client";

export const dynamic = "force-dynamic";

export default async function VitalsPage() {
  const user = await requireUser();
  if (!user) return null;
  const sb = await serverClient();
  const { data } = await sb
    .from("vitals")
    .select("id, type, value, unit, measured_at, source")
    .order("measured_at", { ascending: false })
    .limit(200);
  return <VitalsClient initial={data ?? []} />;
}
