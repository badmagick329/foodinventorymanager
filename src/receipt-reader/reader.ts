import pdf from "pdf-parse";
import cleanLines from "./lib/cleaner";
import parseLines from "./lib/parser";
import { FoodFromReceipt } from "./lib/types";

export default async function processPdf(
  buffer: Buffer
): Promise<FoodFromReceipt[]> {
  const data = await pdf(buffer);
  const lines = data.text.split("\n").filter((line) => line !== "");
  const clean = cleanLines(lines);
  return parseLines(clean);
}
