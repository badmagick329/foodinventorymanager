import {
  canConsolidateFoods,
  findConsolidationGroups,
} from "../food-consolidation";

const food = {
  id: 1,
  name: "Milk",
  amount: 2,
  unit: "unit",
  expiry: "2026-08-20",
  storage: "fridge",
} as const;

describe("food consolidation grouping", () => {
  it("finds matching groups without combining different expiries", () => {
    const groups = findConsolidationGroups([
      food,
      { ...food, id: 2, amount: 1.5 },
      { ...food, id: 3, expiry: null },
      { ...food, id: 4, storage: "pantry" },
    ] as never);

    expect(groups).toHaveLength(1);
    expect(groups[0].foods.map((item) => item.id)).toEqual([1, 2]);
    expect(groups[0].totalAmount).toBe(3.5);
  });

  it.each([
    ["different expiry", { expiry: "2026-08-21" }],
    ["one missing expiry", { expiry: null }],
    ["different unit", { unit: "kg" }],
    ["different storage", { storage: "pantry" }],
    ["different name", { name: "Oat milk" }],
  ])("rejects %s", (_description, change) => {
    expect(
      canConsolidateFoods([food, { ...food, id: 2, ...change }] as never)
    ).toBe(false);
  });

  it("accepts different expiries only when explicitly allowed", () => {
    const foods = [food, { ...food, id: 2, expiry: null }] as never;

    expect(canConsolidateFoods(foods)).toBe(false);
    expect(canConsolidateFoods(foods, { allowDifferentExpiry: true })).toBe(
      true
    );
  });
});
