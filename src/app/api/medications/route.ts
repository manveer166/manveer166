import { NextRequest } from "next/server";
import { db, uuid } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const b = await req.json();
  const id = uuid();
  db()
    .prepare(
      `insert into medications
       (id, name, dosage, schedule, benefits, side_effects, instructions, started_on, active, notes)
       values (@id, @name, @dosage, @schedule, @benefits, @side_effects, @instructions, @started_on, @active, @notes)`,
    )
    .run({
      id,
      name: b.name,
      dosage: b.dosage || null,
      schedule: b.schedule || null,
      benefits: b.benefits || null,
      side_effects: b.side_effects || null,
      instructions: b.instructions || null,
      started_on: b.started_on || null,
      active: b.active === false ? 0 : 1,
      notes: b.notes || null,
    });
  const row = db().prepare("select * from medications where id=?").get(id);
  return Response.json(row);
}
