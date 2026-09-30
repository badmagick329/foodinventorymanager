import { NextResponse } from "next/server";
import { apiRoute, parseId, type IdParams } from "@/server/http";
import { removeShoppingItem } from "@/server/inventory/shopping";

export const DELETE = apiRoute(async (_request, { params }: IdParams) => {
  const id = parseId((await params).id);
  await removeShoppingItem(id);
  return NextResponse.json({ id });
});
