import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "../../../../prisma/client";
import { Food } from "@prisma/client";

const FoodSchema = z.object({
  name: z.string().min(1),
  amount: z.number(),
  unit: z.string(),
});

export async function POST(request: NextRequest) {
  console.log(`Received request: ${JSON.stringify(request)}`);
  const body = await request.json();
  console.log(`Received body: ${JSON.stringify(body)}`);
  const validation = FoodSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(validation.error, { status: 400 });
  }
  const food = await prisma.food.create({
    data: {
      name: body.name,
      amount: body.amount,
      unit: body.unit,
    },
  });
  return NextResponse.json(food, { status: 201 });
}

export async function GET(request: NextRequest) {
  const foods: Food[] = await prisma.food.findMany();
  return NextResponse.json(foods, { status: 200 });
}
