import { q, deserializeFood } from "./db";

export function buildUserContext(): string {
  const meds = q.medications();
  const allergies = q.allergies();
  const records = q.records(25);
  const vitals = q.vitalsRecent(200);
  const food = q.foodRecent(30).map((r) => deserializeFood(r as typeof r & { flagged_allergens: unknown }));
  const symptoms = q.symptomsRecent(30);

  const latestByType = new Map<string, (typeof vitals)[number]>();
  for (const v of vitals) if (!latestByType.has(v.type)) latestByType.set(v.type, v);

  const lines: string[] = [];
  lines.push("# User profile");
  lines.push("");
  lines.push("## Allergies");
  if (!allergies.length) lines.push("_None recorded._");
  for (const a of allergies) {
    lines.push(
      `- **${a.allergen}** (${a.severity ?? "unknown severity"})${
        a.reaction ? ` — reaction: ${a.reaction}` : ""
      }${a.notes ? ` — ${a.notes}` : ""}`,
    );
  }

  lines.push("");
  lines.push("## Current medications");
  const active = meds.filter((m) => m.active);
  if (!active.length) lines.push("_None recorded._");
  for (const m of active) {
    lines.push(`- **${m.name}** ${m.dosage ?? ""} ${m.schedule ? `(${m.schedule})` : ""}`.trim());
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
  lines.push("## Recent food log (last 30)");
  if (!food.length) lines.push("_No food logged._");
  for (const f of food) {
    const flagged = f.flagged_allergens?.length ? ` [⚠ ${f.flagged_allergens.join(", ")}]` : "";
    lines.push(
      `- ${f.eaten_at}${f.meal ? ` (${f.meal})` : ""}: ${f.description}${
        f.calories ? ` — ${f.calories} kcal` : ""
      }${flagged}`,
    );
  }

  lines.push("");
  lines.push("## Recent symptoms (last 30)");
  if (!symptoms.length) lines.push("_No symptoms logged._");
  for (const s of symptoms) {
    lines.push(
      `- ${s.occurred_at}: ${s.description}${
        s.severity != null ? ` — severity ${s.severity}/10` : ""
      }${s.mood != null ? `, mood ${s.mood}/5` : ""}${s.notes ? ` (${s.notes})` : ""}`,
    );
  }

  lines.push("");
  lines.push("## Recent medical records");
  if (!records.length) lines.push("_None uploaded._");
  for (const r of records) {
    lines.push(`### ${r.title}${r.taken_on ? ` (${r.taken_on})` : ""}`);
    if (r.kind) lines.push(`Type: ${r.kind}`);
    if (r.notes) lines.push(r.notes);
    if (r.extracted_text) lines.push("```\n" + r.extracted_text.slice(0, 4000) + "\n```");
    lines.push("");
  }

  return lines.join("\n");
}
