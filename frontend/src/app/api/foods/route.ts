import { foodSchema, formatZodError } from "@/lib/validators";
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  let { name, amount, unit, expiry, storage } = body;
  const result = foodSchema.safeParse({ name, unit, amount, expiry, storage });
  if (result.error) {
    return NextResponse.json(
      { error: formatZodError(result.error) },
      { status: 400 }
    );
  }

  const food = await prisma.food.create({ data: result.data });
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
    return NextResponse.json(foods, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong", foods: [] },
      { status: 500 }
    );
  }
}
