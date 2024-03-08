"use client";
import { useState } from "react";
import { Food } from "@prisma/client";
import { StorageType } from "@prisma/client";
import SearchBar from "./search-bar";
import StorageFilters from "./storage-filters";
import { StorageFiltersType } from "@/lib/types";
import FoodCards from "./food-cards";
import useLocalStorage from "@/hooks/useLocalStorage";

export default function FoodList({ foods }: { foods: Food[] | null }) {
  const [searchText, setSearchText] = useState("");
  const [value, updateValue] = useLocalStorage(
    "storageFilters",
    generateStorageState()
  );

  return (
    <div className="flex flex-col w-full items-center gap-4">
      <SearchBar searchText={searchText} setSearchText={setSearchText} />
      <StorageFilters storageFilters={value} setStorageFilters={updateValue} />
      <FoodCards foods={foods} searchText={searchText} storageFilters={value} />
    </div>
  );
}

function generateStorageState() {
  const storageFilters: StorageFiltersType = {};
  for (const storage of Object.values(StorageType)) {
    storageFilters[storage] = true;
  }
  return storageFilters;
}
