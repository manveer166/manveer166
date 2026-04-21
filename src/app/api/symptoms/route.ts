import { NextRequest } from "next/server";
import { db, uuid } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const b = await req.json();
  const id = uuid();
  db()
    .prepare(
      "insert into symptoms (id, occurred_at, description, severity, mood, notes) values (?, ?, ?, ?, ?, ?)",
    )
    .run(
      id,
      b.occurred_at ?? new Date().toISOString(),
      b.description,
      b.severity ?? null,
      b.mood ?? null,
      b.notes || null,
    );
  return Response.json(db().prepare("select * from symptoms where id=?").get(id));
}
