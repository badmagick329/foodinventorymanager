import { MeasurementUnit, StorageType, type Food } from "@prisma/client";

export type AssistantAction =
  | { kind: "none" }
  | {
      kind: "update";
      foodId: number;
      changes: Partial<Pick<Food, "name" | "amount" | "unit" | "expiry" | "storage">>;
    }
  | { kind: "delete"; foodIds: number[] }
  | { kind: "consolidate"; foodIds: number[]; primaryFoodId: number };

export type AssistantResponse = {
  reply: string;
  action: AssistantAction;
};

const units = new Set(Object.values(MeasurementUnit));
const storageTypes = new Set(Object.values(StorageType));

export function isAssistantAction(value: unknown): value is AssistantAction {
  if (!value || typeof value !== "object" || !("kind" in value)) return false;
  const action = value as Record<string, unknown>;

  if (action.kind === "none") return true;
  if (action.kind === "delete") {
    return Array.isArray(action.foodIds) && action.foodIds.every(Number.isInteger);
  }
  if (action.kind === "consolidate") {
    return (
      Array.isArray(action.foodIds) &&
      action.foodIds.length > 1 &&
      action.foodIds.every(Number.isInteger) &&
      Number.isInteger(action.primaryFoodId)
    );
  }
  if (action.kind === "update") {
    if (!Number.isInteger(action.foodId) || !action.changes || typeof action.changes !== "object") {
      return false;
    }
    const changes = action.changes as Record<string, unknown>;
    if (changes.amount !== undefined && (typeof changes.amount !== "number" || changes.amount <= 0)) return false;
    if (changes.name !== undefined && (typeof changes.name !== "string" || changes.name.trim() === "")) return false;
    if (changes.unit !== undefined && (typeof changes.unit !== "string" || !units.has(changes.unit as MeasurementUnit))) return false;
    if (changes.storage !== undefined && (typeof changes.storage !== "string" || !storageTypes.has(changes.storage as StorageType))) return false;
    return Object.keys(changes).length > 0;
  }
  return false;
}

export function describeAction(action: AssistantAction, foods: Food[]): string {
  if (action.kind === "none") return "";
  if (action.kind === "delete") {
    return `Delete ${foods.filter((food) => action.foodIds.includes(food.id)).map((food) => food.name).join(", ")}.`;
  }
  if (action.kind === "consolidate") {
    const selected = foods.filter((food) => action.foodIds.includes(food.id));
    const total = selected.reduce((sum, food) => sum + food.amount, 0);
    const primary = foods.find((food) => food.id === action.primaryFoodId);
    return `Consolidate ${selected.length} entries into ${primary?.name ?? "the selected item"} (${total} ${primary?.unit ?? "units"}).`;
  }
  const food = foods.find((item) => item.id === action.foodId);
  const fields = Object.entries(action.changes)
    .map(([key, value]) => `${key} to ${value === null ? "no expiry date" : value}`)
    .join(", ");
  return `Update ${food?.name ?? "the selected item"}: ${fields}.`;
}
