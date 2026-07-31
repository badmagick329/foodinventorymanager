import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage, Food } from "@prisma/client";
import prisma from "../../../../prisma/client";
import { addBatchFoodNames, describeAction, isAssistantAction, type AssistantAction } from "@/lib/assistant";
import { estimateAssistantCost, getAssistantUsage } from "@/lib/assistant-cost";

export const runtime = "nodejs";

const reasoningEfforts = ["none", "low", "medium", "high", "xhigh", "max"] as const;
type ReasoningEffort = (typeof reasoningEfforts)[number];

function getReasoningEffort(): ReasoningEffort | null {
  const effort = process.env.OPENAI_REASONING_EFFORT ?? "low";
  return reasoningEfforts.includes(effort as ReasoningEffort) ? (effort as ReasoningEffort) : null;
}

function assistantConfiguration() {
  return {
    model: process.env.OPENAI_MODEL ?? "gpt-5.6-terra",
    reasoningEffort: process.env.OPENAI_REASONING_EFFORT ?? "low",
  };
}

const actionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "foodId", "foodIds", "primaryFoodId", "changes", "batchActions", "newFood"],
  properties: {
    kind: { type: "string", enum: ["update", "delete", "consolidate", "batch", "create"] },
    foodId: { type: ["integer", "null"] },
    foodIds: { type: "array", items: { type: "integer" } },
    primaryFoodId: { type: ["integer", "null"] },
    batchActions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "foodId", "changes"],
        properties: {
          kind: { type: "string", enum: ["update", "delete"] },
          foodId: { type: "integer" },
          changes: {
            type: "object",
            additionalProperties: false,
            required: ["name", "amount", "unit", "expiry", "storage"],
            properties: {
              name: { type: ["string", "null"] },
              amount: { type: ["number", "null"] },
              unit: { type: ["string", "null"] },
              expiry: { type: ["string", "null"] },
              storage: { type: ["string", "null"] },
            },
          },
        },
      },
    },
    newFood: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["name", "amount", "unit", "expiry", "storage"],
      properties: {
        name: { type: "string" },
        amount: { type: "number" },
        unit: { type: "string" },
        expiry: { type: ["string", "null"] },
        storage: { type: "string" },
      },
    },
    changes: {
      type: "object",
      additionalProperties: false,
      required: ["name", "amount", "unit", "expiry", "storage"],
      properties: {
        name: { type: ["string", "null"] },
        amount: { type: ["number", "null"] },
        unit: { type: ["string", "null"] },
        expiry: { type: ["string", "null"] },
        storage: { type: ["string", "null"] },
      },
    },
  },
} as const;

type ResponsesEvent = {
  type?: string;
  delta?: string;
  response?: {
    output?: Array<{ type?: string; name?: string; arguments?: string }>;
    usage?: unknown;
  };
  error?: { message?: string };
};

function normalizedChanges(value: unknown) {
  return Object.fromEntries(
    Object.entries((value ?? {}) as Record<string, unknown>).filter(([, value]) => value !== null)
  );
}

function normalizeAction(action: Record<string, unknown>) {
  if (action.kind === "create") return { kind: "create", food: action.newFood };
  if (action.kind === "delete") return { kind: "delete", foodIds: action.foodIds };
  if (action.kind === "consolidate") return { kind: "consolidate", foodIds: action.foodIds, primaryFoodId: action.primaryFoodId };
  if (action.kind === "batch") {
    return {
      kind: "batch",
      actions: ((action.batchActions ?? []) as Array<Record<string, unknown>>).map((item) => item.kind === "delete"
        ? { kind: "delete", foodId: item.foodId }
        : { kind: "update", foodId: item.foodId, changes: normalizedChanges(item.changes) }),
    };
  }
  return { kind: "update", foodId: action.foodId, changes: normalizedChanges(action.changes) };
}

function sse(controller: ReadableStreamDefaultController, encoder: TextEncoder, event: string, data: unknown) {
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ messages: [], ...assistantConfiguration() });
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return NextResponse.json({ messages: [], ...assistantConfiguration() }, { status: 404 });
  return NextResponse.json({
    conversationId: conversation.id,
    ...assistantConfiguration(),
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.content,
      action: message.action,
      model: message.model,
      usage: message.inputTokens === null ? null : {
        inputTokens: message.inputTokens,
        cachedInputTokens: message.cachedInputTokens,
        outputTokens: message.outputTokens,
        reasoningTokens: message.reasoningTokens,
        totalTokens: message.totalTokens,
      },
      estimatedCostUsd: message.estimatedCostUsd,
    })),
  });
}

