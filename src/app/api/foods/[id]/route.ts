import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";

export async function DELETE(request: any) {
  const body = await request.json();
  const { id } = body;
  console.log(`Received ID: ${id}`);
  await prisma.food.delete({ where: { id } });
  return NextResponse.json({ id }, { status: 200 });
}

export async function PUT(request: any) {
  const body = await request.json();
  const { id, name, unit, amount } = body;
  console.log(`Received values: ${id}, ${name}, ${unit}, ${amount}`);
  await prisma.food.update({
    where: { id },
    data: {
      name,
      amount: Number(amount),
      unit,
    },
  });
  return NextResponse.json({ id }, { status: 200 });
}
