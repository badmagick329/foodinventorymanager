import { foodSchema, formatZodError } from "@/lib/validators";
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";

export async function POST(request: NextRequest) {
  const data = await request.json();
  const createErrors = [];
  let created = 0;
  for (const foodItem of data) {
    let { name, amount, unit, expiry, storage } = foodItem;
    const result = foodSchema.safeParse({
      name,
      unit,
      amount,
      expiry,
      storage,
    });
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    try {
      await prisma.food.create({ data: result.data });
      created++;
    } catch (error) {
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
  return NextResponse.json({ status: 201 });
}
