import {
  FoodRemovalReason,
  FoodRemovalSource,
  Prisma,
  type Food,
} from "@prisma/client";
import { NotFoundError } from "@/server/errors";

export type FoodUpdateData = Partial<
  Pick<Food, "name" | "amount" | "unit" | "expiry" | "storage">
>;

export function getConsumedAmount(
  existingAmount: number,
  nextAmount: number,
  existingUnit: string,
  nextUnit: string
) {
  if (existingUnit !== nextUnit || nextAmount >= existingAmount) return null;
  return existingAmount - nextAmount;
}

export function recordFoodRemovals(
  db: Prisma.TransactionClient,
  foods: Food[],
  reason: FoodRemovalReason,
  source: FoodRemovalSource
) {
  if (foods.length === 0) return Promise.resolve({ count: 0 });
  return db.foodRemoval.createMany({
    data: foods.map((food) => ({
      foodId: food.id,
      name: food.name,
      amount: food.amount,
      unit: food.unit,
      expiry: food.expiry,
      storage: food.storage,
      reason,
      source,
    })),
  });
}

/**
 * Update a food item and record any same-unit quantity reduction as consumed.
 * Both operations must happen inside the caller's transaction.
 */
export async function updateFoodAndRecordUsage(
  db: Prisma.TransactionClient,
  foodId: number,
  data: FoodUpdateData,
  source: FoodRemovalSource
) {
  const existingFood = await db.food.findUnique({ where: { id: foodId } });
  if (!existingFood) throw new NotFoundError("Food item not found.");

  const consumedAmount = getConsumedAmount(
    existingFood.amount,
    data.amount ?? existingFood.amount,
    existingFood.unit,
    data.unit ?? existingFood.unit
  );

  if (consumedAmount !== null) {
    await recordFoodRemovals(
      db,
      [{ ...existingFood, amount: consumedAmount }],
      FoodRemovalReason.consumed,
      source
    );
  }

  const updatedFood = await db.food.update({
    where: { id: foodId },
    data,
  });

  return { existingFood, updatedFood };
}

/**
 * Delete food rows, keeping a history snapshot of each. Fails if any row is
 * already gone so a stale request cannot silently remove only part of a set.
 */
export async function removeFoodsAndRecord(
  db: Prisma.TransactionClient,
  foodIds: number[],
  reason: FoodRemovalReason,
  source: FoodRemovalSource
) {
  const uniqueIds = [...new Set(foodIds)];
  const foods = await db.food.findMany({ where: { id: { in: uniqueIds } } });
  if (foods.length !== uniqueIds.length) {
    throw new NotFoundError("One or more food items no longer exist.");
  }
  await recordFoodRemovals(db, foods, reason, source);
  await db.food.deleteMany({ where: { id: { in: uniqueIds } } });
  return foods;
}
