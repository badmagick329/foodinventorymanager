import type { Food } from "@prisma/client";
import { hasFoodFormChanges } from "../food-form";
import type { ModifyFoodFormInput } from "../types";

const food = {
  id: 1,
  name: "Milk",
  amount: 1.5,
  unit: "l",
  expiry: null,
  storage: "fridge",
} as unknown as Food;

const saved = {
  name: "Milk",
  amount: 1.5,
  unit: "l",
  expiry: "",
  storage: "fridge",
} as ModifyFoodFormInput;

describe("hasFoodFormChanges", () => {
  it("treats the saved values, typed as text, as unchanged", () => {
    expect(hasFoodFormChanges(food, saved)).toBe(false);
    expect(
      hasFoodFormChanges(food, {
        ...saved,
        amount: "1.50" as unknown as number,
      })
    ).toBe(false);
  });

  it("detects a change to any field", () => {
    expect(hasFoodFormChanges(food, { ...saved, name: "Oat milk" })).toBe(
      true
    );
    expect(
      hasFoodFormChanges(food, { ...saved, amount: "2" as unknown as number })
    ).toBe(true);
    expect(hasFoodFormChanges(food, { ...saved, unit: "unit" })).toBe(true);
    expect(hasFoodFormChanges(food, { ...saved, expiry: "2026-10-20" })).toBe(
      true
    );
    expect(hasFoodFormChanges(food, { ...saved, storage: "freezer" })).toBe(
      true
    );
  });
});
