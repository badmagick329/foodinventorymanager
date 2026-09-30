import { InvalidInputError } from "@/server/errors";
import { consolidateFoods } from "../consolidation";

const food = {
  id: 1,
  name: "Milk",
  amount: 2,
  unit: "unit",
  expiry: "2026-08-20",
  storage: "fridge",
} as const;

function mockDb(foods: unknown[]) {
  const update = jest.fn().mockResolvedValue({});
  const deleteMany = jest.fn().mockResolvedValue({ count: foods.length - 1 });
  const db = {
    food: { findMany: jest.fn().mockResolvedValue(foods), update, deleteMany },
  } as never;
  return { db, update, deleteMany };
}

describe("consolidateFoods", () => {
  it("keeps the lowest id and sums equivalent entries", async () => {
    const { db, update, deleteMany } = mockDb([
      food,
      { ...food, id: 2, amount: 1.5 },
    ]);

    const result = await consolidateFoods(db, [1, 2]);

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { amount: 3.5, expiry: "2026-08-20" },
    });
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: { in: [2] } } });
    expect(result.removedFoodIds).toEqual([2]);
  });

  it("rejects different expiries unless allowed", async () => {
    const { db } = mockDb([food, { ...food, id: 2, expiry: "2026-08-21" }]);

    await expect(consolidateFoods(db, [1, 2])).rejects.toBeInstanceOf(
      InvalidInputError
    );
  });

  it("keeps the chosen primary and the earliest expiry when allowed", async () => {
    const { db, update, deleteMany } = mockDb([
      { ...food, expiry: "2026-08-25" },
      { ...food, id: 2, expiry: null },
      { ...food, id: 3, expiry: "2026-08-21" },
    ]);

    await consolidateFoods(db, [1, 2, 3], {
      primaryFoodId: 2,
      allowDifferentExpiry: true,
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { amount: 6, expiry: "2026-08-21" },
    });
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: { in: [1, 3] } } });
  });

  it("rejects a primary that is not being consolidated", async () => {
    const { db } = mockDb([food, { ...food, id: 2 }]);

    await expect(
      consolidateFoods(db, [1, 2], { primaryFoodId: 9 })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
