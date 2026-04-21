import ChatClient from "./Client";
import { q } from "@/lib/db";
import { ANTHROPIC_ENABLED } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  if (!ANTHROPIC_ENABLED) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-2">Ask my assistant</h1>
        <div className="card">
          <p className="text-sm text-muted">
            The AI assistant needs an Anthropic API key. Add{" "}
            <code className="text-ink">ANTHROPIC_API_KEY=sk-ant-...</code> to{" "}
            <code className="text-ink">.env.local</code> and restart <code>npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }
  return <ChatClient initial={q.chatHistory(100)} />;
}
