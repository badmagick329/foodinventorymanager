import { NextResponse } from "next/server";
import { apiRoute, readJson } from "@/server/http";
import { createFoods } from "@/server/inventory/foods";

export const POST = apiRoute(async (request) =>
  NextResponse.json(
    { created: (await createFoods(await readJson(request))).length },
    { status: 201 }
  )
);
