import type { Food } from "@prisma/client";
import type { ModifyFoodFormInput } from "./types";

/**
 * Whether the edit form differs from the saved item. The amount input is a
 * text field, so its value arrives as a string at runtime and is compared
 * numerically: "1.0" is no change from 1.
 */
export function hasFoodFormChanges(food: Food, values: ModifyFoodFormInput) {
  return (
    values.name !== food.name ||
    Number(values.amount) !== food.amount ||
    values.unit !== food.unit ||
    values.expiry !== (food.expiry ?? "") ||
    values.storage !== food.storage
  );
}
