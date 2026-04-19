import { NextRequest } from "next/server";
import { requireUser, serviceClient } from "@/lib/supabase/server";
import { parseHealthExport, type HealthSample } from "@/lib/apple-health";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

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

  const sb = serviceClient();
  const BATCH = 1000;
  let inserted = 0;

  for (let i = 0; i < samples.length; i += BATCH) {
    const chunk = samples.slice(i, i + BATCH).map((s) => ({
      user_id: user.id,
      type: s.type,
      value: s.value!,
      unit: s.unit,
      measured_at: s.startDate,
      source: s.source,
    }));
    const { error } = await sb.from("vitals").insert(chunk);
    if (error) return new Response(error.message, { status: 500 });
    inserted += chunk.length;
  }

  return Response.json({ inserted });
}
