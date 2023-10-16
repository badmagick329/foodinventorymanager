import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/client";
import { Food, MeasurementUnit, StorageType } from "@prisma/client";

export function validateFood(
  name: string,
  unit: string,
  amount: string,
  expiry: string | null,
  storage: string,
) {
  if (!name) {
    return "Name is required";
  }
  if (!unit) {
    return "Amount is required";
  }
  if (isNaN(Number(amount))) {
    return "Amount must be a number";
  }
  if (!unit) {
    return "Unit is required";
  }
  if (!Object.values(MeasurementUnit).includes(unit as MeasurementUnit)) {
    console.log(`Unit is: ${unit}`);
    return "Unit must be one of: " + Object.values(MeasurementUnit).join(", ");
  }
  if (Number(amount) < 0) {
    return "Amount must be greater than 0";
  }
  if (expiry !== null && isNaN(Date.parse(expiry))) {
    return "Expiry must be a valid date";
  }
  if (!Object.values(StorageType).includes(storage as StorageType)) {
    return "Storage must be one of: " + Object.values(StorageType).join(", ");
  }
  return null;
}

export async function POST(request: NextRequest) {
  console.log(`Received request: ${JSON.stringify(request)}`);
  const body = await request.json();
  const name = body.name.trim() as string;
  const amount = body.amount.trim() as string;
  let unit = body.unit.toLowerCase().trim() as string;
  let expiry = body.expiry.trim() === "" ? null : body.expiry.trim();
  const storage = body.storage.trim() as string;
  console.log(`Received values: ${name}, ${unit}, ${amount}, ${expiry}, ${storage}`);
  const validationError = validateFood(name, unit, amount, expiry, storage);
  if (validationError) {
    console.log(`Validation failed: ${validationError}`);
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

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;
  console.log(`Received ID: ${id}`);
  await prisma.food.delete({ where: { id } });
  return NextResponse.json({ id }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, values } = body;
  console.log(`Received ID: ${id} and values: ${JSON.stringify(values)}`);
  if (values.amount) {
    if (isNaN(Number(values.amount))) {
      return NextResponse.json(
        { error: "Amount must be a number" },
        { status: 400 },
      );
    }
    values.amount = Number(values.amount);
    if (values.amount < 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 },
      );
    }
  }
  if (values.unit) {
    values.unit = values.unit.toLowerCase();
    if (
      !Object.values(MeasurementUnit).includes(values.unit as MeasurementUnit)
    ) {
      return NextResponse.json(
        {
          error:
            "Unit must be one of: " + Object.values(MeasurementUnit).join(", "),
        },
        { status: 400 },
      );
    }
  }
  await prisma.food.update({ where: { id }, data: values });
  return NextResponse.json({ id }, { status: 200 });
}
