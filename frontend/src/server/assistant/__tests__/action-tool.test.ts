import type { Food } from "@prisma/client";
import { parseProposedAction } from "../action-tool";

const foods = [
  {
    id: 7,
    name: "Milk",
    amount: 1,
    unit: "unit",
    expiry: null,
    storage: "fridge",
  },
  {
    id: 8,
    name: "Honey",
    amount: 1,
    unit: "unit",
    expiry: "2026-10-20",
    storage: "pantry",
  },
] as unknown as Food[];

const empty = {
  foodId: null,
  newFood: null,
  changes: {
    name: null,
    amount: null,
    unit: null,
    expiry: null,
    storage: null,
  },
  removalReason: null,
  amount: null,
  targetStorage: null,
  targetExpiry: null,
  clearExpiry: false,
};

function toolCall(items: object[]) {
  return JSON.stringify({
    message: " Added to your existing milk. ",
    kind: "changes",
    items,
    foodIds: [],
    primaryFoodId: null,
  });
}

describe("parseProposedAction", () => {
  // FDI-6: a dictated list must become one proposal with every item.
  it("keeps every item of a dictated multi-item request", () => {
    const { action, message } = parseProposedAction(
      toolCall([
        {
          ...empty,
          kind: "update",
          foodId: 7,
          changes: { ...empty.changes, amount: 3 },
        },
        {
          ...empty,
          kind: "create",
          newFood: {
            name: "Black pepper cheese slices",
            amount: 6,
            unit: "unit",
            expiry: "2026-11-03",
            storage: "fridge",
          },
        },
        {
          ...empty,
          kind: "create",
          newFood: {
            name: "Carrot and parsnip soup",
            amount: 1,
            unit: "unit",
            expiry: "2026-10-24",
            storage: "fridge",
          },
        },
      ]),
      foods
    );

    expect(message).toBe("Added to your existing milk.");
    expect(action).toEqual({
      kind: "changes",
      items: [
        {
          kind: "update",
          foodId: 7,
          changes: { amount: 3 },
          foodName: "Milk",
          previous: { amount: 1 },
        },
        {
          kind: "create",
          food: {
            name: "Black pepper cheese slices",
            amount: 6,
            unit: "unit",
            expiry: "2026-11-03",
            storage: "fridge",
          },
        },
        {
          kind: "create",
          food: {
            name: "Carrot and parsnip soup",
            amount: 1,
            unit: "unit",
            expiry: "2026-10-24",
            storage: "fridge",
          },
        },
      ],
    });
  });

  it("drops an invalid item but keeps the rest and names what was dropped", () => {
    const { action, message } = parseProposedAction(
      toolCall([
        // A delete without an outcome is invalid.
        { ...empty, kind: "delete", foodId: 7 },
        {
          ...empty,
          kind: "create",
          newFood: {
            name: "Soup",
            amount: 1,
            unit: "unit",
            expiry: "in 10 days",
            storage: "fridge",
          },
        },
        {
          ...empty,
          kind: "create",
          newFood: {
            name: "Gouda slices",
            amount: 6,
            unit: "unit",
            expiry: null,
            storage: "fridge",
          },
        },
      ]),
      foods
    );

    expect(action).toEqual({
      kind: "changes",
      items: [
        {
          kind: "create",
          food: {
            name: "Gouda slices",
            amount: 6,
            unit: "unit",
            expiry: null,
            storage: "fridge",
          },
        },
      ],
    });
    expect(message).toContain("I couldn't turn Milk, Soup into a valid change");
  });

  // A null in changes means "unchanged", so only clearExpiry can remove a date.
  it("removes an expiry date only when clearExpiry is set", () => {
    const cleared = parseProposedAction(
      toolCall([{ ...empty, kind: "update", foodId: 8, clearExpiry: true }]),
      foods
    );
    expect(cleared.action).toEqual({
      kind: "changes",
      items: [
        {
          kind: "update",
          foodId: 8,
          changes: { expiry: null },
          foodName: "Honey",
          previous: { expiry: "2026-10-20" },
        },
      ],
    });

    const amountOnly = parseProposedAction(
      toolCall([
        {
          ...empty,
          kind: "update",
          foodId: 8,
          changes: { ...empty.changes, amount: 2 },
        },
      ]),
      foods
    );
    expect(amountOnly.action).toMatchObject({
      items: [{ changes: { amount: 2 } }],
    });
    expect(
      (amountOnly.action as { items: Array<{ changes: object }> }).items[0]
        .changes
    ).not.toHaveProperty("expiry");
  });

  it("proposes nothing when every item is invalid", () => {
    const { action } = parseProposedAction(
      toolCall([{ ...empty, kind: "delete", foodId: 7 }]),
      foods
    );

    expect(action).toEqual({ kind: "none" });
  });
});
