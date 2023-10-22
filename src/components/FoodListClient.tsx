"use client";
import { useState } from "react";
import { Food } from "@prisma/client";
import FoodComp from "./foodList/FoodComp";
import { uppercaseFirst } from "@/lib/utils";
import { StorageType } from "@prisma/client";

interface FoodListClientProps {
  foods: Food[] | null;
}

function generateStorageState() {
  const storageFilters: Record<string, boolean> = {};
  for (const storage of Object.values(StorageType)) {
    storageFilters[storage] = true;
  }
  return storageFilters;
}

export default function FoodListClient({ foods }: FoodListClientProps) {
  const [searchText, setSearchText] = useState("");
  const [storageFilters, setStorageFilters] = useState(generateStorageState);

  const filteredFoods = (foods: Food[] | null) => {
    if (foods === null) return null;
    return foods
      .filter((food) =>
        food.name.toLowerCase().includes(searchText.toLowerCase()),
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

  const isChecked = (key: keyof typeof storageFilters) => {
    return storageFilters[key];
  };

  return (
    <div className="flex flex-col w-full items-center gap-2">
      <input
        type="text"
        placeholder="Search"
        className="input input-outline bg-gray-700 w-11/12 sm:w-3/4"
        onChange={(e) => setSearchText(e.target.value)}
      ></input>
      <div className="flex space-x-1">
        {Object.keys(storageFilters).map((key, idx) => (
          <div key={idx} className="form-control">
            <label
              className={`cursor-pointer label space-x-2 px-2 btn ${
                isChecked(key) ? "bg-color-1 hover:bg-cyan-600" : "bg-blue-850 hover:bg-slate-700"
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
      {sortedFoods(filteredFoods(foods))?.map((food: Food) => {
        return <FoodComp key={food.id} food={food} />;
      })}
    </div>
  );
}
