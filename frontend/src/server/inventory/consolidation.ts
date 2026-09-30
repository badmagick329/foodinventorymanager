import type { Prisma } from "@prisma/client";
import prisma from "@/server/db";
import {
  canConsolidateFoods,
  findConsolidationGroups,
} from "@/lib/food-consolidation";
import { InvalidInputError, NotFoundError } from "@/server/errors";

/**
 * Merge equivalent food rows inside the caller's transaction. The primary row
 * (the lowest id unless one is chosen) is retained so its identity stays
 * stable, and it keeps the earliest expiry of the merged rows.
 */
export async function consolidateFoods(
  db: Prisma.TransactionClient,
  foodIds: number[],
  {
    primaryFoodId,
    allowDifferentExpiry = false,
  }: { primaryFoodId?: number; allowDifferentExpiry?: boolean } = {}
) {
  const uniqueFoodIds = [...new Set(foodIds)];
  const foods = await db.food.findMany({
    where: { id: { in: uniqueFoodIds } },
    orderBy: { id: "asc" },
  });

  if (foods.length !== uniqueFoodIds.length) {
    throw new NotFoundError(
      "One or more selected food items could not be found. Refresh and try again."
    );
  }

  if (!canConsolidateFoods(foods, { allowDifferentExpiry })) {
    throw new InvalidInputError(
      allowDifferentExpiry
        ? "Only items with the same name, unit, and storage can be consolidated."
        : "Only items with the same name, unit, storage, and expiry can be consolidated."
    );
  }

  const primaryFood =
    primaryFoodId === undefined
      ? foods[0]
      : foods.find((food) => food.id === primaryFoodId);
  if (!primaryFood) {
    throw new InvalidInputError(
      "The item to keep must be one of the consolidated items."
    );
  }

  const removedFoodIds = foods
    .filter((food) => food.id !== primaryFood.id)
    .map((food) => food.id);
  const earliestExpiry =
    foods
      .map((food) => food.expiry)
      .filter((expiry): expiry is string => expiry !== null)
      .sort()[0] ?? null;

  const updatedFood = await db.food.update({
    where: { id: primaryFood.id },
    data: {
      amount: foods.reduce((total, food) => total + food.amount, 0),
      expiry: earliestExpiry,
    },
  });
  await db.food.deleteMany({ where: { id: { in: removedFoodIds } } });

  return { updatedFood, removedFoodIds };
}

async function findGroups(db: Prisma.TransactionClient) {
  return findConsolidationGroups(
    await db.food.findMany({
      orderBy: [
        { name: "asc" },
        { unit: "asc" },
        { storage: "asc" },
        { expiry: "asc" },
        { id: "asc" },
      ],
    })
  );
}

export function findConsolidationCandidates() {
  return findGroups(prisma);
}

export function consolidateAllMatchingFoods() {
  return prisma.$transaction(async (tx) => {
    const groups = await findGroups(tx);
    let duplicateItemsRemoved = 0;
    for (const group of groups) {
      const { removedFoodIds } = await consolidateFoods(
        tx,
        group.foods.map((food) => food.id)
      );
      duplicateItemsRemoved += removedFoodIds.length;
    }
    return { groupsConsolidated: groups.length, duplicateItemsRemoved };
  });
}
