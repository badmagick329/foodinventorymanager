import { NextResponse } from "next/server";
import { apiRoute, readJson, type IdParams } from "@/server/http";
import {
  deleteFoodRemoval,
  updateFoodRemoval,
} from "@/server/inventory/removals";

export const PATCH = apiRoute(async (request, { params }: IdParams) => {
  const { id } = await params;
  return NextResponse.json(
    await updateFoodRemoval(id, await readJson(request))
  );
});

export const DELETE = apiRoute(async (_request, { params }: IdParams) => {
  const { id } = await params;
  await deleteFoodRemoval(id);
  return NextResponse.json({ id });
});
