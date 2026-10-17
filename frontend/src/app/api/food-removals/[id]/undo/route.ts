import { NextResponse } from "next/server";
import { apiRoute, type IdParams } from "@/server/http";
import { undoFoodRemoval } from "@/server/inventory/removals";

export const POST = apiRoute(async (_request, { params }: IdParams) =>
  NextResponse.json(await undoFoodRemoval((await params).id))
);
