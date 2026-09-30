import prisma from "@/server/db";
import { isRecordNotFound, NotFoundError, parseInput } from "@/server/errors";
import { foodRemovalSchema } from "@/lib/validators";

export function listFoodRemovals() {
  return prisma.foodRemoval.findMany({ orderBy: { createdAt: "desc" } });
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
