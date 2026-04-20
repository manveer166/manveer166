import { serverClient, requireUser } from "@/lib/supabase/server";
import SymptomsClient from "./Client";

export const dynamic = "force-dynamic";

export default async function SymptomsPage() {
  const user = await requireUser();
  if (!user) return null;
  const sb = await serverClient();
  const { data } = await sb
    .from("symptoms")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(100);
  return <SymptomsClient initial={data ?? []} />;
}
