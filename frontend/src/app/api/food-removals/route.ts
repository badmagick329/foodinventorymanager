import { NextResponse } from "next/server";
import { apiRoute } from "@/server/http";
import { listFoodRemovals } from "@/server/inventory/removals";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () =>
  NextResponse.json(await listFoodRemovals())
);
