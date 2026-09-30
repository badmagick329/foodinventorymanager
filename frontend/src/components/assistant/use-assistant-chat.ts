"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AssistantAction } from "@/lib/assistant";
import type { AssistantUsage } from "@/lib/assistant-cost";
import { apiFetch } from "@/lib/api-client";
import { API_ASSISTANT_CONFIRM_URL, API_ASSISTANT_URL } from "@/lib/urls";

export type ActionStatus = "pending" | "confirmed" | "cancelled";
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  action?: AssistantAction;
  actionStatus?: ActionStatus;
  model?: string | null;
  usage?: AssistantUsage | null;
  estimatedCostUsd?: number | null;
};
export type AssistantConfiguration = { model: string; reasoningEffort: string };

type ConversationView = AssistantConfiguration & {
  conversationId?: string;
  messages: ChatMessage[];
};
type CompletedTurn = {
  id: string;
  reply: string;
  action: AssistantAction;
  actionStatus: ActionStatus;
  model: string | null;
  usage: AssistantUsage | null;
  estimatedCostUsd: number | null;
};

const conversationStorageKey = "foodinventory-assistant-conversation";

/**
 * Owns the chat transcript and its server round-trips so the chat UI only
 * renders. The active conversation id is remembered in localStorage so a
 * reload resumes the same chat.
 */
export default function useAssistantChat() {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [configuration, setConfiguration] =
    useState<AssistantConfiguration | null>(null);

  function rememberConversation(id: string) {
    setConversationId(id);
    window.localStorage.setItem(conversationStorageKey, id);
  }

  useEffect(() => {
    apiFetch<ConversationView>(API_ASSISTANT_URL)
      .then(({ model, reasoningEffort }) =>
        setConfiguration({ model, reasoningEffort })
      )
      .catch(() => undefined);

    const savedId = window.localStorage.getItem(conversationStorageKey);
    if (!savedId) return;
    setLoadingHistory(true);
    apiFetch<ConversationView>(
      `${API_ASSISTANT_URL}?conversationId=${encodeURIComponent(savedId)}`
    )
      .then((view) => {
        rememberConversation(savedId);
        setMessages(view.messages);
      })
      .catch(() => window.localStorage.removeItem(conversationStorageKey))
      .finally(() => setLoadingHistory(false));
  }, []);

  const usageSummary = useMemo(() => {
    const withUsage = messages.filter((item) => item.usage);
    if (withUsage.length === 0) return null;
    const hasCost = messages.some(
      (item) => typeof item.estimatedCostUsd === "number"
    );
    return {
      cost: hasCost
        ? messages.reduce(
            (total, item) => total + (item.estimatedCostUsd ?? 0),
            0
          )
        : null,
      tokens: withUsage.reduce(
        (total, item) => total + (item.usage?.totalTokens ?? 0),
        0
      ),
    };
  }, [messages]);

  function newChat() {
    window.localStorage.removeItem(conversationStorageKey);
    setConversationId(null);
    setMessages([]);
    setError("");
  }

  function updateMessage(id: string, changes: Partial<ChatMessage>) {
    setMessages((items) =>
      items.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
  }

  /** Resolves with the completed turn, or null if the send failed. */
  async function send(text: string) {
    setError("");
    setBusy(true);
    const pendingId = createMessageId();
    setMessages((items) => [
      ...items,
      { id: createMessageId(), role: "user", text },
      { id: pendingId, role: "assistant", text: "" },
    ]);
    try {
      const response = await fetch(API_ASSISTANT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      });
      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "The assistant is unavailable."
        );
      }

      let completed: CompletedTurn | null = null;
      for await (const { event, data } of readEvents(response.body)) {
        if (event === "conversation") {
          rememberConversation(data.conversationId as string);
        } else if (event === "delta") {
          setMessages((items) =>
            items.map((item) =>
              item.id === pendingId
                ? { ...item, text: item.text + (data.delta as string) }
                : item
            )
          );
        } else if (event === "complete") {
          completed = data as CompletedTurn;
          const turn = completed;
          setMessages((items) =>
            items.map((item) =>
              item.id === pendingId
                ? {
                    ...item,
                    id: turn.id,
                    text: turn.reply,
                    action: turn.action,
                    actionStatus: turn.actionStatus,
                    model: turn.model,
                    usage: turn.usage,
                    estimatedCostUsd: turn.estimatedCostUsd,
                  }
                : item
            )
          );
        } else if (event === "error") {
          throw new Error(data.error as string);
        }
      }
      return completed;
    } catch (err) {
      setMessages((items) => items.filter((item) => item.id !== pendingId));
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function resolve(
    messageId: string,
    body: Record<string, unknown>,
    onResolved: (message: string) => void
  ) {
    setBusy(true);
    setError("");
    try {
      const { message } = await apiFetch<{ message: string }>(
        API_ASSISTANT_CONFIRM_URL,
        { method: "POST", json: { messageId, conversationId, ...body } }
      );
      onResolved(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function confirm(messageId: string, action: AssistantAction) {
    const selectedFoodIds =
      action.kind === "batch"
        ? action.actions.map((item) => item.foodId)
        : undefined;
    return resolve(messageId, { selectedFoodIds }, (message) => {
      // A confirmed change can touch any inventory view.
      queryClient.invalidateQueries();
      updateMessage(messageId, { actionStatus: "confirmed" });
      setMessages((items) => [
        ...items,
        { id: createMessageId(), role: "assistant", text: message },
      ]);
    });
  }

  function cancel(messageId: string) {
    return resolve(messageId, { decision: "cancel" }, () =>
      updateMessage(messageId, { actionStatus: "cancelled" })
    );
  }

  return {
    messages,
    busy,
    loadingHistory,
    error,
    configuration,
    usageSummary,
    newChat,
    send,
    confirm,
    cancel,
  };
}

function createMessageId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // randomUUID is unavailable on plain-http LAN origins.
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function* readEvents(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  while (true) {
    const { value, done } = await reader.read();
    pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const blocks = pending.split("\n\n");
    pending = done ? "" : (blocks.pop() ?? "");
    for (const block of blocks) {
      const lines = block.split("\n");
      const event = lines.find((line) => line.startsWith("event: "))?.slice(7);
      const data = lines.find((line) => line.startsWith("data: "))?.slice(6);
      if (event && data) {
        yield { event, data: JSON.parse(data) as Record<string, unknown> };
      }
    }
    if (done) return;
  }
}
