"use client";
import FoodTable from "@/app/_components/food-table";
import SearchBar from "@/app/_components/search-bar";
import StorageFilter from "@/app/_components/storage-filter";
import useScrollY from "@/hooks/useScrollY";
import { SearchFilter } from "@/lib/types";
import { Food } from "@prisma/client";
import { useEffect, useState } from "react";

export default function Main({ foods }: { foods: Food[] }) {
  const [filteredFoods, setFilteredFoods] = useState(foods);
  const [filter, setFilter] = useState<SearchFilter>({});
  const [headerMessage, setHeaderMessage] = useState("");
  const { getY: foodListY } = useScrollY("foodListY");

  useEffect(
    () => setFilteredFoods(getNewFilteredFoods(foods, filter)),
    [filter, foods]
  );
  useEffect(() => {
    setHeaderMessage(createHeaderMessage(foods.length, filteredFoods.length));
  }, [filteredFoods.length, foods.length]);
  useEffect(() => {
    const y = foodListY();
    if (!isNaN(y) && y > 0) {
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [foodListY]);

  if (foods.length === 0) {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <h1 className="text-center text-3xl">No food items entered yet.</h1>
        <p>Try importing a receipt or adding food items manually.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-6xl flex-col items-center px-2">
      <h1 className="w-full text-center text-3xl font-semibold">
        {headerMessage}
      </h1>
      <div className="sticky top-20 z-10 flex w-full flex-col gap-2 bg-background py-4">
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

function randomFoodEmoji(): string {
  const foodEmojis = [
    "🍎",
    "🍌",
    "🍇",
    "🍕",
    "🍔",
    "🍣",
    "🍩",
    "🥗",
    "🌮",
    "🍜",
  ];
  return foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
}

function randomNoItemsMessage(): string {
  const messages = [
    "Nothing here. Did the snacks go on strike? 🍪✊",
    "Zero results. The pantry must be on vacation. 🏖️",
    "No items found. Maybe the food ran away with the spoon. 🥄💨",
    "Nothing matches. Time to embrace the art of imaginary cooking. 🎨🍳",
    "No items found. The shelves are as empty as your Monday motivation. 😴",
    "Zero results. The snacks are playing hide and seek. 🍫🤫",
    "No items found. The grocery list is crying in the corner. 📝😭",
    "Nothing matches. Maybe it's time to order pizza. 🍕📞",
    "No items found. The fridge is practicing social distancing. 🧊↔️",
    "Nothing here. The food must have joined a secret club. 🤐",
    "No items found. The snacks have left the chat. 💬🚪",
    "No items found. The shelves are fasting. 🛐",
    "No items found. The pantry is writing a memoir: 'Life Without Snacks'. 📖",
    "No items found. The snacks are on a world tour. 🌍",
    "Nothing here. The pantry is dreaming of better days. 💭",
    "Zero results. The fridge is meditating on emptiness. 🧘",
    "No items found. The shelves are enjoying their minimalist aesthetic. 🖼️",
    "Nothing matches. The food is undercover. 🕵️",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function createHeaderMessage(totalFoods: number, filteredFoods: number) {
  if (totalFoods === 0) {
    return "No food items entered yet.";
  }
  if (filteredFoods === 0) {
    return randomNoItemsMessage();
  }

  if (totalFoods === filteredFoods) {
    return `${filteredFoods} Item${filteredFoods !== 1 ? "s" : ""} in stock ${randomFoodEmoji()}`;
  }

  if (totalFoods > filteredFoods) {
    return `Displaying ${filteredFoods} of ${totalFoods} Item${totalFoods !== 1 ? "s" : ""} in stock ${randomFoodEmoji()}`;
  }

  return "";
}
