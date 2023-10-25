import { StorageType, MeasurementUnit } from "@prisma/client";
import fs from "fs";
import prisma from "../../prisma/client";
import { validateFood } from "@/lib/validators";
import { NextResponse } from "next/server";

type Food = {
  name: string;
  amount: string;
  unit: string;
  expiry: string;
  storage: string;
};

export default async function createFood(food: Food) {
  let name = food.name.trim() as string;
  let amount = String(food.amount).trim() as string;
  let unit = food.unit.toLowerCase().trim() as string;
  let expiry = food.expiry === null ? null : food.expiry.trim();
  let storage = food.storage.trim() as string;
  if (!MeasurementUnit.hasOwnProperty(unit)) {
    unit = "unit";
  }
  const validationError = validateFood({
    name,
    unit,
    amount,
    expiry,
    storage,
  });
  if (validationError) {
    console.log(`Validation failed: ${validationError}`);
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
    return NextResponse.json(food, { status: 201 });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { error: "Something went wrong", foods: [] },
      { status: 400 }
    );
  }
}
