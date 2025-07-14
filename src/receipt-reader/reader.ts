import pdf from "pdf-parse";
import { FoodFromReceipt } from "./parser/types";
import { Parser } from "@/receipt-reader/parser";

export default async function processPdf(
  buffer: Buffer
): Promise<FoodFromReceipt[]> {
  const data = await pdf(buffer);
  const lines = data.text.split("\n").filter((line) => line !== "");
  const parser = Parser.create(data.text);
  const parsed = parser.parse();
  console.log(parsed);
  return parsed;
}
