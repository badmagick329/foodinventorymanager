import { NextResponse } from "next/server";
import { apiRoute, readJson, type IdParams } from "@/server/http";
import {
  deleteFoodRemoval,
  updateFoodRemoval,
} from "@/server/inventory/removals";

export const PATCH = apiRoute(async (request, { params }: IdParams) =>
  NextResponse.json(await updateFoodRemoval(params.id, await readJson(request)))
);

export const DELETE = apiRoute(async (_request, { params }: IdParams) => {
  await deleteFoodRemoval(params.id);
  return NextResponse.json({ id: params.id });
});
