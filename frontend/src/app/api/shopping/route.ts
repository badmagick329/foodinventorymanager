import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/client";

export async function GET(request: NextRequest) {
  try {
    const shoppingItems = await prisma.shoppingItem.findMany({
      orderBy: [
        {
          id: "asc",
        },
        {
          name: "asc",
        },
      ],
    });
    return NextResponse.json(shoppingItems, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong", shoppingItems: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = body.name.trim() as string;
  console.log("Creating shopping item with name:", name);
  if (name === "") {
    return NextResponse.json(
      { message: "Name cannot be empty" },
      { status: 400 }
    );
  }
  try {
    const shoppingItemExists = await prisma.shoppingItem.findFirst({
      where: {
        name,
      },
    });
    if (shoppingItemExists) {
      return NextResponse.json(
        { message: "Shopping item already exists" },
        { status: 400 }
      );
    }
    const shoppingItem = await prisma.shoppingItem.create({
      data: {
        name,
      },
    });
    console.log("Created shopping item:", shoppingItem);
    return NextResponse.json(shoppingItem, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
