import { MeasurementUnit, StorageType } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";

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
    const { name, amount, unit, expiry, storage } = body;

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (amount !== undefined) {
      const amountNum = Number(amount);
      if (isNaN(amountNum)) {
        return NextResponse.json(
          { error: "Amount must be a number" },
          { status: 400 }
        );
      }
      if (amountNum < 0) {
        return NextResponse.json(
          { error: "Amount must be greater than or equal to 0" },
          { status: 400 }
        );
      }
      updateData.amount = amountNum;
    }

    if (unit !== undefined) {
      const unitLower = String(unit).toLowerCase();
      if (
        !Object.values(MeasurementUnit).includes(unitLower as MeasurementUnit)
      ) {
        return NextResponse.json(
          {
            error:
              "Unit must be one of: " +
              Object.values(MeasurementUnit).join(", "),
          },
          { status: 400 }
        );
      }
      updateData.unit = unitLower as MeasurementUnit;
    }

    if (expiry !== undefined) {
      updateData.expiry =
        expiry === "" || expiry === null ? null : String(expiry).trim();
    }

    if (storage !== undefined) {
      const storageTrimmed = String(storage).trim();
      if (!Object.values(StorageType).includes(storageTrimmed as StorageType)) {
        return NextResponse.json(
          {
            error:
              "Storage must be one of: " +
              Object.values(StorageType).join(", "),
          },
          { status: 400 }
        );
      }
      updateData.storage = storageTrimmed as StorageType;
    }

    const existingFood = await prisma.food.findUnique({
      where: { id },
    });

    if (!existingFood) {
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 }
      );
    }

    const updatedFood = await prisma.food.update({
      where: { id },
      data: updateData,
    });

    revalidateTag("foods");
    return NextResponse.json(updatedFood, { status: 200 });
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

    const existingFood = await prisma.food.findUnique({
      where: { id },
    });

    if (!existingFood) {
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 }
      );
    }

    await prisma.food.delete({
      where: { id },
    });

    revalidateTag("foods");
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
