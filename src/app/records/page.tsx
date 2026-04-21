import RecordsClient from "./Client";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function RecordsPage() {
  return <RecordsClient initial={q.records(100)} />;
}
