import { Prisma, type Food } from "@prisma/client";

export class FoodConsolidationError extends Error {}

function normalizedName(name: string) {
  return name.trim().toLowerCase();
}

export function canConsolidateFoods(foods: Food[]) {
  if (foods.length < 2) return false;

  const [first, ...rest] = foods;
  return rest.every(
    (food) =>
      normalizedName(food.name) === normalizedName(first.name) &&
      food.unit === first.unit &&
      food.storage === first.storage &&
      food.expiry === first.expiry
  );
}

/**
 * Merge equivalent food rows inside the caller's transaction.
 * The first row is retained so its identity remains stable for callers.
 */
export async function consolidateFoods(
  db: Prisma.TransactionClient,
  foodIds: number[]
) {
  const uniqueFoodIds = [...new Set(foodIds)];
  const foods = await db.food.findMany({
    where: { id: { in: uniqueFoodIds } },
    orderBy: { id: "asc" },
  });

  if (foods.length !== uniqueFoodIds.length) {
    throw new FoodConsolidationError(
      "One or more selected food items could not be found. Refresh and try again."
    );
  }

  if (!canConsolidateFoods(foods)) {
    throw new FoodConsolidationError(
      "Only items with the same name, unit, storage, and expiry can be consolidated."
    );
  }

  const [primaryFood, ...foodsToRemove] = foods;
  const updatedFood = await db.food.update({
    where: { id: primaryFood.id },
    data: {
      amount: foods.reduce((total, food) => total + food.amount, 0),
    },
  });

  await db.food.deleteMany({
    where: { id: { in: foodsToRemove.map((food) => food.id) } },
  });

  return { updatedFood, removedFoodIds: foodsToRemove.map((food) => food.id) };
}
