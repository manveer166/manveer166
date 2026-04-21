import { NextRequest } from "next/server";
import { db, uuid } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const b = await req.json();
  const id = uuid();
  db()
    .prepare(
      "insert into vitals (id, type, value, unit, measured_at, source) values (?, ?, ?, ?, ?, ?)",
    )
    .run(
      id,
      b.type,
      b.value,
      b.unit || null,
      b.measured_at ?? new Date().toISOString(),
      b.source ?? "manual",
    );
  return Response.json(db().prepare("select * from vitals where id=?").get(id));
}
