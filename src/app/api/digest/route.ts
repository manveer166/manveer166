import { requireUser, serverClient } from "@/lib/supabase/server";
import { claude, MODEL, SYSTEM_PROMPT } from "@/lib/claude";
import { buildUserContext } from "@/lib/context";

export const runtime = "nodejs";

export async function POST() {
  const user = await requireUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sb = await serverClient();
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();

  const [vitals, food, profile] = await Promise.all([
    sb
      .from("vitals")
      .select("type, value, unit, measured_at, source")
      .gte("measured_at", since)
      .eq("user_id", user.id)
      .order("measured_at", { ascending: true }),
    sb
      .from("food_entries")
      .select("eaten_at, meal, description, calories, flagged_allergens")
      .gte("eaten_at", since)
      .eq("user_id", user.id)
      .order("eaten_at", { ascending: true }),
    buildUserContext(sb, user.id),
  ]);

  const summary: Record<string, { n: number; sum: number; min: number; max: number; unit: string | null }> = {};
  for (const v of vitals.data ?? []) {
    const s = (summary[v.type] ??= {
      n: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      unit: v.unit,
    });
    s.n++;
    s.sum += v.value;
    s.min = Math.min(s.min, v.value);
    s.max = Math.max(s.max, v.value);
  }

  const vitalsLines = Object.entries(summary)
    .map(
      ([t, s]) =>
        `- ${t.replace(/^HK.*Identifier/, "")}: avg ${(s.sum / s.n).toFixed(1)} ${s.unit ?? ""}, range ${s.min.toFixed(1)}–${s.max.toFixed(1)} (${s.n} readings)`,
    )
    .join("\n") || "_No vitals recorded this week._";

  const foodLines =
    (food.data ?? [])
      .map(
        (f) =>
          `- ${f.eaten_at.slice(0, 10)}${f.meal ? ` (${f.meal})` : ""}: ${f.description}${
            f.calories ? ` — ${f.calories} kcal` : ""
          }${f.flagged_allergens?.length ? ` ⚠ ${f.flagged_allergens.join(", ")}` : ""}`,
      )
      .join("\n") || "_No food logged this week._";

  const userMsg = `Produce a concise weekly health summary. Use the data below plus my profile context (already in system prompt).

Sections:
1. **What changed this week** — trends in vitals vs. earlier history, anything noteworthy.
2. **Food & allergy check** — any allergen flags, diet patterns.
3. **Medication adherence reminders** — any meds I should not forget (from my med list).
4. **What to watch** — 2-4 concrete things to monitor or ask a doctor about.

Keep it under 400 words. Cite specific values when you reference them.

## Vitals this week
${vitalsLines}

## Food this week
${foodLines}`;

  const stream = await claude().messages.stream({
    model: MODEL,
    max_tokens: 1500,
    system: [
      { type: "text", text: SYSTEM_PROMPT },
      { type: "text", text: profile, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userMsg }],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const evt of stream) {
          if (evt.type === "content_block_delta" && evt.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(evt.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode("\n\n[error: " + String(err) + "]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
