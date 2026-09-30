import { FoodRemovalReason, Prisma } from "@prisma/client";
import prisma from "@/server/db";
import { isRecordNotFound, NotFoundError, parseInput } from "@/server/errors";
import { foodRemovalSchema } from "@/lib/validators";

export type FoodRemovalFilter = {
  reason?: FoodRemovalReason;
  search?: string;
  since?: Date;
  until?: Date;
  limit?: number;
};

function removalWhere({
  reason,
  search,
  since,
  until,
}: FoodRemovalFilter): Prisma.FoodRemovalWhereInput {
  return {
    reason,
    name: search ? { contains: search, mode: "insensitive" } : undefined,
    createdAt: since || until ? { gte: since, lt: until } : undefined,
  };
}

export function listFoodRemovals(filter: FoodRemovalFilter = {}) {
  return prisma.foodRemoval.findMany({
    where: removalWhere(filter),
    orderBy: { createdAt: "desc" },
    take: filter.limit,
  });
}

/**
 * Totals per outcome and unit. Amounts in different units are never added
 * together because the app stores no conversion between them.
 */
export async function summarizeFoodRemovals(filter: FoodRemovalFilter = {}) {
  const groups = await prisma.foodRemoval.groupBy({
    by: ["reason", "unit"],
    where: removalWhere(filter),
    _count: { _all: true },
    _sum: { amount: true },
    orderBy: [{ reason: "asc" }, { unit: "asc" }],
  });
  return groups.map((group) => ({
    reason: group.reason,
    unit: group.unit,
    entries: group._count._all,
    totalAmount: group._sum.amount ?? 0,
  }));
}

export async function updateFoodRemoval(id: string, input: unknown) {
  const data = parseInput(foodRemovalSchema.partial(), input);
  try {
    return await prisma.foodRemoval.update({ where: { id }, data });
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new NotFoundError("History entry not found.");
    }
    throw error;
  }
}

export async function deleteFoodRemoval(id: string) {
  const { count } = await prisma.foodRemoval.deleteMany({ where: { id } });
  if (count === 0) throw new NotFoundError("History entry not found.");
}
