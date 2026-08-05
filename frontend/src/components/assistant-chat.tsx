"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Bot, CircleHelp, Maximize2, MessageCircle, Minimize2, Send, SquarePen, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { AssistantAction } from "@/lib/assistant";
import { formatAssistantCost, type AssistantUsage } from "@/lib/assistant-cost";

type ActionStatus = "pending" | "confirmed" | "cancelled";
type Message = { id: string; role: "user" | "assistant"; text: string; action?: AssistantAction; actionStatus?: ActionStatus; model?: string | null; usage?: AssistantUsage | null; estimatedCostUsd?: number | null };
const conversationStorageKey = "foodinventory-assistant-conversation";
type AssistantConfiguration = { model: string; reasoningEffort: string };
type BatchAction = Extract<AssistantAction, { kind: "batch" }>;

function readSseBlock(block: string) {
  const event = block.split("\n").find((line) => line.startsWith("event: "))?.slice(7);
  const data = block.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
  return event && data ? { event, data: JSON.parse(data) as Record<string, unknown> } : null;
}

function createMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function batchItemSummary(item: BatchAction["actions"][number]) {
  if (item.kind === "delete") return `Record as ${item.removalReason.replace("_", " ")}`;
  return Object.entries(item.changes).map(([field, value]) => `${field} → ${value === null ? "no expiry date" : value}`).join(", ");
}

function BatchReview({ action, busy, onConfirm, onCancel }: { action: BatchAction; busy: boolean; onConfirm: (action: BatchAction) => void; onCancel: () => void }) {
  const [selected, setSelected] = useState(() => action.actions.map((_, index) => index));
  const selectedSet = new Set(selected);
  const selectedAction = { ...action, actions: action.actions.filter((_, index) => selectedSet.has(index)) } as BatchAction;
  const toggle = (index: number) => setSelected((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index]);

  return <div className="mt-3 rounded-md border bg-background p-3">
    <p className="text-sm font-medium">Review {action.actions.length} proposed changes</p>
    <div className="mt-2 space-y-2">
      {action.actions.map((item, index) => <label key={`${item.foodId}-${index}`} className="flex cursor-pointer gap-2 rounded-md border p-2 text-sm">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={selectedSet.has(index)} disabled={busy} onChange={() => toggle(index)} />
        <span><span className="font-medium">{item.foodName ?? "Selected item"}</span><span className="block text-muted-foreground">{batchItemSummary(item)}</span></span>
      </label>)}
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setSelected(action.actions.map((_, index) => index))}>Select all</Button>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setSelected([])}>Clear all</Button>
      <Button type="button" size="sm" disabled={busy || selected.length === 0} onClick={() => onConfirm(selectedAction)}>Confirm {selected.length} change{selected.length === 1 ? "" : "s"}</Button>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onCancel}>Cancel</Button>
    </div>
  </div>;
}

