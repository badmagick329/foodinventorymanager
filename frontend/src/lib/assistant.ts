import { FoodRemovalReason, StorageType, type Food } from "@prisma/client";
import { foodSchema, foodTransferSchema } from "./validators";
import { formatAmount } from "./utils";

type FoodFields = Pick<Food, "name" | "amount" | "unit" | "expiry" | "storage">;

type CreateChange = { kind: "create"; food: FoodFields };
type UpdateChange = {
  kind: "update";
  foodId: number;
  changes: Partial<FoodFields>;
  /** The changed fields' values when proposed, so a review can show from → to. */
  previous?: Partial<FoodFields>;
};
type DeleteChange = {
  kind: "delete";
  foodId: number;
  removalReason: FoodRemovalReason;
};
type TransferChange = {
  kind: "transfer";
  foodId: number;
  amount: number;
  targetStorage: StorageType;
  targetExpiry: string | null;
};

/** One reviewable line of a proposal; the user can untick each before confirming. */
export type ProposedChange =
  | CreateChange
  | ((UpdateChange | DeleteChange | TransferChange) & { foodName?: string });

/**
 * Every write except consolidation is a list of proposed changes, even a
 * single one, so a dictated message naming several items always lands in one
 * proposal instead of the model choosing a single-item shape and dropping the
 * rest (FDI-6).
 */
export type AssistantAction =
  | { kind: "none" }
  | { kind: "changes"; items: ProposedChange[] }
  | { kind: "consolidate"; foodIds: number[]; primaryFoodId: number };

const removalReasons = new Set(Object.values(FoodRemovalReason));

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function isProposedChange(value: unknown): value is ProposedChange {
  if (!isRecord(value)) return false;
  if (value.kind === "create") return foodSchema.safeParse(value.food).success;
  if (!Number.isInteger(value.foodId)) return false;
  if (value.kind === "update") {
    return (
      isRecord(value.changes) &&
      Object.keys(value.changes).length > 0 &&
      foodSchema.partial().strict().safeParse(value.changes).success
    );
  }
  if (value.kind === "delete") {
    return removalReasons.has(value.removalReason as FoodRemovalReason);
  }
  if (value.kind === "transfer") {
    return foodTransferSchema.safeParse({
      amount: value.amount,
      storage: value.targetStorage,
      expiry: value.targetExpiry,
    }).success;
  }
  return false;
}

export function isAssistantAction(value: unknown): value is AssistantAction {
  if (!isRecord(value)) return false;
  if (value.kind === "none") return true;
  if (value.kind === "changes") {
    if (
      !Array.isArray(value.items) ||
      value.items.length === 0 ||
      !value.items.every(isProposedChange)
    )
      return false;
    // Two changes to one item would apply in an order the review never showed.
    const ids = actionFoodIds(value as AssistantAction);
    return new Set(ids).size === ids.length;
  }
  if (value.kind === "consolidate") {
    return (
      Array.isArray(value.foodIds) &&
      value.foodIds.length > 1 &&
      value.foodIds.every(Number.isInteger) &&
      Number.isInteger(value.primaryFoodId)
    );
  }
  return false;
}

/** IDs of the existing items an action touches; creates touch none. */
export function actionFoodIds(action: AssistantAction): number[] {
  if (action.kind === "none") return [];
  if (action.kind === "consolidate") return action.foodIds;
  return action.items.flatMap((item) =>
    item.kind === "create" ? [] : [item.foodId]
  );
}

/** Snapshots item names and changed values so the review survives later edits. */
export function addFoodContext(
  action: AssistantAction,
  foods: Food[]
): AssistantAction {
  if (action.kind !== "changes") return action;
  return {
    ...action,
    items: action.items.map((item) => {
      if (item.kind === "create") return item;
      const food = foods.find((candidate) => candidate.id === item.foodId);
      const foodName = food?.name ?? "Selected item";
      if (item.kind !== "update" || !food) return { ...item, foodName };
      const previous = Object.fromEntries(
        Object.keys(item.changes).map((key) => [
          key,
          food[key as keyof FoodFields],
        ])
      ) as Partial<FoodFields>;
      return { ...item, foodName, previous };
    }),
  };
}

function formatValue(value: unknown) {
  if (value === null) return "no expiry date";
  return typeof value === "number" ? formatAmount(value) : String(value);
}

/** Field changes as "amount 1 → 3", falling back to "amount → 3" without a snapshot. */
export function describeFieldChanges(
  changes: Partial<FoodFields>,
  previous: Partial<FoodFields> | undefined
) {
  return Object.entries(changes)
    .map(([key, value]) => {
      const before = previous?.[key as keyof FoodFields];
      return before === undefined
        ? `${key} → ${formatValue(value)}`
        : `${key} ${formatValue(before)} → ${formatValue(value)}`;
    })
    .join(", ");
}

function describeChange(item: ProposedChange, foods: Food[]) {
  if (item.kind === "create") {
    const { food } = item;
    return `add ${formatAmount(food.amount)} ${food.unit} of ${food.name} to the ${food.storage}${food.expiry ? ` (expiry: ${food.expiry})` : ""}`;
  }
  const food = foods.find((candidate) => candidate.id === item.foodId);
  const name = food?.name ?? item.foodName ?? "the selected item";
  if (item.kind === "delete") {
    return `record ${name} as ${item.removalReason.replace("_", " ")}`;
  }
  if (item.kind === "transfer") {
    return `move ${formatAmount(item.amount)} ${food?.unit ?? "units"} of ${name} from the ${food?.storage ?? "current storage"} to the ${item.targetStorage}${item.targetExpiry ? ` (expiry: ${item.targetExpiry})` : " (no expiry date)"}`;
  }
  return `update ${name}: ${describeFieldChanges(item.changes, item.previous)}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function describeAction(action: AssistantAction, foods: Food[]): string {
  if (action.kind === "none") return "";
  if (action.kind === "consolidate") {
    const selected = foods.filter((food) => action.foodIds.includes(food.id));
    const total = selected.reduce((sum, food) => sum + food.amount, 0);
    const primary = foods.find((food) => food.id === action.primaryFoodId);
    return `Consolidate ${selected.length} entries into ${primary?.name ?? "the selected item"} (${total} ${primary?.unit ?? "units"}).`;
  }
  const lines = action.items.map((item) => describeChange(item, foods));
  return lines.length === 1
    ? `${capitalize(lines[0])}.`
    : `Apply ${lines.length} changes: ${lines.join("; ")}.`;
}
