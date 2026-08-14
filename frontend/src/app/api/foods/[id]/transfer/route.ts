import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/client";
import { FoodTransferError, transferFoodAmount } from "@/lib/food-transfers";
import { foodTransferSchema, formatZodError } from "@/lib/validators";

// POST /api/foods/:id/transfer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const validation = foodTransferSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }
    const result = await prisma.$transaction((tx) =>
      transferFoodAmount(tx, id, validation.data)
    );
    if (!result) {
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof FoodTransferError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
