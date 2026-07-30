"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bot, MessageCircle, Plus, Send, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { AssistantAction } from "@/lib/assistant";

type Message = { id: string; role: "user" | "assistant"; text: string; action?: AssistantAction };
const conversationStorageKey = "foodinventory-assistant-conversation";

function readSseBlock(block: string) {
  const event = block.split("\n").find((line) => line.startsWith("event: "))?.slice(7);
  const data = block.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
  return event && data ? { event, data: JSON.parse(data) as Record<string, unknown> } : null;
}

export default function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  function rememberConversation(id: string) {
    setConversationId(id);
    window.localStorage.setItem(conversationStorageKey, id);
  }

  useEffect(() => {
    const savedId = window.localStorage.getItem(conversationStorageKey);
    if (!savedId) return;
    setLoadingHistory(true);
    fetch(`/api/assistant?conversationId=${encodeURIComponent(savedId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Saved chat not found");
        return response.json();
      })
      .then((data) => {
        rememberConversation(data.conversationId);
        setMessages(data.messages);
      })
      .catch(() => window.localStorage.removeItem(conversationStorageKey))
      .finally(() => setLoadingHistory(false));
  }, []);

  function newChat() {
    window.localStorage.removeItem(conversationStorageKey);
    setConversationId(null);
    setMessages([]);
    setError("");
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy) return;
    setMessage(""); setError(""); setBusy(true);
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text };
    const assistantMessageId = crypto.randomUUID();
    setMessages((items) => [...items, userMessage, { id: assistantMessageId, role: "assistant", text: "" }]);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      });
      if (!response.ok || !response.body) {
        const body = await response.text();
        let serverError = "The assistant is unavailable.";
        try {
          const data = JSON.parse(body) as { error?: unknown };
          if (typeof data.error === "string") serverError = data.error;
        } catch {
          // Next.js can return an empty or HTML error response before streaming begins.
        }
        throw new Error(serverError);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      const handleEvent = (block: string) => {
        const parsed = readSseBlock(block);
        if (!parsed) return;
        if (parsed.event === "conversation" && typeof parsed.data.conversationId === "string") rememberConversation(parsed.data.conversationId);
        if (parsed.event === "delta" && typeof parsed.data.delta === "string") {
          setMessages((items) => items.map((item) => item.id === assistantMessageId ? { ...item, text: item.text + parsed.data.delta } : item));
        }
        if (parsed.event === "complete") {
          setMessages((items) => items.map((item) => item.id === assistantMessageId ? {
            ...item,
            id: typeof parsed.data.id === "string" ? parsed.data.id : item.id,
            text: typeof parsed.data.reply === "string" ? parsed.data.reply : item.text,
            action: parsed.data.action as AssistantAction,
          } : item));
        }
        if (parsed.event === "error") throw new Error(typeof parsed.data.error === "string" ? parsed.data.error : "The assistant is unavailable.");
      };
      while (true) {
        const { value, done } = await reader.read();
        pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const blocks = pending.split("\n\n");
        pending = blocks.pop() ?? "";
        blocks.forEach(handleEvent);
        if (done) break;
      }
      if (pending.trim()) handleEvent(pending);
    } catch (err) {
      setMessages((items) => items.filter((item) => item.id !== assistantMessageId));
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  async function confirm(action: AssistantAction) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/assistant/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, conversationId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await queryClient.invalidateQueries({ queryKey: ["foods"] });
      setMessages((items) => [...items.map((item) => item.action === action ? { ...item, action: { kind: "none" } as AssistantAction } : item), { id: crypto.randomUUID(), role: "assistant", text: data.message }]);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not apply that change."); }
    finally { setBusy(false); }
  }

  return <>
    <Button className="fixed bottom-5 right-5 z-30 h-12 rounded-full px-5 shadow-lg" onClick={() => setOpen(true)}><MessageCircle /> Ask inventory</Button>
    {open && <section className="fixed bottom-4 right-4 z-40 flex h-[min(680px,calc(100vh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
      <header className="flex items-center justify-between border-b bg-black px-4 py-3"><div className="flex items-center gap-2 font-semibold"><Bot className="text-primary" /> Inventory assistant</div><div className="flex gap-1"><Button variant="ghost" size="sm" disabled={busy} onClick={newChat}><Plus /> New chat</Button><Button variant="ghost" size="icon" aria-label="Close assistant" onClick={() => setOpen(false)}><X /></Button></div></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loadingHistory && <p className="text-sm text-muted-foreground">Loading chat…</p>}
        {!loadingHistory && messages.length === 0 && <p className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">Ask what is expiring soon, or request an update such as “set milk expiry to 2026-08-03”. Every change is shown for your confirmation.</p>}
        {messages.map((item) => <div key={item.id} className={item.role === "user" ? "ml-8 rounded-lg bg-primary p-3 text-primary-foreground" : "mr-3 rounded-lg bg-secondary p-3"}><p className="whitespace-pre-wrap text-sm">{item.text || (busy ? "Thinking…" : "")}</p>{item.action && item.action.kind !== "none" && <div className="mt-3 flex gap-2"><Button size="sm" disabled={busy} onClick={() => confirm(item.action!)}>Confirm change</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => setMessages((items) => items.map((message) => message.id === item.id ? { ...message, action: { kind: "none" } } : message))}>Cancel</Button></div>}</div>)}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <form className="flex gap-2 border-t p-3" onSubmit={send}><input className="h-9 flex-1 rounded-md border bg-background px-3 text-sm" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about your food…" /><Button size="icon" disabled={busy || !message.trim()} aria-label="Send message"><Send /></Button></form>
    </section>}
  </>;
}
