import { Prisma, StorageType } from "@prisma/client";

export type FoodTransferData = {
  amount: number;
  storage: StorageType;
  expiry: string | null;
};

export class FoodTransferError extends Error {}

/**
 * Move part of a food row to another storage location.
 * Both the source update and the new destination row must happen inside the
 * caller's transaction so inventory can never be split only halfway.
 */
export async function transferFoodAmount(
  db: Prisma.TransactionClient,
  foodId: number,
  transfer: FoodTransferData
) {
  const sourceFood = await db.food.findUnique({ where: { id: foodId } });
  if (!sourceFood) return null;

  if (transfer.storage === sourceFood.storage) {
    throw new FoodTransferError(
      "Choose a different storage location for the moved amount."
    );
  }
  if (transfer.amount >= sourceFood.amount) {
    throw new FoodTransferError(
      "Move less than the current amount. Move the whole item by changing its storage instead."
    );
  }

  const updatedFood = await db.food.update({
    where: { id: foodId },
    data: { amount: sourceFood.amount - transfer.amount },
  });
  const movedFood = await db.food.create({
    data: {
      name: sourceFood.name,
      amount: transfer.amount,
      unit: sourceFood.unit,
      expiry: transfer.expiry,
      storage: transfer.storage,
    },
  });

  return { sourceFood, updatedFood, movedFood };
}
