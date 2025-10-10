import { validateFood } from "@/lib/validators";
import { MeasurementUnit, StorageType } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = body.name.trim() as string;
  const amount = body.amount.trim() as string;
  let unit = body.unit.toLowerCase().trim() as string;
  let expiry = body.expiry.trim() === "" ? null : body.expiry.trim();
  const storage = body.storage.trim() as string;
  const validationError = validateFood({ name, unit, amount, expiry, storage });
  if (validationError) {
    console.error(`Validation failed: ${validationError}`);
    return NextResponse.json({ error: validationError }, { status: 400 });
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
  return NextResponse.json(food, { status: 201 });
}

export async function GET(request: NextRequest) {
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
    revalidateTag("foods");
    return NextResponse.json(foods, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong", foods: [] },
      { status: 500 }
    );
  }
}
