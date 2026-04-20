import { NextRequest } from "next/server";
import { requireUser, serverClient } from "@/lib/supabase/server";
import { claude, MODEL } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 120;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

async function extractWithClaude(buf: ArrayBuffer, mime: string): Promise<string | null> {
  const data = Buffer.from(buf).toString("base64");

  const source =
    mime === "application/pdf"
      ? ({ type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data } })
      : IMAGE_TYPES.has(mime)
        ? ({ type: "image" as const, source: { type: "base64" as const, media_type: mime as "image/jpeg", data } })
        : null;
  if (!source) return null;

  const res = await claude().messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          source,
          {
            type: "text",
            text: "This is a medical record. Transcribe all readable text verbatim, then under a '## Summary' heading give a 3-5 bullet summary of the key findings (dates, values, diagnoses, medications, notes). If this is a lab report, include lab values with their reference ranges and flag any that are out of range.",
          },
        ],
      },
    ],
  });

  const block = res.content.find((c) => c.type === "text");
  return block && block.type === "text" ? block.text : null;
}

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
  const mime = file.type || "application/octet-stream";

  const { error: upErr } = await sb.storage
    .from("records")
    .upload(storage_path, buf, { contentType: mime });
  if (upErr) return new Response(upErr.message, { status: 500 });

  let extracted_text: string | null = null;
  try {
    if (mime.startsWith("text/") || file.name.match(/\.(txt|md|csv)$/i)) {
      extracted_text = await new Blob([buf]).text();
    } else if (mime === "application/pdf" || IMAGE_TYPES.has(mime)) {
      extracted_text = await extractWithClaude(buf, mime);
    }
  } catch (e) {
    extracted_text = `[extraction failed: ${e instanceof Error ? e.message : String(e)}]`;
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
      mime_type: mime,
      extracted_text,
    })
    .select()
    .single();

  if (error) return new Response(error.message, { status: 500 });
  return Response.json(data);
}
