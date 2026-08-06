import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";
import { foodSchema, formatZodError } from "@/lib/validators";
import { FoodRemovalReason, FoodRemovalSource } from "@prisma/client";
import {
  recordFoodRemovals,
  updateFoodAndRecordUsage,
} from "@/lib/food-removals";

// GET /api/foods/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const food = await prisma.food.findUnique({
      where: { id },
    });

    if (!food) {
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(food, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// PATCH /api/foods/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const body = await request.json();

    const validation = foodSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction((tx) =>
      updateFoodAndRecordUsage(
        tx,
        id,
        validation.data,
        FoodRemovalSource.manual
      )
    );

    if (!result) {
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.updatedFood, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// DELETE /api/foods/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const body = await request.json();
    const removalReason = body?.removalReason;
    if (!Object.values(FoodRemovalReason).includes(removalReason)) {
      return NextResponse.json(
        {
          error:
            "Choose whether the item was consumed, discarded, or an accidental entry.",
        },
        { status: 400 }
      );
    }

    const existingFood = await prisma.$transaction(async (tx) => {
      const food = await tx.food.findUnique({ where: { id } });
      if (!food) return null;
      await recordFoodRemovals(
        tx,
        [food],
        removalReason,
        FoodRemovalSource.manual
      );
      await tx.food.delete({ where: { id } });
      return food;
    });

    if (!existingFood)
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 }
      );

    return NextResponse.json(
      { message: "Food item deleted successfully", id },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
