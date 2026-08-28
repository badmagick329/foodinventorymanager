import type { FoodRemoval } from "@prisma/client";
import {
  filterFoodRemovals,
  removalAccentClass,
} from "../food-removal-history";

const removals = [
  { id: "1", name: "Oat milk", reason: "consumed" },
  { id: "2", name: "Old milk", reason: "discarded" },
  { id: "3", name: "Bread", reason: "accidental_entry" },
] as FoodRemoval[];

describe("food removal history filters", () => {
  it("filters by outcome", () => {
    expect(
      filterFoodRemovals(removals, "", "discarded").map(({ id }) => id)
    ).toEqual(["2"]);
  });

  it("searches item names without case sensitivity", () => {
    expect(
      filterFoodRemovals(removals, "MILK", "all").map(({ id }) => id)
    ).toEqual(["1", "2"]);
  });

  it("uses a distinct accent for every outcome", () => {
    expect(removalAccentClass("consumed")).toBe("border-l-green-500");
    expect(removalAccentClass("discarded")).toBe("border-l-red-500");
    expect(removalAccentClass("accidental_entry")).toBe("border-l-sky-500");
  });
});
