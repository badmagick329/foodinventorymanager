import {
  canConsolidateFoods,
  consolidateFoods,
  FoodConsolidationError,
} from "../food-consolidation";

const food = {
  id: 1,
  name: "Milk",
  amount: 2,
  unit: "unit",
  expiry: "2026-08-20",
  storage: "fridge",
} as const;

describe("food consolidation", () => {
  it("allows equivalent entries and sums their amounts", async () => {
    const foods = [food, { ...food, id: 2, amount: 1.5 }];
    const update = jest.fn().mockResolvedValue({ ...food, amount: 3.5 });
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const db = {
      food: {
        findMany: jest.fn().mockResolvedValue(foods),
        update,
        deleteMany,
      },
    } as never;

    expect(canConsolidateFoods(foods as never)).toBe(true);
    const result = await consolidateFoods(db, [1, 2]);

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { amount: 3.5 },
    });
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: { in: [2] } } });
    expect(result.removedFoodIds).toEqual([2]);
  });

  it.each([
    ["different expiry", { expiry: "2026-08-21" }],
    ["one missing expiry", { expiry: null }],
    ["different unit", { unit: "kg" }],
    ["different storage", { storage: "pantry" }],
    ["different name", { name: "Oat milk" }],
  ])("rejects %s", async (_description, change) => {
    const changedFood = { ...food, id: 2, ...change };
    expect(canConsolidateFoods([food, changedFood] as never)).toBe(false);

    const db = {
      food: {
        findMany: jest.fn().mockResolvedValue([food, changedFood]),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as never;

    await expect(consolidateFoods(db, [1, 2])).rejects.toBeInstanceOf(
      FoodConsolidationError
    );
  });
});
