import type { Food } from "@prisma/client";
import { actionFoodIds, describeAction, isAssistantAction } from "../assistant";

const foods = [
  { id: 1, name: "Oatly Barista", amount: 2, unit: "unit", expiry: null, storage: "pantry" },
  { id: 2, name: "Old milk", amount: 1, unit: "unit", expiry: null, storage: "fridge" },
] as unknown as Food[];

describe("assistant batch actions", () => {
  it("accepts a fully specified food creation", () => {
    expect(isAssistantAction({
      kind: "create",
      food: { name: "Tinned tomatoes", amount: 2, unit: "unit", expiry: null, storage: "pantry" },
    })).toBe(true);
    expect(isAssistantAction({
      kind: "create",
      food: { name: "Tinned tomatoes", amount: 2, unit: "unit", expiry: null },
    })).toBe(false);
  });

  it("accepts a mixed batch with unique food IDs", () => {
    expect(isAssistantAction({
      kind: "batch",
      actions: [
        { kind: "update", foodId: 1, changes: { expiry: "2026-12-12" } },
        { kind: "delete", foodId: 2, removalReason: "discarded" },
      ],
    })).toBe(true);
  });

  it("rejects empty, duplicate, and malformed batches", () => {
    expect(isAssistantAction({ kind: "batch", actions: [] })).toBe(false);
    expect(isAssistantAction({ kind: "batch", actions: [{ kind: "delete", foodId: 1, removalReason: "consumed" }, { kind: "delete", foodId: 1, removalReason: "consumed" }] })).toBe(false);
    expect(isAssistantAction({ kind: "batch", actions: [{ kind: "update", foodId: 1, changes: { amount: 0 } }] })).toBe(false);
  });

  it("describes every selected batch row", () => {
    expect(describeAction({
      kind: "batch",
      actions: [
        { kind: "update", foodId: 1, changes: { expiry: "2026-12-12" } },
        { kind: "delete", foodId: 2, removalReason: "discarded" },
      ],
    }, foods)).toContain("Oatly Barista");
  });

  it("keeps only the selected batch rows in the confirmation payload", () => {
    expect(actionFoodIds({ kind: "batch", actions: [{ kind: "delete", foodId: 2, removalReason: "consumed" }] })).toEqual([2]);
  });
});
