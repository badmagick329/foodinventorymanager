import { FoodRemovalSource } from "@prisma/client";
import { getConsumedAmount, updateFoodAndRecordUsage } from "../food-removals";

describe("partial food usage", () => {
  it("calculates a same-unit reduction", () => {
    expect(getConsumedAmount(4, 3.5, "unit", "unit")).toBe(0.5);
  });

  it("does not calculate increases or unchanged amounts", () => {
    expect(getConsumedAmount(4, 5, "unit", "unit")).toBeNull();
    expect(getConsumedAmount(4, 4, "unit", "unit")).toBeNull();
  });

  it("treats a unit change as a conversion", () => {
    expect(getConsumedAmount(1000, 1, "g", "kg")).toBeNull();
  });

  it("records the reduced amount and updates the food", async () => {
    const food = {
      id: 1,
      name: "Milk",
      amount: 4,
      unit: "unit",
      expiry: null,
      storage: "fridge",
    };
    const createMany = jest.fn().mockResolvedValue({ count: 1 });
    const update = jest.fn().mockResolvedValue({ ...food, amount: 3.5 });
    const db = {
      food: {
        findUnique: jest.fn().mockResolvedValue(food),
        update,
      },
      foodRemoval: { createMany },
    } as never;

    const result = await updateFoodAndRecordUsage(
      db,
      food.id,
      { amount: 3.5 },
      FoodRemovalSource.manual
    );

    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          foodId: 1,
          name: "Milk",
          amount: 0.5,
          unit: "unit",
          expiry: null,
          storage: "fridge",
          reason: "consumed",
          source: "manual",
        },
      ],
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { amount: 3.5 },
    });
    expect(result?.updatedFood.amount).toBe(3.5);
  });

  it("does not record history for an increase", async () => {
    const food = {
      id: 1,
      name: "Milk",
      amount: 4,
      unit: "unit",
      expiry: null,
      storage: "fridge",
    };
    const createMany = jest.fn();
    const db = {
      food: {
        findUnique: jest.fn().mockResolvedValue(food),
        update: jest.fn().mockResolvedValue({ ...food, amount: 5 }),
      },
      foodRemoval: { createMany },
    } as never;

    await updateFoodAndRecordUsage(
      db,
      food.id,
      { amount: 5 },
      FoodRemovalSource.assistant
    );

    expect(createMany).not.toHaveBeenCalled();
  });
});
