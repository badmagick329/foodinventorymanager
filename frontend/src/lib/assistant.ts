import {
  FoodRemovalReason,
  MeasurementUnit,
  StorageType,
  type Food,
} from "@prisma/client";
import { foodSchema, foodTransferSchema } from "./validators";

type UpdateAction = {
  kind: "update";
  foodId: number;
  changes: Partial<
    Pick<Food, "name" | "amount" | "unit" | "expiry" | "storage">
  >;
};
type DeleteAction = {
  kind: "delete";
  foodIds: number[];
  removalReason: FoodRemovalReason;
};
type CreateAction = {
  kind: "create";
  food: Pick<Food, "name" | "amount" | "unit" | "expiry" | "storage">;
};
type TransferAction = {
  kind: "transfer";
  foodId: number;
  amount: number;
  targetStorage: StorageType;
  targetExpiry: string | null;
};
type BatchItem = (
  | UpdateAction
  | { kind: "delete"; foodId: number; removalReason: FoodRemovalReason }
) & { foodName?: string };

export type AssistantAction =
  | { kind: "none" }
  | UpdateAction
  | DeleteAction
  | CreateAction
  | TransferAction
  | { kind: "consolidate"; foodIds: number[]; primaryFoodId: number }
  | { kind: "batch"; actions: BatchItem[] };

export type AssistantResponse = {
  reply: string;
  action: AssistantAction;
};

const units = new Set(Object.values(MeasurementUnit));
const storageTypes = new Set(Object.values(StorageType));
const removalReasons = new Set(Object.values(FoodRemovalReason));

function isUpdateAction(value: unknown): value is UpdateAction {
  if (!value || typeof value !== "object") return false;
  const action = value as Record<string, unknown>;
  if (
    action.kind !== "update" ||
    !Number.isInteger(action.foodId) ||
    !action.changes ||
    typeof action.changes !== "object"
  )
    return false;
  const changes = action.changes as Record<string, unknown>;
  if (
    changes.amount !== undefined &&
    (typeof changes.amount !== "number" || changes.amount <= 0)
  )
    return false;
  if (
    changes.name !== undefined &&
    (typeof changes.name !== "string" || changes.name.trim() === "")
  )
    return false;
  if (
    changes.unit !== undefined &&
    (typeof changes.unit !== "string" ||
      !units.has(changes.unit as MeasurementUnit))
  )
    return false;
  if (
    changes.storage !== undefined &&
    (typeof changes.storage !== "string" ||
      !storageTypes.has(changes.storage as StorageType))
  )
    return false;
  return Object.keys(changes).length > 0;
}

function isBatchItem(value: unknown): value is BatchItem {
  if (isUpdateAction(value)) return true;
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Record<string, unknown>).kind === "delete" &&
      Number.isInteger((value as Record<string, unknown>).foodId) &&
      removalReasons.has(
        (value as Record<string, unknown>).removalReason as FoodRemovalReason
      )
  );
}

function isCreateAction(value: unknown): value is CreateAction {
  if (!value || typeof value !== "object") return false;
  const action = value as Record<string, unknown>;
  return action.kind === "create" && foodSchema.safeParse(action.food).success;
}

function isTransferAction(value: unknown): value is TransferAction {
  if (!value || typeof value !== "object") return false;
  const action = value as Record<string, unknown>;
  if (action.kind !== "transfer" || !Number.isInteger(action.foodId))
    return false;
  return foodTransferSchema.safeParse({
    amount: action.amount,
    storage: action.targetStorage,
    expiry: action.targetExpiry,
  }).success;
}

export function isAssistantAction(value: unknown): value is AssistantAction {
  if (!value || typeof value !== "object" || !("kind" in value)) return false;
  const action = value as Record<string, unknown>;

  if (action.kind === "none") return true;
  if (action.kind === "create") return isCreateAction(action);
  if (action.kind === "transfer") return isTransferAction(action);
  if (action.kind === "delete")
    return (
      Array.isArray(action.foodIds) &&
      action.foodIds.length > 0 &&
      action.foodIds.every(Number.isInteger) &&
      removalReasons.has(action.removalReason as FoodRemovalReason)
    );
  if (action.kind === "consolidate") {
    return (
      Array.isArray(action.foodIds) &&
      action.foodIds.length > 1 &&
      action.foodIds.every(Number.isInteger) &&
      Number.isInteger(action.primaryFoodId)
    );
  }
  if (action.kind === "update") return isUpdateAction(action);
  if (action.kind === "batch") {
    return (
      Array.isArray(action.actions) &&
      action.actions.length > 0 &&
      action.actions.every(isBatchItem) &&
      new Set(action.actions.map((item) => item.foodId)).size ===
        action.actions.length
    );
  }
  return false;
}

export function actionFoodIds(
  action: Exclude<AssistantAction, { kind: "none" }>
) {
  if (action.kind === "create") return [];
  if (action.kind === "update") return [action.foodId];
  if (action.kind === "transfer") return [action.foodId];
  if (action.kind === "batch") return action.actions.map((item) => item.foodId);
  return action.foodIds;
}

export function addBatchFoodNames(
  action: AssistantAction,
  foods: Food[]
): AssistantAction {
  if (action.kind !== "batch") return action;
  return {
    ...action,
    actions: action.actions.map((item) => ({
      ...item,
      foodName:
        foods.find((food) => food.id === item.foodId)?.name ?? "Selected item",
    })),
  };
}

function describeUpdate(action: UpdateAction, foods: Food[]) {
  const food = foods.find((item) => item.id === action.foodId);
  const fields = Object.entries(action.changes)
    .map(
      ([key, value]) => `${key} to ${value === null ? "no expiry date" : value}`
    )
    .join(", ");
  return `Update ${food?.name ?? "the selected item"}: ${fields}.`;
}

function describeTransfer(action: TransferAction, foods: Food[]) {
  const food = foods.find((item) => item.id === action.foodId);
  return `Move ${action.amount} ${food?.unit ?? "units"} of ${food?.name ?? "the selected item"} from the ${food?.storage ?? "current storage"} to the ${action.targetStorage}${action.targetExpiry ? ` (expiry: ${action.targetExpiry})` : " (no expiry date)"}.`;
}

export function describeAction(action: AssistantAction, foods: Food[]): string {
  if (action.kind === "none") return "";
  if (action.kind === "create")
    return `Add ${action.food.amount} ${action.food.unit} of ${action.food.name} to the ${action.food.storage}.`;
  if (action.kind === "transfer") return describeTransfer(action, foods);
  if (action.kind === "batch")
    return `Apply ${action.actions.length} changes: ${action.actions.map((item) => (item.kind === "delete" ? `record ${foods.find((food) => food.id === item.foodId)?.name ?? "the selected item"} as ${item.removalReason.replace("_", " ")}` : describeUpdate(item, foods).replace(/\.$/, ""))).join("; ")}.`;
  if (action.kind === "delete")
    return `Record ${foods
      .filter((food) => action.foodIds.includes(food.id))
      .map((food) => food.name)
      .join(", ")} as ${action.removalReason.replace("_", " ")}.`;
  if (action.kind === "consolidate") {
    const selected = foods.filter((food) => action.foodIds.includes(food.id));
    const total = selected.reduce((sum, food) => sum + food.amount, 0);
    const primary = foods.find((food) => food.id === action.primaryFoodId);
    return `Consolidate ${selected.length} entries into ${primary?.name ?? "the selected item"} (${total} ${primary?.unit ?? "units"}).`;
  }
  return describeUpdate(action, foods);
}
