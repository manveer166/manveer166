import { serverClient, requireUser } from "@/lib/supabase/server";
import MedicationsClient from "./Client";

export const dynamic = "force-dynamic";

export default async function MedicationsPage() {
  const user = await requireUser();
  if (!user) return null;
  const sb = await serverClient();
  const { data } = await sb
    .from("medications")
    .select("*")
    .order("active", { ascending: false })
    .order("name");
  return <MedicationsClient initial={data ?? []} />;
}
