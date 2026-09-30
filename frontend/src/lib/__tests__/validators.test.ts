import { z } from "zod";
import { foodSchema, formatZodError } from "../validators";

describe("formatZodError", () => {
  it("keeps root-level issues that have no field path", () => {
    const result = z
      .array(foodSchema)
      .min(1, "No items to import")
      .safeParse([]);

    expect(result.success).toBe(false);
    expect(formatZodError(result.error!)).toBe("No items to import");
  });

  it("names the item and field for nested issues", () => {
    const result = z
      .array(foodSchema)
      .safeParse([
        { name: "Milk", amount: 0, unit: "l", expiry: null, storage: "fridge" },
      ]);

    expect(formatZodError(result.error!)).toBe(
      "0.amount: Amount must be greater than 0"
    );
  });
});

describe("foodSchema expiry", () => {
  const food = { name: "Rice", amount: 1, unit: "kg", storage: "pantry" };

  it("treats a missing or blank expiry as no expiry", () => {
    expect(foodSchema.parse(food).expiry).toBeNull();
    expect(foodSchema.parse({ ...food, expiry: " " }).expiry).toBeNull();
  });

  it("leaves expiry untouched in a partial update that omits it", () => {
    expect(foodSchema.partial().parse({ amount: 2 })).toEqual({ amount: 2 });
  });
});
