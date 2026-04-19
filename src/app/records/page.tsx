import { serverClient, requireUser } from "@/lib/supabase/server";
import RecordsClient from "./Client";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const user = await requireUser();
  if (!user) return null;
  const sb = await serverClient();
  const { data } = await sb
    .from("records")
    .select("*")
    .order("taken_on", { ascending: false, nullsFirst: false });
  return <RecordsClient initial={data ?? []} />;
}
