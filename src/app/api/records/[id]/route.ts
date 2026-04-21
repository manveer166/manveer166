import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { db, UPLOADS_DIR, type RecordRow } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = db().prepare("select * from records where id=?").get(id) as RecordRow | undefined;
  if (!row) return new Response("Not found", { status: 404 });
  const full = path.join(UPLOADS_DIR, row.storage_path);
  if (!fs.existsSync(full)) return new Response("File missing", { status: 404 });
  const buf = fs.readFileSync(full);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": row.mime_type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(row.title)}"`,
    },
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = db().prepare("select * from records where id=?").get(id) as RecordRow | undefined;
  if (row) {
    const full = path.join(UPLOADS_DIR, row.storage_path);
    try {
      fs.unlinkSync(full);
    } catch {
      // already gone
    }
    db().prepare("delete from records where id=?").run(id);
  }
  return Response.json({ ok: true });
}
