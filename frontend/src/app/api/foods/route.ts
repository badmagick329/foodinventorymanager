import { NextResponse } from "next/server";
import { apiRoute, readJson } from "@/server/http";
import { createFood, listFoods } from "@/server/inventory/foods";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => NextResponse.json(await listFoods()));

export const POST = apiRoute(async (request) =>
  NextResponse.json(await createFood(await readJson(request)), { status: 201 })
);
