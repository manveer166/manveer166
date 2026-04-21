import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  db().prepare("delete from food_entries where id=?").run(id);
  return Response.json({ ok: true });
}
