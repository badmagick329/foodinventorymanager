import { StorageFiltersType } from "@/lib/types";
import { Food } from "@prisma/client";
import FoodCard from "./food-card";

type FoodCardsProps = {
  foods: Food[] | null;
  searchText: string;
  storageFilters: StorageFiltersType;
};

export default function FoodCards({
  foods,
  searchText,
  storageFilters,
}: FoodCardsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 w-11/12 lg:w-9/12 2xl:w-2/3 3xl:w-1/2">
      {sortedFoods(filteredFoods(foods, searchText, storageFilters))?.map(
        (food: Food) => {
          return <FoodCard key={food.id} food={food} />;
        }
      )}
    </div>
  );
}

function filteredFoods(
  foods: Food[] | null,
  searchText: string,
  storageFilters: Record<string, boolean>
) {
  if (foods === null) {
    return null;
  }

  return foods
    .filter((food) =>
      food.name.toLowerCase().includes(searchText.toLowerCase())
    )
    .filter((food) => {
      if (food.storage === null) return false;
      return storageFilters[food.storage];
    });
}

function sortedFoods(foods: Food[] | null) {
  if (foods === null) {
    return null;
  }

  const sortedByExpiry = foods.sort((a, b) => {
    if (a.expiry === null || b.expiry === null) return 0;
    const aDate = Date.parse(a.expiry);
    const bDate = Date.parse(b.expiry);
    return aDate - bDate;
  });
  return sortedByExpiry;
}
