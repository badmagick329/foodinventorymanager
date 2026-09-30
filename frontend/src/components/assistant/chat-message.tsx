"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import type { AssistantAction } from "@/lib/assistant";
import { formatAssistantCost } from "@/lib/assistant-cost";
import type { ChatMessage } from "./use-assistant-chat";

type BatchAction = Extract<AssistantAction, { kind: "batch" }>;

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h2>
  ),
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  a: ({ children, href }) => (
    <a className="text-primary underline underline-offset-2" href={href}>
      {children}
    </a>
  ),
};

export default function ChatMessageBubble({
  message,
  busy,
  onConfirm,
  onCancel,
}: {
  message: ChatMessage;
  busy: boolean;
  onConfirm: (action: AssistantAction) => void;
  onCancel: () => void;
}) {
  if (message.role === "user") {
    return (
      <div className="ml-8 rounded-lg bg-primary p-3 text-primary-foreground">
        <p className="whitespace-pre-wrap text-sm">{message.text}</p>
      </div>
    );
  }

  const pendingAction =
    message.actionStatus === "pending" &&
    message.action &&
    message.action.kind !== "none"
      ? message.action
      : null;

  return (
    <div className="mr-3 rounded-lg bg-secondary p-3">
      <ReactMarkdown components={markdownComponents}>
        {message.text || (busy ? "Thinking…" : "")}
      </ReactMarkdown>
      {message.usage && (
        <p
          className="mt-3 border-t pt-2 text-xs text-muted-foreground"
          title={message.model ?? undefined}
        >
          {typeof message.estimatedCostUsd === "number"
            ? formatAssistantCost(message.estimatedCostUsd)
            : "Cost unavailable"}{" "}
          · {message.usage.totalTokens.toLocaleString()} tokens
        </p>
      )}
      {pendingAction?.kind === "batch" && (
        <BatchReview
          action={pendingAction}
          busy={busy}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}
      {pendingAction && pendingAction.kind !== "batch" && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onConfirm(pendingAction)}
          >
            Confirm change
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

function batchItemSummary(item: BatchAction["actions"][number]) {
  if (item.kind === "delete") {
    return `Record as ${item.removalReason.replace("_", " ")}`;
  }
  return Object.entries(item.changes)
    .map(
      ([field, value]) =>
        `${field} → ${value === null ? "no expiry date" : value}`
    )
    .join(", ");
}

function BatchReview({
  action,
  busy,
  onConfirm,
  onCancel,
}: {
  action: BatchAction;
  busy: boolean;
  onConfirm: (action: BatchAction) => void;
  onCancel: () => void;
}) {
  const allIndexes = action.actions.map((_, index) => index);
  const [selected, setSelected] = useState(allIndexes);
  const selectedSet = new Set(selected);
  const toggle = (index: number) =>
    setSelected((items) =>
      items.includes(index)
        ? items.filter((item) => item !== index)
        : [...items, index]
    );

  return (
    <div className="mt-3 rounded-md border bg-background p-3">
      <p className="text-sm font-medium">
        Review {action.actions.length} proposed changes
      </p>
      <div className="mt-2 space-y-2">
        {action.actions.map((item, index) => (
          <label
            key={`${item.foodId}-${index}`}
            className="flex cursor-pointer gap-2 rounded-md border p-2 text-sm"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={selectedSet.has(index)}
              disabled={busy}
              onChange={() => toggle(index)}
            />
            <span>
              <span className="font-medium">
                {item.foodName ?? "Selected item"}
              </span>
              <span className="block text-muted-foreground">
                {batchItemSummary(item)}
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setSelected(allIndexes)}
        >
          Select all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setSelected([])}
        >
          Clear all
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy || selected.length === 0}
          onClick={() =>
            onConfirm({
              ...action,
              actions: action.actions.filter((_, index) =>
                selectedSet.has(index)
              ),
            })
          }
        >
          Confirm {selected.length} change{selected.length === 1 ? "" : "s"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
