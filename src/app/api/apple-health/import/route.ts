import { NextRequest } from "next/server";
import { db, uuid } from "@/lib/db";
import { parseHealthExport, type HealthSample } from "@/lib/apple-health";

export const runtime = "nodejs";
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return new Response("No file", { status: 400 });

  if (file.name.endsWith(".zip") || file.type === "application/zip") {
    return new Response(
      "Please unzip the Apple Health export and upload export.xml directly.",
      { status: 400 },
    );
  }

  const xml = await file.text();
  const samples: HealthSample[] = [];
  await parseHealthExport(xml, (s) => {
    if (s.value != null) samples.push(s);
  });

  const insert = db().prepare(
    "insert into vitals (id, type, value, unit, measured_at, source) values (?, ?, ?, ?, ?, ?)",
  );
  const tx = db().transaction((rows: HealthSample[]) => {
    for (const s of rows) {
      insert.run(uuid(), s.type, s.value!, s.unit, s.startDate, s.source);
    }
  });
  tx(samples);

  return Response.json({ inserted: samples.length });
}
