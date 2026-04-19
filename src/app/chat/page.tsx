import { serverClient, requireUser } from "@/lib/supabase/server";
import ChatClient from "./Client";
import type { ChatMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await requireUser();
  if (!user) return null;
  const sb = await serverClient();
  const { data } = await sb
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(100);
  return <ChatClient initial={(data as ChatMessage[]) ?? []} />;
}
