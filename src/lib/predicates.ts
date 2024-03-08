import { foodFromReceiptSchema } from "./validators";
import { FoodFromReceipt } from "@/receipt-reader/lib/types";

export function isFoodFromReceipt(data: unknown): data is FoodFromReceipt {
  return foodFromReceiptSchema.safeParse(data).success;
}

export function isArrayOfFoodFromReceipt(
  data: unknown
): data is FoodFromReceipt[] {
  return Array.isArray(data) && data.every(isFoodFromReceipt);
}
