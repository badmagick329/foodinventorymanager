import { MeasurementUnit, StorageType, type Food } from "@prisma/client";
import {
  addFoodContext,
  isAssistantAction,
  isProposedChange,
  type AssistantAction,
  type ProposedChange,
} from "@/lib/assistant";

// Enumerating units and storage locations stops the model inventing values
// such as "slices" that validation would then reject.
const units = Object.values(MeasurementUnit);
const storages = Object.values(StorageType);

const foodFieldsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "amount", "unit", "expiry", "storage"],
  properties: {
    name: { type: ["string", "null"] },
    amount: { type: ["number", "null"] },
    unit: { type: ["string", "null"], enum: [...units, null] },
    expiry: { type: ["string", "null"] },
    storage: { type: ["string", "null"], enum: [...storages, null] },
  },
} as const;

/**
 * OpenAI strict function calling requires every property to be present, so
 * each change is one flat object with nullable fields for every change kind.
 * `parseProposedAction` maps it back onto the app's `ProposedChange` union.
 */
const changeSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "kind",
    "foodId",
    "newFood",
    "changes",
    "removalReason",
    "amount",
    "targetStorage",
    "targetExpiry",
    "clearExpiry",
  ],
  properties: {
    kind: { type: "string", enum: ["create", "update", "delete", "transfer"] },
    foodId: { type: ["integer", "null"] },
    newFood: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["name", "amount", "unit", "expiry", "storage"],
      properties: {
        name: { type: "string" },
        amount: { type: "number" },
        unit: { type: "string", enum: units },
        expiry: { type: ["string", "null"] },
        storage: { type: "string", enum: storages },
      },
    },
    changes: foodFieldsSchema,
    removalReason: {
      type: ["string", "null"],
      enum: ["consumed", "discarded", "accidental_entry", null],
    },
    amount: { type: ["number", "null"] },
    targetStorage: { type: ["string", "null"], enum: [...storages, null] },
    targetExpiry: { type: ["string", "null"] },
    // A null in changes means "unchanged", so removing an expiry date needs
    // its own flag.
    clearExpiry: { type: "boolean" },
  },
} as const;

const actionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["message", "kind", "items", "foodIds", "primaryFoodId"],
  properties: {
    // Reasoning models usually emit no text alongside a tool call, so the
    // questions about left-out items must travel inside the call itself.
    message: { type: "string" },
    kind: { type: "string", enum: ["changes", "consolidate"] },
    items: { type: "array", items: changeSchema },
    foodIds: { type: "array", items: { type: "integer" } },
    primaryFoodId: { type: ["integer", "null"] },
  },
} as const;

export const PROPOSE_ACTION_TOOL = {
  type: "function",
  name: "propose_inventory_action",
  description:
    "Propose inventory changes that the user reviews and confirms before they apply. message is shown to the user: say briefly what is proposed, any storage location or unit you inferred, any item added to an existing one, and ask one concise question per item you left out. For kind changes, put every requested change in items: create uses newFood; update uses foodId and changes (null for fields that stay the same), and clearExpiry true to remove the item's expiry date (false otherwise); delete uses foodId and removalReason; transfer uses foodId, amount, targetStorage and targetExpiry. For kind consolidate, use foodIds and primaryFoodId and leave items empty. Leave unused fields null.",
  strict: true,
  parameters: actionSchema,
} as const;

function presentFields(value: unknown) {
  return Object.fromEntries(
    Object.entries((value ?? {}) as Record<string, unknown>).filter(
      ([, value]) => value !== null
    )
  );
}

function normalizeChange(change: Record<string, unknown>) {
  switch (change.kind) {
    case "create":
      return { kind: "create", food: change.newFood };
    case "delete":
      return {
        kind: "delete",
        foodId: change.foodId,
        removalReason: change.removalReason,
      };
    case "transfer":
      return {
        kind: "transfer",
        foodId: change.foodId,
        amount: change.amount,
        targetStorage: change.targetStorage,
        targetExpiry: change.targetExpiry,
      };
    default:
      return {
        kind: "update",
        foodId: change.foodId,
        changes: {
          ...presentFields(change.changes),
          ...(change.clearExpiry === true && { expiry: null }),
        },
      };
  }
}

function changeLabel(change: Record<string, unknown>, foods: Food[]) {
  const newFood = change.newFood as { name?: unknown } | null;
  if (typeof newFood?.name === "string") return newFood.name;
  return foods.find((food) => food.id === change.foodId)?.name ?? "one item";
}

/**
 * Keeps the valid changes and names the rest, so one malformed item in a long
 * dictated list costs that item, not the whole proposal.
 */
function parseChanges(call: Record<string, unknown>, foods: Food[]) {
  const items: ProposedChange[] = [];
  const rejected: string[] = [];
  const seenFoodIds = new Set<number>();
  for (const change of (call.items ?? []) as Array<Record<string, unknown>>) {
    const item: unknown = normalizeChange(change);
    const foodId =
      isProposedChange(item) && "foodId" in item ? item.foodId : null;
    if (
      !isProposedChange(item) ||
      (foodId !== null && seenFoodIds.has(foodId))
    ) {
      rejected.push(changeLabel(change, foods));
      continue;
    }
    if (foodId !== null) seenFoodIds.add(foodId);
    items.push(item);
  }
  return { items, rejected };
}

export function parseProposedAction(
  toolArguments: string,
  foods: Food[]
): { action: AssistantAction; message: string } {
  const call = JSON.parse(toolArguments) as Record<string, unknown>;
  const message = typeof call.message === "string" ? call.message.trim() : "";

  if (call.kind === "consolidate") {
    const action = {
      kind: "consolidate",
      foodIds: call.foodIds,
      primaryFoodId: call.primaryFoodId,
    };
    if (!isAssistantAction(action)) {
      throw new Error("The assistant proposed an invalid action");
    }
    return { action, message };
  }

  const { items, rejected } = parseChanges(call, foods);
  const note = rejected.length
    ? `I couldn't turn ${rejected.join(", ")} into a valid change, so ${rejected.length === 1 ? "it is" : "they are"} not included. Please say ${rejected.length === 1 ? "it" : "them"} again.`
    : "";
  return {
    action: items.length
      ? addFoodContext({ kind: "changes", items }, foods)
      : { kind: "none" },
    message: [message, note].filter(Boolean).join("\n\n"),
  };
}
