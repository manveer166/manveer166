import { serverClient, requireUser } from "@/lib/supabase/server";
import AllergiesClient from "./Client";

export const dynamic = "force-dynamic";

export default async function AllergiesPage() {
  const user = await requireUser();
  if (!user) return null;
  const sb = await serverClient();
  const { data } = await sb.from("allergies").select("*").order("allergen");
  return <AllergiesClient initial={data ?? []} />;
}
