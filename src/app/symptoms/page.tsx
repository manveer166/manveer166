import SymptomsClient from "./Client";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function SymptomsPage() {
  return <SymptomsClient initial={q.symptomsRecent(100)} />;
}