export default function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [configuration, setConfiguration] = useState<AssistantConfiguration | null>(null);
  const queryClient = useQueryClient();
  const chatCost = useMemo(() => messages.reduce((total, item) => total + (item.estimatedCostUsd ?? 0), 0), [messages]);
  const chatTokens = useMemo(() => messages.reduce((total, item) => total + (item.usage?.totalTokens ?? 0), 0), [messages]);
  const hasUsage = messages.some((item) => item.usage);
  const hasCost = messages.some((item) => typeof item.estimatedCostUsd === "number");

  function rememberConversation(id: string) {
    setConversationId(id);
    window.localStorage.setItem(conversationStorageKey, id);
  }

  useEffect(() => {
    fetch("/api/assistant")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (typeof data?.model === "string" && typeof data?.reasoningEffort === "string") {
          setConfiguration({ model: data.model, reasoningEffort: data.reasoningEffort });
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const previousPadding = document.body.style.paddingBottom;
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const reserveComposerSpace = () => {
      document.body.style.paddingBottom = open && compact && mediaQuery.matches ? "5.5rem" : previousPadding;
    };
    reserveComposerSpace();
    mediaQuery.addEventListener("change", reserveComposerSpace);
    return () => {
      mediaQuery.removeEventListener("change", reserveComposerSpace);
      document.body.style.paddingBottom = previousPadding;
    };
  }, [compact, open]);

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

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy) return;
    setMessage(""); setError(""); setBusy(true);
    const userMessage: Message = { id: createMessageId(), role: "user", text };
    const assistantMessageId = createMessageId();
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
          const action = parsed.data.action as AssistantAction;
          setMessages((items) => items.map((item) => item.id === assistantMessageId ? {
            ...item,
            id: typeof parsed.data.id === "string" ? parsed.data.id : item.id,
            text: typeof parsed.data.reply === "string" ? parsed.data.reply : item.text,
            action,
            actionStatus: parsed.data.actionStatus as ActionStatus,
            model: typeof parsed.data.model === "string" ? parsed.data.model : null,
            usage: parsed.data.usage as AssistantUsage | null,
            estimatedCostUsd: typeof parsed.data.estimatedCostUsd === "number" ? parsed.data.estimatedCostUsd : null,
          } : item));
          if (action && action.kind !== "none") setCompact(false);
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

  async function confirm(messageId: string, action: AssistantAction) {
    setBusy(true); setError("");
    try {
      const selectedFoodIds = action.kind === "batch" ? action.actions.map((item) => item.foodId) : undefined;
      const response = await fetch("/api/assistant/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId, conversationId, selectedFoodIds }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await queryClient.invalidateQueries({ queryKey: ["foods"] });
      setMessages((items) => [...items.map((item) => item.id === messageId ? { ...item, actionStatus: "confirmed" as ActionStatus } : item), { id: createMessageId(), role: "assistant", text: data.message }]);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not apply that change."); }
    finally { setBusy(false); }
  }

  async function cancel(messageId: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/assistant/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId, conversationId, decision: "cancel" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessages((items) => items.map((item) => item.id === messageId ? { ...item, actionStatus: "cancelled" as ActionStatus } : item));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not cancel that change."); }
    finally { setBusy(false); }
  }

  return <>
    {!open && <Button className="fixed bottom-5 right-5 z-30 h-12 rounded-full px-5 shadow-lg" onClick={() => { setCompact(false); setOpen(true); }}><MessageCircle /> Ask inventory</Button>}
    {open && compact && <form className="fixed bottom-4 left-3 right-3 z-40 flex gap-2 rounded-xl border bg-background p-2 shadow-2xl sm:hidden" onSubmit={send}>
      <Button type="button" size="icon" variant="ghost" aria-label="Expand assistant" onClick={() => setCompact(false)}><Maximize2 /></Button>
      <Textarea autoFocus rows={1} className="min-h-9 min-w-0 flex-1 resize-y py-2 text-sm" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Ask about your food…" />
      <Button size="icon" disabled={busy || !message.trim()} aria-label="Send message"><Send /></Button>
    </form>}
    {open && !compact && <section className="fixed bottom-4 right-4 z-40 flex h-[min(680px,calc(100vh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl max-sm:bottom-4 max-sm:left-3 max-sm:right-3 max-sm:h-[min(680px,calc(100vh-2rem))] max-sm:w-auto">
      <header className="flex items-center justify-between border-b bg-black px-3 py-3 sm:px-4"><Bot className="shrink-0 text-primary" aria-label="Inventory assistant" /><div className="flex shrink-0 items-center gap-1"><Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="What can the assistant do?" title="What can I do?"><CircleHelp /></Button></PopoverTrigger><PopoverContent align="end"><h2 className="font-semibold">What can I do?</h2><p className="mt-1 text-sm text-muted-foreground">Ask about your inventory or request a change. I’ll always ask for confirmation before changing it.</p><ul className="mt-3 space-y-1 text-sm"><li>• Check what is expiring soon</li><li>• Add items</li><li>• Update quantities or expiry dates</li><li>• Delete items</li><li>• Review bulk updates or deletes</li><li>• Consolidate duplicate entries</li><li>• Suggest recipes from your food</li></ul>{configuration && <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">Using <span className="font-medium text-foreground">{configuration.model}</span> with <span className="font-medium text-foreground">{configuration.reasoningEffort}</span> reasoning.</p>}</PopoverContent></Popover><Button className="sm:hidden" variant="ghost" size="icon" aria-label="Minimize assistant" title="Minimize assistant" onClick={() => setCompact(true)}><Minimize2 /></Button><Button variant="ghost" size="icon" disabled={busy} aria-label="New chat" title="New chat" onClick={newChat}><SquarePen /></Button><Button variant="ghost" size="icon" aria-label="Close assistant" title="Close assistant" onClick={() => setOpen(false)}><X /></Button></div></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loadingHistory && <p className="text-sm text-muted-foreground">Loading chat…</p>}
        {hasUsage && <p className="text-xs text-muted-foreground">This chat: {hasCost ? formatAssistantCost(chatCost) : "cost unavailable"} · {chatTokens.toLocaleString()} tokens</p>}
        {messages.map((item) => <div key={item.id} className={item.role === "user" ? "ml-8 rounded-lg bg-primary p-3 text-primary-foreground" : "mr-3 rounded-lg bg-secondary p-3"}>{item.role === "assistant" ? <ReactMarkdown components={{ h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h2>, p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>, ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>, ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>, li: ({ children }) => <li>{children}</li>, strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>, a: ({ children, href }) => <a className="text-primary underline underline-offset-2" href={href}>{children}</a> }}>{item.text || (busy ? "Thinking…" : "")}</ReactMarkdown> : <p className="whitespace-pre-wrap text-sm">{item.text}</p>}{item.role === "assistant" && item.usage && <p className="mt-3 border-t pt-2 text-xs text-muted-foreground" title={item.model ?? undefined}>{typeof item.estimatedCostUsd === "number" ? formatAssistantCost(item.estimatedCostUsd) : "Cost unavailable"} · {item.usage.totalTokens.toLocaleString()} tokens</p>}{item.actionStatus === "pending" && item.action && item.action.kind === "batch" && <BatchReview action={item.action} busy={busy} onConfirm={(action) => confirm(item.id, action)} onCancel={() => cancel(item.id)} />}{item.actionStatus === "pending" && item.action && item.action.kind !== "none" && item.action.kind !== "batch" && <div className="mt-3 flex gap-2"><Button size="sm" disabled={busy} onClick={() => confirm(item.id, item.action!)}>Confirm change</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => cancel(item.id)}>Cancel</Button></div>}</div>)}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <form className="flex items-end gap-2 border-t p-3" onSubmit={send}><Textarea rows={2} className="min-h-12 max-h-36 flex-1 resize-y py-2 text-sm sm:min-h-[60px] sm:max-h-48" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Ask about your food…" /><Button size="icon" disabled={busy || !message.trim()} aria-label="Send message"><Send /></Button></form>
    </section>}
  </>;
}
