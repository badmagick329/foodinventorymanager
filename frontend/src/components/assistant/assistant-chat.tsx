"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import {
  Bot,
  CircleHelp,
  Maximize2,
  MessageCircle,
  Minimize2,
  Send,
  SquarePen,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { formatAssistantCost } from "@/lib/assistant-cost";
import ChatMessageBubble from "./chat-message";
import useAssistantChat, {
  type AssistantConfiguration,
} from "./use-assistant-chat";

export default function AssistantChat() {
  const chat = useAssistantChat();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [draft, setDraft] = useState("");

  useCompactComposerSpace(open && compact);

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || chat.busy) return;
    setDraft("");
    const turn = await chat.send(text);
    // Proposed changes need the full panel to review and confirm.
    if (turn && turn.action.kind !== "none") setCompact(false);
  }

  const composer = {
    value: draft,
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setDraft(event.target.value),
    onKeyDown: submitOnModifierEnter,
    placeholder: "Ask about your food…",
  };
  const sendButton = (
    <Button
      size="icon"
      disabled={chat.busy || !draft.trim()}
      aria-label="Send message"
    >
      <Send />
    </Button>
  );

  if (!open) {
    return (
      <Button
        className="fixed bottom-5 right-5 z-30 h-12 rounded-full px-5 shadow-lg"
        onClick={() => {
          setCompact(false);
          setOpen(true);
        }}
      >
        <MessageCircle /> Ask inventory
      </Button>
    );
  }

  if (compact) {
    return (
      <form
        className="fixed bottom-4 left-3 right-3 z-40 flex gap-2 rounded-xl border bg-background p-2 shadow-2xl sm:hidden"
        onSubmit={send}
      >
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Expand assistant"
          onClick={() => setCompact(false)}
        >
          <Maximize2 />
        </Button>
        <Textarea
          autoFocus
          rows={1}
          className="min-h-9 min-w-0 flex-1 resize-y py-2 text-sm"
          {...composer}
        />
        {sendButton}
      </form>
    );
  }

  return (
    <section className="fixed bottom-4 right-4 z-40 flex h-[min(680px,calc(100vh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl max-sm:left-3 max-sm:right-3 max-sm:w-auto">
      <header className="flex items-center justify-between border-b bg-black px-3 py-3 sm:px-4">
        <Bot
          className="shrink-0 text-primary"
          aria-label="Inventory assistant"
        />
        <div className="flex shrink-0 items-center gap-1">
          <HelpPopover configuration={chat.configuration} />
          <Button
            className="sm:hidden"
            variant="ghost"
            size="icon"
            aria-label="Minimize assistant"
            title="Minimize assistant"
            onClick={() => setCompact(true)}
          >
            <Minimize2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={chat.busy}
            aria-label="New chat"
            title="New chat"
            onClick={chat.newChat}
          >
            <SquarePen />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close assistant"
            title="Close assistant"
            onClick={() => setOpen(false)}
          >
            <X />
          </Button>
        </div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {chat.loadingHistory && (
          <p className="text-sm text-muted-foreground">Loading chat…</p>
        )}
        {chat.usageSummary && (
          <p className="text-xs text-muted-foreground">
            This chat:{" "}
            {chat.usageSummary.cost === null
              ? "cost unavailable"
              : formatAssistantCost(chat.usageSummary.cost)}{" "}
            · {chat.usageSummary.tokens.toLocaleString()} tokens
          </p>
        )}
        {chat.messages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            busy={chat.busy}
            onConfirm={(action) => chat.confirm(message.id, action)}
            onCancel={() => chat.cancel(message.id)}
          />
        ))}
        {chat.error && <p className="text-sm text-destructive">{chat.error}</p>}
      </div>
      <form className="flex items-end gap-2 border-t p-3" onSubmit={send}>
        <Textarea
          rows={2}
          className="min-h-12 max-h-36 flex-1 resize-y py-2 text-sm sm:max-h-48 sm:min-h-[60px]"
          {...composer}
        />
        {sendButton}
      </form>
    </section>
  );
}

function submitOnModifierEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }
}

/** Keeps page content scrollable above the floating mobile composer. */
function useCompactComposerSpace(active: boolean) {
  useEffect(() => {
    const previousPadding = document.body.style.paddingBottom;
    const mobile = window.matchMedia("(max-width: 639px)");
    const apply = () => {
      document.body.style.paddingBottom =
        active && mobile.matches ? "5.5rem" : previousPadding;
    };
    apply();
    mobile.addEventListener("change", apply);
    return () => {
      mobile.removeEventListener("change", apply);
      document.body.style.paddingBottom = previousPadding;
    };
  }, [active]);
}

function HelpPopover({
  configuration,
}: {
  configuration: AssistantConfiguration | null;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="What can the assistant do?"
          title="What can I do?"
        >
          <CircleHelp />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <h2 className="font-semibold">What can I do?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask about your inventory or request a change. I’ll always ask for
          confirmation before changing it.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• Check what is expiring soon</li>
          <li>• Add items</li>
          <li>• Update quantities or expiry dates</li>
          <li>• Delete items</li>
          <li>• Review bulk updates or deletes</li>
          <li>• Consolidate duplicate entries</li>
          <li>• Suggest recipes from your food</li>
        </ul>
        {configuration && (
          <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
            Using{" "}
            <span className="font-medium text-foreground">
              {configuration.model}
            </span>{" "}
            with{" "}
            <span className="font-medium text-foreground">
              {configuration.reasoningEffort}
            </span>{" "}
            reasoning.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
