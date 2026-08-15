import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";
import { foodRemovalSchema, formatZodError } from "@/lib/validators";

// PATCH /api/food-removals/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json(
      { error: "Invalid history entry ID" },
      { status: 400 }
    );
  }

  try {
    const validation = foodRemovalSchema
      .partial()
      .safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const removal = await prisma.foodRemoval.update({
      where: { id },
      data: validation.data,
    });
    return NextResponse.json(removal);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "History entry not found" },
        { status: 404 }
      );
    }
    console.error("Could not update food removal history", error);
    return NextResponse.json(
      { error: "Could not update removal history." },
      { status: 500 }
    );
  }
}

// DELETE /api/food-removals/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json(
      { error: "Invalid history entry ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.foodRemoval.delete({ where: { id } });
    return NextResponse.json({ id });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "History entry not found" },
        { status: 404 }
      );
    }
    console.error("Could not delete food removal history", error);
    return NextResponse.json(
      { error: "Could not delete removal history." },
      { status: 500 }
    );
  }
}
