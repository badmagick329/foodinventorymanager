import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/client";
import { Food, MeasurementUnit } from "@prisma/client";

function validateFood(name: string, unit: string, amount: string) {
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
    return "Unit must be one of: " + Object.values(MeasurementUnit).join(", ");
  }
  return null;
}

export async function POST(request: NextRequest) {
  console.log(`Received request: ${JSON.stringify(request)}`);
  const body = await request.json();
  const name = body.name.trim();
  const unit = body.unit.toUpperCase().trim();
  const amount = body.amount.trim();
  console.log(`Received values: ${name}, ${unit}, ${amount}`);
  const validationError = validateFood(name, unit, amount);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  const food = await prisma.food.create({
    data: {
      name,
      amount: Number(amount),
      unit,
    },
  });
  return NextResponse.json(food, { status: 201 });
}

// TODO: Not in use. Remove?
export async function GET(request: NextRequest) {
  const foods: Food[] = await prisma.food.findMany();
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
    values.unit = values.unit.toUpperCase();
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
