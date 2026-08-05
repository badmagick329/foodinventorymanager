import { NextResponse } from "next/server";
import prisma from "../../../../prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const removals = await prisma.foodRemoval.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(removals);
  } catch (error) {
    console.error("Could not load food removal history", error);
    return NextResponse.json({ error: "Could not load removal history." }, { status: 500 });
  }
}
