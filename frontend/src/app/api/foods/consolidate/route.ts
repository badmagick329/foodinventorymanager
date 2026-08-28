import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";
import {
  consolidateFoods,
  FoodConsolidationError,
} from "@/lib/food-consolidation";

// POST /api/foods/consolidate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const foodIds = body?.foodIds;

    if (
      !Array.isArray(foodIds) ||
      foodIds.length < 2 ||
      foodIds.some((id) => !Number.isInteger(id) || id <= 0)
    ) {
      return NextResponse.json(
        { error: "Select at least two valid food items to consolidate." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction((tx) =>
      consolidateFoods(tx, foodIds)
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof FoodConsolidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
