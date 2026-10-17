import { NotFoundError } from "@/server/errors";
import { undoFoodRemovalInTransaction } from "../removals";

jest.mock("@/server/db", () => ({ __esModule: true, default: {} }));

const removal = {
  id: "entry-1",
  foodId: 7,
  name: "Milk",
  amount: 0.5,
  unit: "l",
  expiry: "2026-10-20",
  storage: "fridge",
  reason: "consumed",
  source: "manual",
  createdAt: new Date("2026-10-17T10:00:00Z"),
};

function fakeDb({
  entry = removal as typeof removal | null,
  deletedCount = 1,
  food = null as Record<string, unknown> | null,
} = {}) {
  return {
    foodRemoval: {
      findUnique: jest.fn().mockResolvedValue(entry),
      deleteMany: jest.fn().mockResolvedValue({ count: deletedCount }),
    },
    food: {
      findUnique: jest.fn().mockResolvedValue(food),
      update: jest.fn().mockResolvedValue({ id: 7 }),
      create: jest.fn().mockResolvedValue({ id: 8 }),
    },
  };
}

describe("undoFoodRemovalInTransaction", () => {
  it("adds a partial use back onto the original food", async () => {
    const db = fakeDb({ food: { id: 7, unit: "l", amount: 1.5 } });

    await undoFoodRemovalInTransaction(db as never, "entry-1");

    expect(db.food.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { amount: { increment: 0.5 } },
    });
    expect(db.food.create).not.toHaveBeenCalled();
    expect(db.foodRemoval.deleteMany).toHaveBeenCalledWith({
      where: { id: "entry-1" },
    });
  });

  it("recreates a removed food from the entry's snapshot", async () => {
    const db = fakeDb({ food: null });

    await undoFoodRemovalInTransaction(db as never, "entry-1");

    expect(db.food.create).toHaveBeenCalledWith({
      data: {
        name: "Milk",
        amount: 0.5,
        unit: "l",
        expiry: "2026-10-20",
        storage: "fridge",
      },
    });
    expect(db.food.update).not.toHaveBeenCalled();
  });

  it("creates a new food when the original now uses another unit", async () => {
    const db = fakeDb({ food: { id: 7, unit: "ml", amount: 500 } });

    await undoFoodRemovalInTransaction(db as never, "entry-1");

    expect(db.food.create).toHaveBeenCalled();
    expect(db.food.update).not.toHaveBeenCalled();
  });

  it("restores nothing when the entry is already gone", async () => {
    const db = fakeDb({ deletedCount: 0 });

    await expect(
      undoFoodRemovalInTransaction(db as never, "entry-1")
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(db.food.update).not.toHaveBeenCalled();
    expect(db.food.create).not.toHaveBeenCalled();
  });
});
