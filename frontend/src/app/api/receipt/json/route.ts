import { validateFood } from "@/lib/validators";
import { MeasurementUnit, StorageType } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";

export async function POST(request: NextRequest) {
  const data = await request.json();
  const createErrors = [];
  let created = 0;
  for (const foodItem of data) {
    let name = foodItem.name.trim() as string;
    let amount = String(foodItem.amount).trim() as string;
    let unit = foodItem.unit.toLowerCase().trim() as string;
    let expiry = foodItem.expiry === null ? null : foodItem.expiry.trim();
    let storage = foodItem.storage.trim() as string;
    const validationError = validateFood({
      name,
      unit,
      amount,
      expiry,
      storage,
    });
    if (validationError) {
      console.error(`Validation failed: ${validationError}`);
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    unit = unit as MeasurementUnit;
    try {
      const food = await prisma.food.create({
        data: {
          name,
          amount: Number(amount),
          unit: unit as MeasurementUnit,
          expiry,
          storage: storage as StorageType,
        },
      });
      created++;
    } catch (error: any) {
      createErrors.push(error);
    }
  }
  if (createErrors.length > 0) {
    for (const error of createErrors) {
      console.error(error);
    }
  }
  if (created === 0) {
    return NextResponse.json({ error: "No items created" }, { status: 400 });
  }
  revalidateTag("foods");
  return NextResponse.json({ status: 201 });
}
