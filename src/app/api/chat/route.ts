import { NextRequest } from "next/server";
import { db, uuid, q, type ChatMessage } from "@/lib/db";
import { buildUserContext } from "@/lib/context";
import { claude, MODEL, SYSTEM_PROMPT } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { content } = (await req.json()) as { content: string };
  if (!content?.trim()) return new Response("Empty message", { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY)
    return new Response("ANTHROPIC_API_KEY not set", { status: 503 });

  const history = q.chatHistory(40);
  const profile = buildUserContext();

  const messages = [
    ...history.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content },
  ];

  db()
    .prepare("insert into chat_messages (id, role, content) values (?, 'user', ?)")
    .run(uuid(), content);

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
        db()
          .prepare("insert into chat_messages (id, role, content) values (?, 'assistant', ?)")
          .run(uuid(), full);
      } catch (err) {
        controller.enqueue(encoder.encode("\n\n[error: " + String(err) + "]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
