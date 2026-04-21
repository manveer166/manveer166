import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const b = await req.json();
  if (typeof b.active === "boolean") {
    db().prepare("update medications set active=? where id=?").run(b.active ? 1 : 0, id);
  }
  return Response.json(db().prepare("select * from medications where id=?").get(id));
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  db().prepare("delete from medications where id=?").run(id);
  return Response.json({ ok: true });
}
