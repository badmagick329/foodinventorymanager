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
