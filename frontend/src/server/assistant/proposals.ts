import { FoodRemovalSource, Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/server/db";
import {
  ConflictError,
  InvalidInputError,
  NotFoundError,
  parseInput,
} from "@/server/errors";
import {
  actionFoodIds,
  describeAction,
  isAssistantAction,
  type AssistantAction,
  type ProposedChange,
} from "@/lib/assistant";
import { foodSchema } from "@/lib/validators";
import { consolidateFoods } from "@/server/inventory/consolidation";
import { transferFoodAmount } from "@/server/inventory/transfers";
import {
  removeFoodsAndRecord,
  updateFoodAndRecordUsage,
} from "@/server/inventory/usage";

type ProposedAction = Exclude<AssistantAction, { kind: "none" }>;

const decisionSchema = z.object({
  messageId: z.string({ message: "A proposed chat message is required." }),
  conversationId: z.string({ message: "A proposed chat message is required." }),
  decision: z.enum(["confirm", "cancel"]).default("confirm"),
  // Positions in the proposal's item list: creates have no food ID to key on.
  selectedIndexes: z
    .array(z.number().int().nonnegative())
    .min(1, "Select at least one proposed change.")
    .optional(),
});

/**
 * Confirms or cancels a change the assistant proposed. The pending status is
 * claimed inside the same transaction as the change so a double-submitted
 * confirmation can never apply twice.
 */
export async function resolveProposal(input: unknown) {
  const { messageId, conversationId, decision, selectedIndexes } = parseInput(
    decisionSchema,
    input
  );
  const proposal = await prisma.chatMessage.findFirst({
    where: { id: messageId, conversationId, role: "assistant" },
  });
  if (!proposal) {
    throw new NotFoundError("That proposed change could not be found.");
  }
  if (proposal.actionStatus !== "pending") {
    throw new ConflictError("That proposed change has already been resolved.");
  }

  if (decision === "cancel") {
    await claimProposal(prisma, messageId, "cancelled");
    return "Change cancelled.";
  }

  const storedAction: unknown = proposal.action;
  if (!isAssistantAction(storedAction) || storedAction.kind === "none") {
    throw new InvalidInputError(
      "This proposal is no longer valid. Ask the assistant again."
    );
  }
  const action = selectItems(storedAction, selectedIndexes);

  const foods = await prisma.$transaction(async (tx) => {
    await claimProposal(tx, messageId, "confirmed");
    const ids = actionFoodIds(action);
    const foods = await tx.food.findMany({ where: { id: { in: ids } } });
    if (foods.length !== new Set(ids).size) {
      throw new ConflictError("One or more foods no longer exist.");
    }
    await applyAction(tx, action);
    return foods;
  });

  const message = `Done — ${describeAction(action, foods)}`;
  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "assistant",
      content: message,
      actionStatus: "confirmed",
    },
  });
  return message;
}

async function claimProposal(
  db: Prisma.TransactionClient,
  messageId: string,
  status: "confirmed" | "cancelled"
) {
  const claimed = await db.chatMessage.updateMany({
    where: { id: messageId, actionStatus: "pending" },
    data: { actionStatus: status },
  });
  if (claimed.count !== 1) {
    throw new ConflictError("That proposed change has already been resolved.");
  }
}

function selectItems(
  action: ProposedAction,
  selectedIndexes: number[] | undefined
): ProposedAction {
  if (action.kind !== "changes" || selectedIndexes === undefined) return action;

  const selected = new Set(selectedIndexes);
  if (
    selected.size !== selectedIndexes.length ||
    selectedIndexes.some((index) => index >= action.items.length)
  ) {
    throw new InvalidInputError(
      "Selected changes must belong to this proposal."
    );
  }
  return {
    ...action,
    items: action.items.filter((_, index) => selected.has(index)),
  };
}

async function applyAction(
  tx: Prisma.TransactionClient,
  action: ProposedAction
) {
  if (action.kind === "consolidate") {
    await consolidateFoods(tx, action.foodIds, {
      primaryFoodId: action.primaryFoodId,
      allowDifferentExpiry: true,
    });
    return;
  }
  for (const item of action.items) await applyChange(tx, item);
}

async function applyChange(
  tx: Prisma.TransactionClient,
  item: ProposedChange
): Promise<unknown> {
  const source = FoodRemovalSource.assistant;
  switch (item.kind) {
    case "create":
      return tx.food.create({ data: foodSchema.parse(item.food) });
    case "update":
      return updateFoodAndRecordUsage(
        tx,
        item.foodId,
        foodSchema.partial().parse(item.changes),
        source
      );
    case "transfer":
      return transferFoodAmount(tx, item.foodId, {
        amount: item.amount,
        storage: item.targetStorage,
        expiry: item.targetExpiry,
      });
    case "delete":
      return removeFoodsAndRecord(
        tx,
        [item.foodId],
        item.removalReason,
        source
      );
  }
}
