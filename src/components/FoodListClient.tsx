"use client";
import { useState } from "react";
import { Food } from "@prisma/client";
import FoodCard from "./foodList/FoodCard";
import { getCardHoverColor, uppercaseFirst } from "@/lib/utils";
import { StorageType } from "@prisma/client";
import { getCardBgColor } from "@/lib/utils";

interface FoodListClientProps {
  foods: Food[] | null;
}

interface StorageFiltersProps {
  storageFilters: Record<string, boolean>;
  setStorageFilters: CallableFunction;
}

function generateStorageState() {
  const storageFilters: Record<string, boolean> = {};
  for (const storage of Object.values(StorageType)) {
    storageFilters[storage] = true;
  }
  return storageFilters;
}

function StorageFilters({
  storageFilters,
  setStorageFilters,
}: StorageFiltersProps) {
  const isChecked = (key: keyof typeof storageFilters) => {
    return storageFilters[key];
  };

  return (
    <div className="flex space-x-1">
      {Object.keys(storageFilters).map((key, idx) => (
        <div key={idx} className="form-control">
          <label
            className={`cursor-pointer label space-x-2 px-2 btn ${
              isChecked(key)
                ? `${getCardBgColor(key)} ${getCardHoverColor(key)}`
                : "bg-blue-850 hover:bg-slate-700"
            }`}
          >
            <span className="label-text">{uppercaseFirst(key)}</span>
            <input
              type="checkbox"
              checked={isChecked(key)}
              className="hidden"
              onChange={(e) =>
                setStorageFilters({
                  ...storageFilters,
                  [key]: e.target.checked,
                })
              }
            />
          </label>
        </div>
      ))}
    </div>
  );
}

export default function FoodListClient({ foods }: FoodListClientProps) {
  const [searchText, setSearchText] = useState("");
  const [storageFilters, setStorageFilters] = useState(generateStorageState);

  const filteredFoods = (foods: Food[] | null) => {
    if (foods === null) return null;
    return foods
      .filter((food) =>
        food.name.toLowerCase().includes(searchText.toLowerCase())
      )
      .filter((food) => {
        if (food.storage === null) return false;
        return storageFilters[food.storage];
      });
  };

  const sortedFoods = (foods: Food[] | null) => {
    if (foods === null) return null;
    const sortedByExpiry = foods.sort((a, b) => {
      if (a.expiry === null || b.expiry === null) return 0;
      const aDate = Date.parse(a.expiry);
      const bDate = Date.parse(b.expiry);
      return aDate - bDate;
    });
    return sortedByExpiry;
  };

  return (
    <div className="flex flex-col w-full items-center gap-4">
      <div className="flex w-full justify-center gap-4">
        <input
          type="search"
          placeholder="Search"
          className="input input-outline bg-gray-700 max-w-[720px] min-w-[150px] w-1/2"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button className="btn" onClick={() => setSearchText("")}>
          Clear
        </button>
      </div>
      <StorageFilters
        storageFilters={storageFilters}
        setStorageFilters={setStorageFilters}
      />
      <div className="flex flex-wrap justify-center gap-4 w-11/12 lg:w-9/12 2xl:w-2/3 3xl:w-1/2">
        {sortedFoods(filteredFoods(foods))?.map((food: Food) => {
          return <FoodCard key={food.id} food={food} />;
        })}
      </div>
    </div>
  );
}
