"use client";
import { useState } from "react";
import { Food } from "@prisma/client";
import { StorageType } from "@prisma/client";
import SearchBar from "./search-bar";
import StorageFilters from "./storage-filters";
import { StorageFiltersType } from "@/lib/types";
import FoodCards from "./food-cards";

export default function FoodList({ foods }: { foods: Food[] | null }) {
  const [searchText, setSearchText] = useState("");
  const [storageFilters, setStorageFilters] = useState(generateStorageState);

  return (
    <div className="flex flex-col w-full items-center gap-4">
      <SearchBar searchText={searchText} setSearchText={setSearchText} />
      <StorageFilters
        storageFilters={storageFilters}
        setStorageFilters={setStorageFilters}
      />
      <FoodCards
        foods={foods}
        searchText={searchText}
        storageFilters={storageFilters}
      />
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
