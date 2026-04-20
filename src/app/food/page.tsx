import { serverClient, requireUser } from "@/lib/supabase/server";
import FoodClient from "./Client";

export const dynamic = "force-dynamic";

export default async function FoodPage() {
  const user = await requireUser();
  if (!user) return null;
  const sb = await serverClient();
  const [entries, allergies] = await Promise.all([
    sb
      .from("food_entries")
      .select("*")
      .order("eaten_at", { ascending: false })
      .limit(100),
    sb.from("allergies").select("allergen").limit(100),
  ]);
  return (
    <FoodClient
      initial={entries.data ?? []}
      allergens={(allergies.data ?? []).map((a) => a.allergen)}
    />
  );
}
