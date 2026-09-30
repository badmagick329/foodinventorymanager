import { z } from "zod";
import prisma from "@/server/db";
import { ConflictError, NotFoundError, parseInput } from "@/server/errors";

const shoppingItemSchema = z.object({
  name: z
    .string({ message: "Name cannot be empty" })
    .trim()
    .min(1, "Name cannot be empty"),
});

export function listShoppingItems() {
  return prisma.shoppingItem.findMany({ orderBy: { id: "asc" } });
}

export async function addShoppingItem(input: unknown) {
  const { name } = parseInput(shoppingItemSchema, input);
  const existing = await prisma.shoppingItem.findUnique({ where: { name } });
  if (existing) throw new ConflictError("Shopping item already exists.");
  return prisma.shoppingItem.create({ data: { name } });
}

export async function removeShoppingItem(id: number) {
  const { count } = await prisma.shoppingItem.deleteMany({ where: { id } });
  if (count === 0) throw new NotFoundError("Shopping item not found.");
}

export async function clearShoppingList() {
  const { count } = await prisma.shoppingItem.deleteMany({});
  return count;
}
