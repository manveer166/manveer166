import AppleHealthClient from "./Client";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function AppleHealthPage() {
  const rows = q.vitalsRecent(500);
  const latestByType = new Map<
    string,
    { value: number; unit: string | null; measured_at: string; count: number }
  >();
  for (const v of rows) {
    const existing = latestByType.get(v.type);
    if (!existing) latestByType.set(v.type, { ...v, count: 1 });
    else existing.count++;
  }
  return <AppleHealthClient summary={Array.from(latestByType.entries())} />;
}
