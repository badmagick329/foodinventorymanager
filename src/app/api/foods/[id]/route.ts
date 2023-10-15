import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";
import { MeasurementUnit } from "@prisma/client";

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;
  console.log(`Received ID: ${id}`);
  await prisma.food.delete({ where: { id } });
  return NextResponse.json({ id }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, values } = body;
  console.log(`Received ID: ${id} and values: ${JSON.stringify(values)}`);
  if (values.amount) {
    if (isNaN(Number(values.amount))) {
      return NextResponse.json(
        { error: "Amount must be a number" },
        { status: 400 },
      );
    }
    values.amount = Number(values.amount);
    if (values.amount < 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 },
      );
    }
  }
  if (values.unit) {
    values.unit = values.unit.toUpperCase();
    if (
      !Object.values(MeasurementUnit).includes(values.unit as MeasurementUnit)
    ) {
      return NextResponse.json(
        {
          error:
            "Unit must be one of: " + Object.values(MeasurementUnit).join(", "),
        },
        { status: 400 },
      );
    }
  }
  await prisma.food.update({ where: { id }, data: values });
  return NextResponse.json({ id }, { status: 200 });
}
