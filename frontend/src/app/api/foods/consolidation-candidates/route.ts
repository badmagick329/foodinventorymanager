import { NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";
import { findConsolidationGroups } from "@/lib/food-consolidation";

export const dynamic = "force-dynamic";

// GET /api/foods/consolidation-candidates
export async function GET() {
  try {
    const foods = await prisma.food.findMany({
      orderBy: [
        { name: "asc" },
        { unit: "asc" },
        { storage: "asc" },
        { expiry: "asc" },
        { id: "asc" },
      ],
    });

    return NextResponse.json(
      { groups: findConsolidationGroups(foods) },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not load consolidation candidates." },
      { status: 500 }
    );
  }
}
