import { NextRequest } from "next/server";
import { db, uuid } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const b = await req.json();
  const id = uuid();
  db()
    .prepare(
      "insert into allergies (id, allergen, severity, reaction, notes) values (?, ?, ?, ?, ?)",
    )
    .run(id, b.allergen, b.severity || null, b.reaction || null, b.notes || null);
  return Response.json(db().prepare("select * from allergies where id=?").get(id));
}
