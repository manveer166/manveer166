import { NextRequest } from "next/server";
import { serverClient, requireUser } from "@/lib/supabase/server";
import { buildUserContext } from "@/lib/context";
import { claude, MODEL, SYSTEM_PROMPT } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { content } = (await req.json()) as { content: string };
  if (!content?.trim()) return new Response("Empty message", { status: 400 });

  const sb = await serverClient();

  const [history, profile] = await Promise.all([
    sb
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(40),
    buildUserContext(sb, user.id),
  ]);

  const messages = [
    ...(history.data ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content },
  ];

  await sb.from("chat_messages").insert({ user_id: user.id, role: "user", content });

  const stream = await claude().messages.stream({
    model: MODEL,
    max_tokens: 2048,
    system: [
      { type: "text", text: SYSTEM_PROMPT },
      { type: "text", text: profile, cache_control: { type: "ephemeral" } },
    ],
    messages,
  });

  const encoder = new TextEncoder();
  let full = "";

  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const evt of stream) {
          if (evt.type === "content_block_delta" && evt.delta.type === "text_delta") {
            full += evt.delta.text;
            controller.enqueue(encoder.encode(evt.delta.text));
          }
        }
        await sb
          .from("chat_messages")
          .insert({ user_id: user.id, role: "assistant", content: full });
      } catch (err) {
        controller.enqueue(encoder.encode("\n\n[error: " + String(err) + "]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