export async function POST(request: NextRequest) {
  const { message, conversationId } = await request.json();
  if (typeof message !== "string" || message.trim() === "") {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  const reasoningEffort = getReasoningEffort();
  if (!reasoningEffort) {
    return NextResponse.json(
      { error: `OPENAI_REASONING_EFFORT must be one of: ${reasoningEfforts.join(", ")}.` },
      { status: 500 }
    );
  }

  let conversation: { id: string } | null;
  let foods: Food[];
  let savedMessages: ChatMessage[];
  try {
    conversation = conversationId
      ? await prisma.conversation.findUnique({ where: { id: conversationId } })
      : await prisma.conversation.create({ data: {} });
    if (!conversation) return NextResponse.json({ error: "That chat no longer exists. Start a new chat." }, { status: 404 });

    await prisma.chatMessage.create({ data: { conversationId: conversation.id, role: "user", content: message.trim() } });
    [foods, savedMessages] = await Promise.all([
      prisma.food.findMany({ orderBy: [{ expiry: "asc" }, { name: "asc" }] }),
      prisma.chatMessage.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
  } catch (error) {
    console.error("Could not prepare assistant conversation", error);
    return NextResponse.json({ error: "The assistant chat could not be prepared. Restart the app and try again." }, { status: 500 });
  }
  if (!conversation) return NextResponse.json({ error: "That chat no longer exists. Start a new chat." }, { status: 404 });
  const activeConversationId = conversation.id;
  const model = process.env.OPENAI_MODEL ?? "gpt-5.6-terra";
  const history = savedMessages.reverse().slice(0, -1).map((item) => `${item.role}: ${item.content}`).join("\n");
  const systemPrompt = [
    "You are the Food Inventory Assistant for one household.",
    "Use the prior conversation to resolve references such as 'that item'. Answer questions about the provided inventory.",
    "Never claim an update, deletion, consolidation, or addition has happened. For any requested write, call propose_inventory_action, then explain the proposed change and say it needs confirmation.",
    "Choose the best match only when it is clear. If an item is ambiguous or missing, ask a concise question and never silently ignore it. When a request contains both clear and unclear items, use a batch action for the clear updates or deletes and explicitly ask about the unresolved items in your reply.",
    "Use update for quantity, expiry, name, unit, or storage changes. Use delete for removals. Use consolidate only for same-name items with the same unit and storage. Do not consolidate entries with different expiry dates unless explicitly asked; the app will retain the earliest expiry.",
    "Use create to add a new food item only after you know its name, amount, unit, and storage. Expiry may be null. If any required detail is missing or unclear, ask a concise question instead of guessing.",
    "Use batch when the user requests two or more updates or deletes. Batch actions may contain only update or delete entries, must use each food ID at most once, and each entry is reviewed individually before one confirmation.",
    "For expiry reports and recipe suggestions, answer normally without calling a tool. For recipe requests, suggest at most three realistic recipes and use Markdown: a level-two heading per recipe, then **Use first**, **You have**, **Optional or missing**, and **Quick method**. Prioritise food that is past its date or expiring within seven days. Only list an ingredient as available when it appears in inventory; put everything else under optional or missing. Keep responses concise and kitchen-friendly.",
    `Today is ${new Date().toISOString().slice(0, 10)}. Inventory: ${JSON.stringify(foods)}.`,
    `Conversation:\n${history}`,
  ].join("\n\n");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      sse(controller, encoder, "conversation", { conversationId: activeConversationId });
      try {
        const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            reasoning: { effort: reasoningEffort },
            stream: true,
            tools: [{ type: "function", name: "propose_inventory_action", description: "Propose an inventory change or a batch of changes that the user must confirm before it is applied. For batch, put update/delete entries in batchActions. For create, put the complete new item in newFood. Leave unused top-level fields empty.", strict: true, parameters: actionSchema }],
            input: [
              { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
              { role: "user", content: [{ type: "input_text", text: message.trim() }] },
            ],
          }),
        });
        if (!openaiResponse.ok || !openaiResponse.body) {
          console.error("OpenAI response failed", openaiResponse.status, await openaiResponse.text());
          sse(controller, encoder, "error", { error: "The assistant is temporarily unavailable." });
          return;
        }

        const reader = openaiResponse.body.getReader();
        const decoder = new TextDecoder();
        let pending = "";
        let reply = "";
        let completedResponse: ResponsesEvent["response"];
        const processEvent = (block: string) => {
          const data = block.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
          if (!data || data === "[DONE]") return;
          const event = JSON.parse(data) as ResponsesEvent;
          if (event.type === "response.output_text.delta" && event.delta) {
            reply += event.delta;
            sse(controller, encoder, "delta", { delta: event.delta });
          }
          if (event.type === "response.completed") completedResponse = event.response;
          if (event.type === "error") throw new Error(event.error?.message ?? "OpenAI streaming error");
        };
        while (true) {
          const { value, done } = await reader.read();
          pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });
          const events = pending.split("\n\n");
          pending = events.pop() ?? "";
          events.forEach(processEvent);
          if (done) break;
        }
        if (pending.trim()) processEvent(pending);

        const call = completedResponse?.output?.find((item) => item.type === "function_call" && item.name === "propose_inventory_action");
        let action: AssistantAction = { kind: "none" };
        if (call?.arguments) {
          const proposed = normalizeAction(JSON.parse(call.arguments) as Record<string, unknown>);
          if (!isAssistantAction(proposed)) throw new Error("The assistant proposed an invalid action");
          action = addBatchFoodNames(proposed, foods);
        }
        const finalReply = reply.trim() || (action.kind === "none"
          ? "I couldn't produce a response. Please try again."
          : `${describeAction(action, foods)} Confirm this change to apply it.`);
        const usage = getAssistantUsage(completedResponse?.usage);
        const estimatedCostUsd = usage ? estimateAssistantCost(usage, model) : null;
        const saved = await prisma.chatMessage.create({ data: {
          conversationId: activeConversationId,
          role: "assistant",
          content: finalReply,
          action,
          model,
          ...usage,
          estimatedCostUsd,
        } });
        sse(controller, encoder, "complete", {
          id: saved.id,
          reply: saved.content,
          action,
          model: saved.model,
          usage: usage ?? null,
          estimatedCostUsd: saved.estimatedCostUsd,
        });
      } catch (error) {
        console.error("Assistant stream failed", error);
        sse(controller, encoder, "error", { error: "The assistant response could not be completed. Please try again." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Cache-Control": "no-cache", Connection: "keep-alive", "Content-Type": "text/event-stream" } });
}
