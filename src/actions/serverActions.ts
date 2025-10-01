"use server";

import { validateFood, validatePartialFood } from "@/lib/validators";
import { Food, MeasurementUnit, StorageType } from "@prisma/client";
import { revalidateTag } from "next/cache";
import prisma from "../../prisma/client";

export async function removeFood(e: FormData) {
  const id = Number(e.get("id"));
  await prisma.food.delete({ where: { id } });
  revalidateTag("foods");
}

export async function getAllFoods() {
  try {
    const foods = await prisma.food.findMany({
      orderBy: [
        {
          expiry: "asc",
        },
        {
          storage: "asc",
        },
        {
          name: "asc",
        },
        {
          id: "desc",
        },
      ],
    });
    return foods as Food[];
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function createFood(e: FormData) {
  const name = e.get("name") as string;
  const amount = e.get("amount") as string;
  let unit = e.get("unit") as string;
  let expiry = e.get("expiry") === "" ? null : (e.get("expiry") as string);
  const storage = e.get("storage") as string;
  const validationError = validateFood({ name, unit, amount, expiry, storage });
  if (validationError) {
    console.error(`Validation failed: ${validationError}`);
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
  revalidateTag("foods");
  return {
    ok: "success",
  };
}

export async function updateFoodName(id: number, name: string) {
  const result = validatePartialFood({ name });
  if (result) {
    console.error(`Validation failed: ${result}`);
    return {
      errors: result,
    };
  }
  const food = await prisma.food.update({ where: { id }, data: { name } });
  revalidateTag("foods");
  return {
    ok: "success",
  };
}

export async function updateFoodAmount(id: number, amount: number) {
  const result = validatePartialFood({ amount: String(amount) });
  if (result) {
    console.error(`Validation failed: ${result}`);
    return {
      errors: result,
    };
  }
  const food = await prisma.food.update({ where: { id }, data: { amount } });
  revalidateTag("foods");
  return {
    ok: "success",
  };
}

export async function updateFoodUnit(id: number, unit: MeasurementUnit) {
  const result = validatePartialFood({ unit });
  if (result) {
    console.error(`Validation failed: ${result}`);
    return {
      errors: result,
    };
  }
  const food = await prisma.food.update({ where: { id }, data: { unit } });
  revalidateTag("foods");
  return {
    ok: "success",
  };
}

export async function updateFoodStorage(id: number, storage: StorageType) {
  const result = validatePartialFood({ storage });
  if (result) {
    console.error(`Validation failed: ${result}`);
    return {
      errors: result,
    };
  }
  const food = await prisma.food.update({ where: { id }, data: { storage } });
  revalidateTag("foods");
  return {
    ok: "success",
  };
}

export async function updateFoodExpiry(id: number, e: string) {
  let expiry = e === "" ? null : e;
  const result = validatePartialFood({ expiry });
  if (result) {
    console.error(`Validation failed: ${result}`);
    return {
      errors: result,
    };
  }
  const food = await prisma.food.update({ where: { id }, data: { expiry } });
  revalidateTag("foods");
  return {
    ok: "success",
  };
}

export async function getShoppingItems() {
  try {
    const shoppingItems = await prisma.shoppingItem.findMany({
      orderBy: [
        {
          name: "asc",
        },
        {
          id: "desc",
        },
      ],
    });
    revalidateTag("shoppingitems");
    return shoppingItems;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function removeShoppingItem(e: FormData) {
  const id = Number(e.get("id"));
  await prisma.shoppingItem.delete({ where: { id } });
  revalidateTag("shoppingitem");
}

export async function addShoppingItem(e: FormData) {
  const name = e.get("name") as string;
  if (name === "") {
    return {
      error: "Name cannot be empty",
    };
  }
  const shoppingItemExists = await prisma.shoppingItem.findFirst({
    where: {
      name,
    },
  });
  if (shoppingItemExists) {
    return {
      error: "Shopping item already exists",
    };
  }
  const shoppingItem = await prisma.shoppingItem.create({
    data: {
      name,
    },
  });
  revalidateTag("shoppingitem");
  return {
    ok: "success",
  };
}
