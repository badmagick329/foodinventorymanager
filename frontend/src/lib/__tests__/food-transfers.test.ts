import { FoodTransferError, transferFoodAmount } from "../food-transfers";

const food = {
  id: 1,
  name: "Milk",
  amount: 3,
  unit: "unit",
  expiry: "2026-08-20",
  storage: "pantry",
};

describe("partial food transfers", () => {
  it("updates the source and creates the moved portion", async () => {
    const update = jest.fn().mockResolvedValue({ ...food, amount: 2.5 });
    const create = jest.fn().mockResolvedValue({
      ...food,
      id: 2,
      amount: 0.5,
      expiry: "2026-08-18",
      storage: "fridge",
    });
    const db = {
      food: {
        findUnique: jest.fn().mockResolvedValue(food),
        update,
        create,
      },
    } as never;

    const result = await transferFoodAmount(db, 1, {
      amount: 0.5,
      storage: "fridge",
      expiry: "2026-08-18",
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { amount: 2.5 },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: "Milk",
        amount: 0.5,
        unit: "unit",
        expiry: "2026-08-18",
        storage: "fridge",
      },
    });
    expect(result?.movedFood.id).toBe(2);
  });

  it("rejects a same-storage or whole-item transfer", async () => {
    const db = {
      food: {
        findUnique: jest.fn().mockResolvedValue(food),
        update: jest.fn(),
        create: jest.fn(),
      },
    } as never;

    await expect(
      transferFoodAmount(db, 1, {
        amount: 0.5,
        storage: "pantry",
        expiry: null,
      })
    ).rejects.toBeInstanceOf(FoodTransferError);
    await expect(
      transferFoodAmount(db, 1, { amount: 3, storage: "fridge", expiry: null })
    ).rejects.toBeInstanceOf(FoodTransferError);
  });
});
