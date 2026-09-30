import { NextResponse } from "next/server";
import { apiRoute } from "@/server/http";
import { consolidateAllMatchingFoods } from "@/server/inventory/consolidation";

export const POST = apiRoute(async () =>
  NextResponse.json(await consolidateAllMatchingFoods())
);
