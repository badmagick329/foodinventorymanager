import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const existingFood = await prisma.shoppingItem.findUnique({
      where: { id },
    });

    if (!existingFood) {
      return NextResponse.json(
        { error: "Shopping item not found" },
        { status: 404 }
      );
    }

    await prisma.shoppingItem.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Shopping item deleted successfully", id },
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
