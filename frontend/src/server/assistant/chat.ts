import type { Food } from "@prisma/client";
import { z } from "zod";
import prisma from "@/server/db";
import { NotFoundError, parseInput } from "@/server/errors";
import { FOOD_ORDER } from "@/server/inventory/foods";
import { describeAction, type AssistantAction } from "@/lib/assistant";
import { estimateAssistantCost, getAssistantUsage } from "@/lib/assistant-cost";
import {
  assistantConfiguration,
  requireAssistantSettings,
  type AssistantSettings,
} from "./config";
import { parseProposedAction } from "./action-tool";
import { streamAssistantResponse } from "./openai";
import { buildSystemPrompt } from "./prompt";

const HISTORY_LIMIT = 20;

const turnInputSchema = z.object({
  message: z.string().trim().min(1, "A message is required."),
  conversationId: z.string().nullish(),
});

export async function getConversationView(conversationId: string | null) {
  const configuration = assistantConfiguration();
  if (!conversationId) return { messages: [], ...configuration };

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) throw new NotFoundError("Chat not found.");

  return {
    conversationId: conversation.id,
    ...configuration,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.content,
      action: message.action,
      actionStatus: message.actionStatus,
      model: message.model,
      usage:
        message.inputTokens === null
          ? null
          : {
              inputTokens: message.inputTokens,
              cachedInputTokens: message.cachedInputTokens,
              outputTokens: message.outputTokens,
              reasoningTokens: message.reasoningTokens,
              totalTokens: message.totalTokens,
            },
      estimatedCostUsd: message.estimatedCostUsd,
    })),
  };
}

export type AssistantTurn = {
  conversationId: string;
  message: string;
  settings: AssistantSettings;
  foods: Food[];
  history: string;
};

/**
 * Everything that can fail with a caller-facing error happens here, before
 * the response switches to a stream and can no longer carry a status code.
 */
export async function startAssistantTurn(
  input: unknown
): Promise<AssistantTurn> {
  const { message, conversationId } = parseInput(turnInputSchema, input);
  const settings = requireAssistantSettings();

  const conversation = conversationId
    ? await prisma.conversation.findUnique({ where: { id: conversationId } })
    : await prisma.conversation.create({ data: {} });
  if (!conversation) {
    throw new NotFoundError("That chat no longer exists. Start a new chat.");
  }

  await prisma.chatMessage.create({
    data: { conversationId: conversation.id, role: "user", content: message },
  });
  const [foods, recentMessages] = await Promise.all([
    prisma.food.findMany({ orderBy: FOOD_ORDER }),
    prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    }),
  ]);
  const history = recentMessages
    .reverse()
    .slice(0, -1)
    .map((item) => `${item.role}: ${item.content}`)
    .join("\n");

  return { conversationId: conversation.id, message, settings, foods, history };
}

export async function completeAssistantTurn(
  turn: AssistantTurn,
  onDelta: (delta: string) => void
) {
  const { reply, toolArguments, usage } = await streamAssistantResponse({
    settings: turn.settings,
    systemPrompt: buildSystemPrompt({
      foods: turn.foods,
      history: turn.history,
      today: new Date().toISOString().slice(0, 10),
    }),
    message: turn.message,
    onDelta,
  });

  const action: AssistantAction = toolArguments
    ? parseProposedAction(toolArguments, turn.foods)
    : { kind: "none" };
  const content =
    reply.trim() ||
    (action.kind === "none"
      ? "I couldn't produce a response. Please try again."
      : `${describeAction(action, turn.foods)} Confirm this change to apply it.`);
  const tokenUsage = getAssistantUsage(usage);
  const estimatedCostUsd = tokenUsage
    ? estimateAssistantCost(tokenUsage, turn.settings.model)
    : null;

  const saved = await prisma.chatMessage.create({
    data: {
      conversationId: turn.conversationId,
      role: "assistant",
      content,
      action,
      actionStatus: action.kind === "none" ? "confirmed" : "pending",
      model: turn.settings.model,
      ...tokenUsage,
      estimatedCostUsd,
    },
  });

  return {
    id: saved.id,
    reply: saved.content,
    action,
    actionStatus: saved.actionStatus,
    model: saved.model,
    usage: tokenUsage ?? null,
    estimatedCostUsd: saved.estimatedCostUsd,
  };
}
