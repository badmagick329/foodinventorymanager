import { FoodRemovalSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiRoute, parseId, readJson, type IdParams } from "@/server/http";
import { getFood, removeFoods, updateFood } from "@/server/inventory/foods";

export const GET = apiRoute(async (_request, { params }: IdParams) =>
  NextResponse.json(await getFood(parseId((await params).id)))
);

export const PATCH = apiRoute(async (request, { params }: IdParams) =>
  NextResponse.json(
    await updateFood(
      parseId((await params).id),
      await readJson(request),
      FoodRemovalSource.manual
    )
  )
);

export const DELETE = apiRoute(async (request, { params }: IdParams) => {
  const id = parseId((await params).id);
  const body = (await readJson(request)) as { removalReason?: unknown } | null;
  await removeFoods([id], body?.removalReason, FoodRemovalSource.manual);
  return NextResponse.json({ id });
});
