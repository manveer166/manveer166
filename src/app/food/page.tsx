import FoodClient from "./Client";
import { db, deserializeFood, q, type FoodEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function FoodPage() {
  const rows = db()
    .prepare("select * from food_entries order by eaten_at desc limit 100")
    .all() as (FoodEntry & { flagged_allergens: unknown })[];
  const entries = rows.map(deserializeFood);
  const allergens = q.allergies().map((a) => a.allergen);
  return <FoodClient initial={entries} allergens={allergens} />;
}
