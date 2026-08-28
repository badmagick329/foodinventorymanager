import { NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";
import {
  consolidateFoods,
  findConsolidationGroups,
  FoodConsolidationError,
} from "@/lib/food-consolidation";

// POST /api/foods/consolidate
export async function POST() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const foods = await tx.food.findMany({
        orderBy: [
          { name: "asc" },
          { unit: "asc" },
          { storage: "asc" },
          { expiry: "asc" },
          { id: "asc" },
        ],
      });
      const groups = findConsolidationGroups(foods);
      const consolidatedGroups = [];

      for (const group of groups) {
        consolidatedGroups.push(
          await consolidateFoods(
            tx,
            group.foods.map((food) => food.id)
          )
        );
      }

      return {
        groupsConsolidated: consolidatedGroups.length,
        duplicateItemsRemoved: consolidatedGroups.reduce(
          (total, group) => total + group.removedFoodIds.length,
          0
        ),
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof FoodConsolidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
