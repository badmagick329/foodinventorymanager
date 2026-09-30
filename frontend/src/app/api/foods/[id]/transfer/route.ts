import { NextResponse } from "next/server";
import { apiRoute, parseId, readJson, type IdParams } from "@/server/http";
import { transferFood } from "@/server/inventory/foods";

export const POST = apiRoute(async (request, { params }: IdParams) =>
  NextResponse.json(
    await transferFood(parseId(params.id), await readJson(request))
  )
);
