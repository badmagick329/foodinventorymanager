import { NextRequest, NextResponse } from "next/server";
import processPdf from "@/receipt-reader/reader";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get("file") as unknown as File;
  if (!file) {
    return NextResponse.json({ error: "No file found" }, { status: 400 });
  }
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  try {
    const foodItems = await processPdf(buffer);
    return NextResponse.json({ data: foodItems }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Error parsing pdf" }, { status: 400 });
  }
}
