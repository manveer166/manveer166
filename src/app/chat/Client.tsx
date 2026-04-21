"use client";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/db";

export default function ChatClient({ initial }: { initial: ChatMessage[] }) {
  const [messages, setMessages] = useState(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg, { ...userMsg, id: "pending", role: "assistant", content: "" }]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => res.statusText);
      setMessages((m) =>
        m.map((x) =>
          x.id === "pending"
            ? { ...x, id: crypto.randomUUID(), content: "Error: " + errText }
            : x,
        ),
      );
      setBusy(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setMessages((m) => m.map((x) => (x.id === "pending" ? { ...x, content: acc } : x)));
    }
    setMessages((m) =>
      m.map((x) => (x.id === "pending" ? { ...x, id: crypto.randomUUID() } : x)),
    );
    setBusy(false);
  }

  return (
    <div className="max-w-3xl flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Ask my assistant</h1>
        <p className="text-sm text-muted">
          Answers are grounded in your allergies, medications, vitals, and records. Not medical
          advice.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="card">
            <p className="text-sm text-muted">
              Try: "What should I watch for with my current medications?", "Summarize my most
              recent lab results", "Is this food safe given my allergies?"
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={
                "inline-block max-w-full text-left px-4 py-3 rounded-xl border border-edge " +
                (m.role === "user" ? "bg-edge" : "bg-panel")
              }
            >
              <div className="text-[10px] uppercase tracking-wide text-muted mb-1">
                {m.role === "user" ? "You" : "Assistant"}
              </div>
              <div className="whitespace-pre-wrap text-sm">{m.content || "…"}</div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your health…"
          disabled={busy}
        />
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
