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
  selectedFoodIds: z
    .array(z.number().int())
    .min(1, "Select at least one proposed change.")
    .optional(),
});

/**
 * Confirms or cancels a change the assistant proposed. The pending status is
 * claimed inside the same transaction as the change so a double-submitted
 * confirmation can never apply twice.
 */
export async function resolveProposal(input: unknown) {
  const { messageId, conversationId, decision, selectedFoodIds } = parseInput(
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
    throw new InvalidInputError("Invalid action.");
  }
  const action = selectBatchItems(storedAction, selectedFoodIds);

  const foods = await prisma.$transaction(async (tx) => {
    await claimProposal(tx, messageId, "confirmed");
    const ids = actionFoodIds(action);
    const foods = await tx.food.findMany({ where: { id: { in: ids } } });
    if (foods.length !== new Set(ids).size) {
      throw new ConflictError("One or more food items no longer exist.");
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

function selectBatchItems(
  action: ProposedAction,
  selectedFoodIds: number[] | undefined
): ProposedAction {
  if (action.kind !== "batch" || selectedFoodIds === undefined) return action;

  const selectedIds = new Set(selectedFoodIds);
  if (
    selectedIds.size !== selectedFoodIds.length ||
    selectedFoodIds.some(
      (id) => !action.actions.some((item) => item.foodId === id)
    )
  ) {
    throw new InvalidInputError(
      "Selected changes must belong to this proposal."
    );
  }
  return {
    ...action,
    actions: action.actions.filter((item) => selectedIds.has(item.foodId)),
  };
}

async function applyAction(
  tx: Prisma.TransactionClient,
  action: ProposedAction
): Promise<unknown> {
  const source = FoodRemovalSource.assistant;
  switch (action.kind) {
    case "create":
      return tx.food.create({ data: foodSchema.parse(action.food) });
    case "update":
      return updateFoodAndRecordUsage(
        tx,
        action.foodId,
        foodSchema.partial().parse(action.changes),
        source
      );
    case "transfer":
      return transferFoodAmount(tx, action.foodId, {
        amount: action.amount,
        storage: action.targetStorage,
        expiry: action.targetExpiry,
      });
    case "delete":
      return removeFoodsAndRecord(
        tx,
        action.foodIds,
        action.removalReason,
        source
      );
    case "consolidate":
      return consolidateFoods(tx, action.foodIds, {
        primaryFoodId: action.primaryFoodId,
        allowDifferentExpiry: true,
      });
    case "batch":
      for (const item of action.actions) {
        if (item.kind === "update") {
          await updateFoodAndRecordUsage(
            tx,
            item.foodId,
            foodSchema.partial().parse(item.changes),
            source
          );
        } else {
          await removeFoodsAndRecord(
            tx,
            [item.foodId],
            item.removalReason,
            source
          );
        }
      }
  }
}
