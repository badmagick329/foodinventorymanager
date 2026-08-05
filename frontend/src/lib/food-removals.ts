import { FoodRemovalReason, FoodRemovalSource, Prisma, type Food } from "@prisma/client";

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
