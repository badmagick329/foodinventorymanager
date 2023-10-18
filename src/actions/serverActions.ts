"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import prisma from "../../prisma/client";
import { Food, MeasurementUnit, StorageType } from "@prisma/client";
import { validateFood } from "@/lib/validators";

export async function removeFood(e: FormData) {
  const id = Number(e.get("id"));
  await prisma.food.delete({ where: { id } });
  revalidatePath("/");
}

export async function getAllFoods() {
  const foods = await prisma.food.findMany({
    orderBy: [
      {
        id: "desc",
      },
      {
        name: "asc",
      },
    ],
  });
  return foods as Food[];
}

export async function createFood(e: FormData) {
  const name = e.get("name") as string;
  const amount = e.get("amount") as string;
  let unit = e.get("unit") as string;
  let expiry = e.get("expiry") === "" ? null : (e.get("expiry") as string);
  const storage = e.get("storage") as string;
  console.log(
    `Received values: ${name}, ${unit}, ${amount}, ${expiry}, ${storage}`,
  );
  const validationError = validateFood({ name, unit, amount, expiry, storage });
  if (validationError) {
    console.log(`Validation failed: ${validationError}`);
    return {
      error: validationError,
    };
  }
  unit = unit as MeasurementUnit;
  const food = await prisma.food.create({
    data: {
      name,
      amount: Number(amount),
      unit: unit as MeasurementUnit,
      expiry,
      storage: storage as StorageType,
    },
  });
  return {
    ok: "success",
  };
}

export async function updateFoodName(id: number, name: string) {
  // TODO: Validate name
  const food = await prisma.food.update({ where: { id }, data: { name } });
  revalidatePath("/");
}

export async function updateFoodAmount(id: number, amount: number) {
  // TODO: Validate amount
  console.log(`Updating food ${id} to amount ${amount}`);
  const food = await prisma.food.update({ where: { id }, data: { amount } });
  console.log(food);
  revalidatePath("/");
}
