import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/client";
import { Food, MeasurementUnit, StorageType } from "@prisma/client";
import { validateFood } from "@/lib/validators";

export async function POST(request: NextRequest) {
  console.log(`Received request: ${JSON.stringify(request)}`);
  const body = await request.json();
  const name = body.name.trim() as string;
  const amount = body.amount.trim() as string;
  let unit = body.unit.toLowerCase().trim() as string;
  let expiry = body.expiry.trim() === "" ? null : body.expiry.trim();
  const storage = body.storage.trim() as string;
  console.log(
    `Received values: ${name}, ${unit}, ${amount}, ${expiry}, ${storage}`,
  );
  const validationError = validateFood({ name, unit, amount, expiry, storage });
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

export async function GET(request: NextRequest) {
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
  return NextResponse.json(foods, { status: 200 });
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
