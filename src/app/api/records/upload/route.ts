import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { db, uuid, UPLOADS_DIR } from "@/lib/db";
import { claude, MODEL } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 300;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

async function extractWithClaude(buf: Buffer, mime: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const data = buf.toString("base64");
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
            text: "This is a medical record. Transcribe all readable text verbatim, then under a '## Summary' heading give a 3-5 bullet summary of key findings (dates, values, diagnoses, medications, notes). If this is a lab report, include lab values with reference ranges and flag any that are out of range.",
          },
        ],
      },
    ],
  });

  const block = res.content.find((c) => c.type === "text");
  return block && block.type === "text" ? block.text : null;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = (form.get("title") as string) || file?.name || "Record";
  const kind = (form.get("kind") as string) || null;
  const taken_on = (form.get("taken_on") as string) || null;
  const notes = (form.get("notes") as string) || null;
  if (!file) return new Response("No file", { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";
  const ext = file.name.split(".").pop() || "bin";
  const storage_path = `${Date.now()}-${uuid()}.${ext}`;

  fs.writeFileSync(path.join(UPLOADS_DIR, storage_path), buf);

  let extracted_text: string | null = null;
  try {
    if (mime.startsWith("text/") || file.name.match(/\.(txt|md|csv)$/i)) {
      extracted_text = buf.toString("utf8");
    } else if (mime === "application/pdf" || IMAGE_TYPES.has(mime)) {
      extracted_text = await extractWithClaude(buf, mime);
    }
  } catch (e) {
    extracted_text = `[extraction failed: ${e instanceof Error ? e.message : String(e)}]`;
  }

  const id = uuid();
  db()
    .prepare(
      `insert into records (id, title, kind, taken_on, storage_path, mime_type, notes, extracted_text)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, title, kind, taken_on, storage_path, mime, notes, extracted_text);

  return Response.json(db().prepare("select * from records where id=?").get(id));
}
