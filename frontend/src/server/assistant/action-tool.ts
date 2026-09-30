import type { Food } from "@prisma/client";
import {
  addBatchFoodNames,
  isAssistantAction,
  type AssistantAction,
} from "@/lib/assistant";

/**
 * OpenAI strict function calling requires every property to be present, so
 * the tool takes one flat object with nullable fields for every action kind.
 * `parseProposedAction` maps it back onto the app's `AssistantAction` union.
 */
const actionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "kind",
    "foodId",
    "foodIds",
    "primaryFoodId",
    "removalReason",
    "changes",
    "batchActions",
    "newFood",
    "amount",
    "targetStorage",
    "targetExpiry",
  ],
  properties: {
    kind: {
      type: "string",
      enum: ["update", "delete", "consolidate", "batch", "create", "transfer"],
    },
    foodId: { type: ["integer", "null"] },
    foodIds: { type: "array", items: { type: "integer" } },
    primaryFoodId: { type: ["integer", "null"] },
    removalReason: {
      type: ["string", "null"],
      enum: ["consumed", "discarded", "accidental_entry", null],
    },
    amount: { type: ["number", "null"] },
    targetStorage: {
      type: ["string", "null"],
      enum: ["fridge", "freezer", "pantry", "spices", null],
    },
    targetExpiry: { type: ["string", "null"] },
    batchActions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "foodId", "removalReason", "changes"],
        properties: {
          kind: { type: "string", enum: ["update", "delete"] },
          foodId: { type: "integer" },
          removalReason: {
            type: ["string", "null"],
            enum: ["consumed", "discarded", "accidental_entry", null],
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

export const PROPOSE_ACTION_TOOL = {
  type: "function",
  name: "propose_inventory_action",
  description:
    "Propose an inventory change that the user must confirm before it is applied. For transfer, use amount, targetStorage, and targetExpiry. For batch, put update/delete entries in batchActions. For create, put the complete new item in newFood. Leave unused top-level fields empty.",
  strict: true,
  parameters: actionSchema,
} as const;

function normalizedChanges(value: unknown) {
  return Object.fromEntries(
    Object.entries((value ?? {}) as Record<string, unknown>).filter(
      ([, value]) => value !== null
    )
  );
}

function normalizeAction(action: Record<string, unknown>) {
  if (action.kind === "create") return { kind: "create", food: action.newFood };
  if (action.kind === "transfer") {
    return {
      kind: "transfer",
      foodId: action.foodId,
      amount: action.amount,
      targetStorage: action.targetStorage,
      targetExpiry: action.targetExpiry,
    };
  }
  if (action.kind === "delete")
    return {
      kind: "delete",
      foodIds: action.foodIds,
      removalReason: action.removalReason,
    };
  if (action.kind === "consolidate")
    return {
      kind: "consolidate",
      foodIds: action.foodIds,
      primaryFoodId: action.primaryFoodId,
    };
  if (action.kind === "batch") {
    return {
      kind: "batch",
      actions: (
        (action.batchActions ?? []) as Array<Record<string, unknown>>
      ).map((item) =>
        item.kind === "delete"
          ? {
              kind: "delete",
              foodId: item.foodId,
              removalReason: item.removalReason,
            }
          : {
              kind: "update",
              foodId: item.foodId,
              changes: normalizedChanges(item.changes),
            }
      ),
    };
  }
  return {
    kind: "update",
    foodId: action.foodId,
    changes: normalizedChanges(action.changes),
  };
}

export function parseProposedAction(
  toolArguments: string,
  foods: Food[]
): AssistantAction {
  const proposed = normalizeAction(
    JSON.parse(toolArguments) as Record<string, unknown>
  );
  if (!isAssistantAction(proposed)) {
    throw new Error("The assistant proposed an invalid action");
  }
  return addBatchFoodNames(proposed, foods);
}
