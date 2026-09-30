import { NextResponse } from "next/server";
import { apiRoute, readJson } from "@/server/http";
import {
  addShoppingItem,
  clearShoppingList,
  listShoppingItems,
} from "@/server/inventory/shopping";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () =>
  NextResponse.json(await listShoppingItems())
);

export const POST = apiRoute(async (request) =>
  NextResponse.json(await addShoppingItem(await readJson(request)), {
    status: 201,
  })
);

export const DELETE = apiRoute(async () =>
  NextResponse.json({ removed: await clearShoppingList() })
);
