import { NextRequest } from "next/server";
import { requireUser, serverClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = (form.get("title") as string) || file?.name || "Record";
  const kind = (form.get("kind") as string) || null;
  const taken_on = (form.get("taken_on") as string) || null;
  const notes = (form.get("notes") as string) || null;
  if (!file) return new Response("No file", { status: 400 });

  const sb = await serverClient();
  const ext = file.name.split(".").pop() || "bin";
  const storage_path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const buf = await file.arrayBuffer();
  const { error: upErr } = await sb.storage
    .from("records")
    .upload(storage_path, buf, {
      contentType: file.type || "application/octet-stream",
    });
  if (upErr) return new Response(upErr.message, { status: 500 });

  let extracted_text: string | null = null;
  if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
    extracted_text = await new Blob([buf]).text();
  }

  const { data, error } = await sb
    .from("records")
    .insert({
      user_id: user.id,
      title,
      kind,
      taken_on,
      notes,
      storage_path,
      mime_type: file.type || null,
      extracted_text,
    })
    .select()
    .single();

  if (error) return new Response(error.message, { status: 500 });
  return Response.json(data);
}
