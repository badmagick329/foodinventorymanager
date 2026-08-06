import {
  FoodRemovalReason,
  FoodRemovalSource,
  Prisma,
  type Food,
} from "@prisma/client";

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
  if (!existingFood) return null;

  const nextAmount = data.amount ?? existingFood.amount;
  const nextUnit = data.unit ?? existingFood.unit;

  const consumedAmount = getConsumedAmount(
    existingFood.amount,
    nextAmount,
    existingFood.unit,
    nextUnit
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
