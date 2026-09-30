import { NextResponse } from "next/server";
import { InvalidInputError } from "@/server/errors";
import { apiRoute } from "@/server/http";
import processPdf from "@/receipt-reader/reader";

export const POST = apiRoute(async (request) => {
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) throw new InvalidInputError("No file found.");
  try {
    const data = await processPdf(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    throw new InvalidInputError("Could not read that receipt PDF.");
  }
});
