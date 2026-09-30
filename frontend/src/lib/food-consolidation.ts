import type { Food } from "@prisma/client";

export type FoodConsolidationGroup = {
  foods: Food[];
  totalAmount: number;
};

function normalizedName(name: string) {
  return name.trim().toLowerCase();
}

/**
 * Entries are interchangeable when name, unit and storage match. Expiry must
 * match too unless the caller explicitly accepts keeping the earliest one.
 */
export function canConsolidateFoods(
  foods: Food[],
  { allowDifferentExpiry = false } = {}
) {
  if (foods.length < 2) return false;

  const [first, ...rest] = foods;
  return rest.every(
    (food) =>
      normalizedName(food.name) === normalizedName(first.name) &&
      food.unit === first.unit &&
      food.storage === first.storage &&
      (allowDifferentExpiry || food.expiry === first.expiry)
  );
}

function consolidationKey(food: Food) {
  return [
    normalizedName(food.name),
    food.unit,
    food.storage,
    food.expiry ?? "<no-expiry>",
  ].join("\u0000");
}

export function findConsolidationGroups(foods: Food[]) {
  const groups = new Map<string, Food[]>();

  for (const food of foods) {
    const key = consolidationKey(food);
    const group = groups.get(key) ?? [];
    group.push(food);
    groups.set(key, group);
  }

  return [...groups.values()]
    .filter((group) => group.length >= 2)
    .map((group) => ({
      foods: group.sort((first, second) => first.id - second.id),
      totalAmount: group.reduce((total, food) => total + food.amount, 0),
    }));
}
