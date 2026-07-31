import type { Food } from "@prisma/client";
import { actionFoodIds, describeAction, isAssistantAction } from "../assistant";

const foods = [
  { id: 1, name: "Oatly Barista", amount: 2, unit: "unit", expiry: null, storage: "pantry" },
  { id: 2, name: "Old milk", amount: 1, unit: "unit", expiry: null, storage: "fridge" },
] as unknown as Food[];

describe("assistant batch actions", () => {
  it("accepts a mixed batch with unique food IDs", () => {
    expect(isAssistantAction({
      kind: "batch",
      actions: [
        { kind: "update", foodId: 1, changes: { expiry: "2026-12-12" } },
        { kind: "delete", foodId: 2 },
      ],
    })).toBe(true);
  });

  it("rejects empty, duplicate, and malformed batches", () => {
    expect(isAssistantAction({ kind: "batch", actions: [] })).toBe(false);
    expect(isAssistantAction({ kind: "batch", actions: [{ kind: "delete", foodId: 1 }, { kind: "delete", foodId: 1 }] })).toBe(false);
    expect(isAssistantAction({ kind: "batch", actions: [{ kind: "update", foodId: 1, changes: { amount: 0 } }] })).toBe(false);
  });

  it("describes every selected batch row", () => {
    expect(describeAction({
      kind: "batch",
      actions: [
        { kind: "update", foodId: 1, changes: { expiry: "2026-12-12" } },
        { kind: "delete", foodId: 2 },
      ],
    }, foods)).toContain("Oatly Barista");
  });

  it("keeps only the selected batch rows in the confirmation payload", () => {
    expect(actionFoodIds({ kind: "batch", actions: [{ kind: "delete", foodId: 2 }] })).toEqual([2]);
  });
});
