import AllergiesClient from "./Client";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function AllergiesPage() {
  return <AllergiesClient initial={q.allergies()} />;
}
