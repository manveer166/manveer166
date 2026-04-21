import { NextRequest } from "next/server";
import { db, uuid } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const b = await req.json();
  const id = uuid();
  db()
    .prepare(
      "insert into medication_doses (id, medication_id, taken_at, skipped, notes) values (?, ?, ?, ?, ?)",
    )
    .run(
      id,
      b.medication_id,
      b.taken_at ?? new Date().toISOString(),
      b.skipped ? 1 : 0,
      b.notes || null,
    );
  return Response.json(db().prepare("select * from medication_doses where id=?").get(id));
}
