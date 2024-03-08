"use client";
import { useState, useEffect } from "react";
import { Food } from "@prisma/client";
import { StorageType } from "@prisma/client";
import SearchBar from "./search-bar";
import StorageFilters from "./storage-filters";
import { StorageFiltersType } from "@/lib/types";
import FoodCards from "./food-cards";
import useLocalStorage from "@/hooks/useLocalStorage";
import CatRunning from "../../../public/images/cat-running.gif";
import Image from "next/image";

export default function FoodList({ foods }: { foods: Food[] | null }) {
  const [searchText, setSearchText] = useState("");
  const [onClient, setOnClient] = useState(false);
  const [value, updateValue] = useLocalStorage(
    "storageFilters",
    generateStorageState()
  );

  useEffect(() => {
    setOnClient(true);
  }, []);

  if (!onClient) {
    return (
      <div className="flex flex-col h-full justify-center py-48">
        <Image
          src={CatRunning}
          alt="Cat running"
          width={200}
          height={200}
          unoptimized
          className="rounded-full"
        />
      </div>
    );
  }

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
