import { FoodRemovalReason, FoodRemovalSource, Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/server/db";
import { InvalidInputError, NotFoundError, parseInput } from "@/server/errors";
import { foodSchema, foodTransferSchema } from "@/lib/validators";
import { removeFoodsAndRecord, updateFoodAndRecordUsage } from "./usage";
import { transferFoodAmount } from "./transfers";

export const FOOD_ORDER = [
  { expiry: "asc" },
  { storage: "asc" },
  { name: "asc" },
  { id: "desc" },
] satisfies Prisma.FoodOrderByWithRelationInput[];

const foodListSchema = z.array(foodSchema).min(1, "No items to import");
const amountSchema = foodSchema.pick({ amount: true });
const moveSchema = z.object({
  storage: foodSchema.shape.storage,
  amount: foodSchema.shape.amount.optional(),
  expiry: foodSchema.shape.expiry.optional(),
});
const removalReasonSchema = z.enum(FoodRemovalReason, {
  message:
    "Choose whether the item was consumed, discarded, or an accidental entry.",
});

export function listFoods() {
  return prisma.food.findMany({ orderBy: FOOD_ORDER });
}

export async function getFood(id: number) {
  const food = await prisma.food.findUnique({ where: { id } });
  if (!food) throw new NotFoundError("Food item not found.");
  return food;
}

export function createFood(input: unknown) {
  return prisma.food.create({ data: parseInput(foodSchema, input) });
}

/** All-or-nothing, so retrying a failed import never duplicates items. */
export function createFoods(input: unknown) {
  const foods = parseInput(foodListSchema, input);
  return prisma.$transaction((tx) =>
    Promise.all(foods.map((data) => tx.food.create({ data })))
  );
}

export async function updateFood(
  id: number,
  input: unknown,
  source: FoodRemovalSource
) {
  const data = parseInput(foodSchema.partial(), input);
  const { updatedFood } = await prisma.$transaction((tx) =>
    updateFoodAndRecordUsage(tx, id, data, source)
  );
  return updatedFood;
}

export function removeFoods(
  ids: number[],
  reason: unknown,
  source: FoodRemovalSource
) {
  const removalReason = parseInput(removalReasonSchema, reason);
  return prisma.$transaction((tx) =>
    removeFoodsAndRecord(tx, ids, removalReason, source)
  );
}

/**
 * Records that part of an item was used. Using the whole remaining amount (or
 * more) removes the item, so callers never need to know the current amount.
 */
export async function useFoodAmount(
  id: number,
  input: unknown,
  source: FoodRemovalSource
) {
  const { amount } = parseInput(amountSchema, input);
  return prisma.$transaction(async (tx) => {
    const food = await tx.food.findUnique({ where: { id } });
    if (!food) throw new NotFoundError("Food item not found.");
    if (amount >= food.amount) {
      await removeFoodsAndRecord(tx, [id], FoodRemovalReason.consumed, source);
      return { usedAmount: food.amount, remainingFood: null };
    }
    const { updatedFood } = await updateFoodAndRecordUsage(
      tx,
      id,
      { amount: food.amount - amount },
      source
    );
    return { usedAmount: amount, remainingFood: updatedFood };
  });
}

/**
 * Moves a whole item (storage and optionally expiry change in place) or, when
 * `amount` is less than the item's amount, splits that portion off.
 */
export async function moveFood(
  id: number,
  input: unknown,
  source: FoodRemovalSource
) {
  const move = parseInput(moveSchema, input);
  const food = await getFood(id);
  if (move.amount !== undefined && move.amount < food.amount) {
    const { updatedFood, movedFood } = await transferFood(id, {
      amount: move.amount,
      storage: move.storage,
      expiry: move.expiry === undefined ? food.expiry : move.expiry,
    });
    return { sourceFood: updatedFood, movedFood };
  }
  if (move.storage === food.storage) {
    throw new InvalidInputError(`This item is already in the ${food.storage}.`);
  }
  const movedFood = await updateFood(
    id,
    {
      storage: move.storage,
      ...(move.expiry !== undefined && { expiry: move.expiry }),
    },
    source
  );
  return { sourceFood: null, movedFood };
}

export function transferFood(id: number, input: unknown) {
  const transfer = parseInput(foodTransferSchema, input);
  return prisma.$transaction((tx) => transferFoodAmount(tx, id, transfer));
}
