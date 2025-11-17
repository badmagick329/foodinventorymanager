import { foodSchema, formatZodError, validateFood } from "@/lib/validators";
import { MeasurementUnit } from "@prisma/client";
import { NextResponse } from "next/server";
import prisma from "../../prisma/client";

type Food = {
  name: string;
  amount: string;
  unit: string;
  expiry: string;
  storage: string;
};

export default async function createFood(food: Food) {
  let { name, amount, unit, expiry, storage } = food;
  if (!MeasurementUnit.hasOwnProperty(unit)) {
    unit = "unit";
  }
  const result = foodSchema.safeParse({ name, unit, amount, expiry, storage });
  if (!result.success) {
    return NextResponse.json(
      { error: formatZodError(result.error) },
      { status: 400 }
    );
  }

  try {
    const food = await prisma.food.create({ data: result.data });
    return NextResponse.json(food, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong", foods: [] },
      { status: 400 }
    );
  }
}
