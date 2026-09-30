import pdf from "pdf-parse";
import { FoodFromReceipt } from "./parser/types";
import { Parser } from "@/receipt-reader/parser";

export default async function processPdf(
  buffer: Buffer
): Promise<FoodFromReceipt[]> {
  const { text } = await pdf(buffer);
  return Parser.create(text).parse();
}
