import type { Food } from "@prisma/client";
import {
  actionFoodIds,
  addFoodContext,
  describeAction,
  isAssistantAction,
  type AssistantAction,
} from "../assistant";

const foods = [
  {
    id: 1,
    name: "Oatly Barista",
    amount: 2,
    unit: "unit",
    expiry: null,
    storage: "pantry",
  },
  {
    id: 2,
    name: "Old milk",
    amount: 1,
    unit: "unit",
    expiry: null,
    storage: "fridge",
  },
] as unknown as Food[];

const soup = {
  name: "Carrot and parsnip soup",
  amount: 1,
  unit: "unit",
  expiry: "2026-10-24",
  storage: "fridge",
};

describe("assistant change proposals", () => {
  it("accepts a proposal mixing creates, updates, deletes and transfers", () => {
    const action = {
      kind: "changes",
      items: [
        { kind: "create", food: soup },
        { kind: "create", food: { ...soup, name: "Gouda slices" } },
        { kind: "update", foodId: 2, changes: { amount: 3 } },
        {
          kind: "transfer",
          foodId: 1,
          amount: 1,
          targetStorage: "fridge",
          targetExpiry: null,
        },
      ],
    };

    expect(isAssistantAction(action)).toBe(true);
    expect(actionFoodIds(action as AssistantAction)).toEqual([2, 1]);
  });

  it("rejects empty proposals, repeated food IDs and invalid items", () => {
    expect(isAssistantAction({ kind: "changes", items: [] })).toBe(false);
    expect(
      isAssistantAction({
        kind: "changes",
        items: [
          { kind: "delete", foodId: 1, removalReason: "consumed" },
          { kind: "update", foodId: 1, changes: { amount: 1 } },
        ],
      })
    ).toBe(false);
    expect(
      isAssistantAction({
        kind: "changes",
        items: [{ kind: "update", foodId: 1, changes: { amount: 0 } }],
      })
    ).toBe(false);
    expect(
      isAssistantAction({
        kind: "changes",
        items: [{ kind: "create", food: { ...soup, unit: "slices" } }],
      })
    ).toBe(false);
    expect(
      isAssistantAction({
        kind: "changes",
        items: [
          { kind: "update", foodId: 1, changes: { expiry: "next tuesday" } },
        ],
      })
    ).toBe(false);
  });

  it("allows several creates, which have no food ID", () => {
    expect(
      isAssistantAction({
        kind: "changes",
        items: [
          { kind: "create", food: soup },
          { kind: "create", food: soup },
        ],
      })
    ).toBe(true);
  });

  it("snapshots names and previous values so a top-up reads from → to", () => {
    const action = addFoodContext(
      {
        kind: "changes",
        items: [{ kind: "update", foodId: 2, changes: { amount: 3 } }],
      },
      foods
    );

    expect(action).toEqual({
      kind: "changes",
      items: [
        {
          kind: "update",
          foodId: 2,
          changes: { amount: 3 },
          foodName: "Old milk",
          previous: { amount: 1 },
        },
      ],
    });
    expect(describeAction(action, foods)).toBe(
      "Update Old milk: amount 1 → 3."
    );
  });

  it("describes a cleared expiry as from → no expiry date", () => {
    expect(
      describeAction(
        {
          kind: "changes",
          items: [
            {
              kind: "update",
              foodId: 2,
              changes: { expiry: null },
              foodName: "Old milk",
              previous: { expiry: "2026-10-20" },
            },
          ],
        },
        foods
      )
    ).toBe("Update Old milk: expiry 2026-10-20 → no expiry date.");
  });

  it("describes every change in a multi-item proposal", () => {
    const description = describeAction(
      {
        kind: "changes",
        items: [
          { kind: "create", food: soup },
          { kind: "delete", foodId: 2, removalReason: "discarded" },
        ],
      } as AssistantAction,
      foods
    );

    expect(description).toContain("Apply 2 changes");
    expect(description).toContain("add 1 unit of Carrot and parsnip soup");
    expect(description).toContain("record Old milk as discarded");
  });

  // FDI-1: the review speaks the glossary's outcome names, not the enum's.
  it("names outcomes as used, discarded and a mistake", () => {
    const description = describeAction(
      {
        kind: "changes",
        items: [
          { kind: "delete", foodId: 1, removalReason: "consumed" },
          { kind: "delete", foodId: 2, removalReason: "accidental_entry" },
        ],
      } as AssistantAction,
      foods
    );

    expect(description).toContain("record Oatly Barista as used");
    expect(description).toContain("record Old milk as a mistake");
  });
});
