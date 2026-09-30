import { FoodRemovalReason, FoodRemovalSource, Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/server/db";
import { NotFoundError, parseInput } from "@/server/errors";
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
export async function createFoods(input: unknown) {
  const { count } = await prisma.food.createMany({
    data: parseInput(foodListSchema, input),
  });
  return count;
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

export function transferFood(id: number, input: unknown) {
  const transfer = parseInput(foodTransferSchema, input);
  return prisma.$transaction((tx) => transferFoodAmount(tx, id, transfer));
}
