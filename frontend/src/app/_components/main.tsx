"use client";
import FoodTable from "@/app/_components/food-table";
import SearchBar from "@/app/_components/search-bar";
import StorageFilter from "@/app/_components/storage-filter";
import { SearchFilter } from "@/lib/types";
import { Food } from "@prisma/client";
import { useEffect, useState } from "react";

export default function Main({ foods }: { foods: Food[] }) {
  const [filteredFoods, setFilteredFoods] = useState(foods);
  const [filter, setFilter] = useState<SearchFilter>({});
  useEffect(
    () => setFilteredFoods(getNewFilteredFoods(foods, filter)),
    [filter, foods]
  );

  return (
    <div className="flex w-full max-w-6xl flex-col items-center px-2">
      <div className="sticky top-0 z-10 flex w-full flex-col gap-2 bg-background py-4">
        <StorageFilter setFilter={setFilter} />
        <SearchBar setFilter={setFilter} />
      </div>
      <FoodTable foods={filteredFoods} />
    </div>
  );
}

function getNewFilteredFoods(foods: Food[], filter: SearchFilter): Food[] {
  return foods.filter((f) => {
    let matches = true;
    const filterText = filter.text?.trim().toLowerCase();
    if (filterText) {
      matches = matches && f.name.toLowerCase().includes(filterText);
    }
    if (!matches) return false;

    if (filter.storageTypes && filter.storageTypes.length > 0) {
      matches = matches && filter.storageTypes.includes(f.storage);
    }
    return matches;
  });
}
