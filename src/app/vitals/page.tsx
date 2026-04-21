import VitalsClient from "./Client";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function VitalsPage() {
  return <VitalsClient initial={q.vitalsRecent(200)} />;
}
