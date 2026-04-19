import { serverClient, requireUser } from "@/lib/supabase/server";
import AppleHealthClient from "./Client";

export const dynamic = "force-dynamic";

export default async function AppleHealthPage() {
  const user = await requireUser();
  if (!user) return null;
  const sb = await serverClient();

  const { data } = await sb
    .from("vitals")
    .select("type, value, unit, measured_at")
    .order("measured_at", { ascending: false })
    .limit(500);

  const latestByType = new Map<string, { value: number; unit: string | null; measured_at: string; count: number }>();
  for (const v of data ?? []) {
    const existing = latestByType.get(v.type);
    if (!existing) latestByType.set(v.type, { ...v, count: 1 });
    else existing.count++;
  }

  return <AppleHealthClient summary={Array.from(latestByType.entries())} />;
}
