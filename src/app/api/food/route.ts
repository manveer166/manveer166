import { NextRequest } from "next/server";
import { db, deserializeFood, uuid } from "@/lib/db";
import type { FoodEntry } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const b = await req.json();
  const id = uuid();
  db()
    .prepare(
      `insert into food_entries
       (id, eaten_at, meal, description, calories, notes, flagged_allergens)
       values (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      b.eaten_at ?? new Date().toISOString(),
      b.meal || null,
      b.description,
      b.calories ?? null,
      b.notes || null,
      b.flagged_allergens?.length ? JSON.stringify(b.flagged_allergens) : null,
    );
  const row = db().prepare("select * from food_entries where id=?").get(id) as FoodEntry & {
    flagged_allergens: unknown;
  };
  return Response.json(deserializeFood(row));
}
