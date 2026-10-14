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

// The enum keeps its original names; the UI speaks the glossary's words.
const outcomeLabels: Record<FoodRemovalReason, string> = {
  consumed: "Used",
  discarded: "Discarded",
  accidental_entry: "Mistake",
};

const outcomePhrases: Record<FoodRemovalReason, string> = {
  consumed: "used",
  discarded: "discarded",
  accidental_entry: "a mistake",
};

export function outcomeLabel(reason: FoodRemovalReason) {
  return outcomeLabels[reason];
}

/** The outcome as it reads after "record X as …". */
export function outcomePhrase(reason: FoodRemovalReason) {
  return outcomePhrases[reason];
}

export function removalAccentClass(reason: FoodRemovalReason) {
  if (reason === FoodRemovalReason.consumed) return "border-l-green-500";
  if (reason === FoodRemovalReason.discarded) return "border-l-red-500";
  return "border-l-sky-500";
}
