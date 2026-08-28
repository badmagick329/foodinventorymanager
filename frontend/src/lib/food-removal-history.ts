import { FoodRemovalReason, type FoodRemoval } from "@prisma/client";

export type FoodRemovalOutcomeFilter = FoodRemovalReason | "all";

export function filterFoodRemovals(
  removals: FoodRemoval[],
  search: string,
  outcome: FoodRemovalOutcomeFilter
) {
  const searchTerm = search.trim().toLowerCase();

  return removals.filter(
    (removal) =>
      (outcome === "all" || removal.reason === outcome) &&
      (!searchTerm || removal.name.toLowerCase().includes(searchTerm))
  );
}

export function removalAccentClass(reason: FoodRemovalReason) {
  if (reason === FoodRemovalReason.consumed) return "border-l-green-500";
  if (reason === FoodRemovalReason.discarded) return "border-l-red-500";
  return "border-l-sky-500";
}
