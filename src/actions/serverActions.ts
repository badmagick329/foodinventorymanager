"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import prisma from "../../prisma/client";
import { Food, MeasurementUnit, StorageType } from "@prisma/client";
import { validateFood, validatePartialFood } from "@/lib/validators";

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
  const result = validatePartialFood({ name });
  if (result) {
    console.log(`Validation failed: ${result}`);
    return {
      errors: result,
    };
  }
  const food = await prisma.food.update({ where: { id }, data: { name } });
  revalidatePath("/");
  return {
    ok: "success",
  };
}

export async function updateFoodAmount(id: number, amount: number) {
  const result = validatePartialFood({ amount: String(amount) });
  if (result) {
    console.log(`Validation failed: ${result}`);
    return {
      errors: result,
    };
  }
  const food = await prisma.food.update({ where: { id }, data: { amount } });
  revalidatePath("/");
  return {
    ok: "success",
  };
}

export async function updateFoodUnit(id: number, unit: MeasurementUnit) {
  const result = validatePartialFood({ unit });
  if (result) {
    console.log(`Validation failed: ${result}`);
    return {
      errors: result,
    };
  }
  const food = await prisma.food.update({ where: { id }, data: { unit } });
  revalidatePath("/");
  return {
    ok: "success",
  };
}

export async function updateFoodStorage(id: number, storage: StorageType) {
  const result = validatePartialFood({ storage });
  if (result) {
    console.log(`Validation failed: ${result}`);
    return {
      errors: result,
    };
  }
  const food = await prisma.food.update({ where: { id }, data: { storage } });
  revalidatePath("/");
  return {
    ok: "success",
  };
}

export async function updateFoodExpiry(id: number, e: string) {
  let expiry = e === "" ? null : e;
  const result = validatePartialFood({ expiry });
  if (result) {
    console.log(`Validation failed: ${result}`);
    return {
      errors: result,
    };
  }
  const food = await prisma.food.update({ where: { id }, data: { expiry } });
  revalidatePath("/");
  return {
    ok: "success",
  };
}
