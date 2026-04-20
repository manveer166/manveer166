import { SupabaseClient } from "@supabase/supabase-js";

export async function buildUserContext(sb: SupabaseClient, userId: string) {
  const [meds, allergies, records, vitals, food] = await Promise.all([
    sb
      .from("medications")
      .select("name, dosage, schedule, benefits, side_effects, instructions, started_on, active")
      .eq("user_id", userId)
      .order("active", { ascending: false }),
    sb
      .from("allergies")
      .select("allergen, severity, reaction, notes")
      .eq("user_id", userId),
    sb
      .from("records")
      .select("title, kind, taken_on, notes, extracted_text")
      .eq("user_id", userId)
      .order("taken_on", { ascending: false })
      .limit(25),
    sb
      .from("vitals")
      .select("type, value, unit, measured_at, source")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(200),
    sb
      .from("food_entries")
      .select("eaten_at, meal, description, calories, flagged_allergens")
      .eq("user_id", userId)
      .order("eaten_at", { ascending: false })
      .limit(30),
  ]);

  const latestByType = new Map<string, { value: number; unit: string | null; measured_at: string }>();
  for (const v of vitals.data ?? []) {
    if (!latestByType.has(v.type)) {
      latestByType.set(v.type, { value: v.value, unit: v.unit, measured_at: v.measured_at });
    }
  }

  const lines: string[] = [];
  lines.push("# User profile");
  lines.push("");
  lines.push("## Allergies");
  if (!allergies.data?.length) lines.push("_None recorded._");
  for (const a of allergies.data ?? []) {
    lines.push(
      `- **${a.allergen}** (${a.severity ?? "unknown severity"})${
        a.reaction ? ` — reaction: ${a.reaction}` : ""
      }${a.notes ? ` — ${a.notes}` : ""}`,
    );
  }

  lines.push("");
  lines.push("## Current medications");
  const active = (meds.data ?? []).filter((m) => m.active);
  if (!active.length) lines.push("_None recorded._");
  for (const m of active) {
    lines.push(
      `- **${m.name}** ${m.dosage ?? ""} ${m.schedule ? `(${m.schedule})` : ""}`.trim(),
    );
    if (m.benefits) lines.push(`    - purpose: ${m.benefits}`);
    if (m.side_effects) lines.push(`    - side effects: ${m.side_effects}`);
    if (m.instructions) lines.push(`    - instructions: ${m.instructions}`);
  }

  lines.push("");
  lines.push("## Latest vitals");
  if (!latestByType.size) lines.push("_None recorded._");
  for (const [type, v] of latestByType) {
    lines.push(`- ${type}: ${v.value} ${v.unit ?? ""} (at ${v.measured_at})`);
  }

  lines.push("");
  lines.push("## Recent food log (last 30 entries)");
  if (!food.data?.length) lines.push("_No food logged._");
  for (const f of food.data ?? []) {
    const flagged = f.flagged_allergens?.length
      ? ` [⚠ ${f.flagged_allergens.join(", ")}]`
      : "";
    lines.push(
      `- ${f.eaten_at}${f.meal ? ` (${f.meal})` : ""}: ${f.description}${
        f.calories ? ` — ${f.calories} kcal` : ""
      }${flagged}`,
    );
  }

  lines.push("");
  lines.push("## Recent medical records");
  if (!records.data?.length) lines.push("_None uploaded._");
  for (const r of records.data ?? []) {
    lines.push(`### ${r.title}${r.taken_on ? ` (${r.taken_on})` : ""}`);
    if (r.kind) lines.push(`Type: ${r.kind}`);
    if (r.notes) lines.push(r.notes);
    if (r.extracted_text) lines.push("```\n" + r.extracted_text.slice(0, 4000) + "\n```");
    lines.push("");
  }

  return lines.join("\n");
}
