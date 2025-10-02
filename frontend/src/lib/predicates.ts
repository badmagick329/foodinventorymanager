import { FoodFromReceipt } from "@/receipt-reader/parser/types";
import { foodFromReceiptSchema } from "./validators";

export function isFoodFromReceipt(data: unknown): data is FoodFromReceipt {
  return foodFromReceiptSchema.safeParse(data).success;
}

export function isArrayOfFoodFromReceipt(
  data: unknown
): data is FoodFromReceipt[] {
  return Array.isArray(data) && data.every(isFoodFromReceipt);
}
