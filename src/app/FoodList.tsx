"use client";
import { Food, MeasurementUnit } from "@prisma/client";
import FoodComp from "./FoodComp";
import { useState, useEffect } from "react";

export default function FoodList() {
  const [foods, setFoods] = useState<Food[]>([]);
  useEffect(() => {
    (async () => {
      const res = await fetch("http://localhost:3000/api/foods");
      const foods = await res.json();
      setFoods(foods);
    })();
  }, []);

  if (!foods) {
    return (
      <>
        <FoodComp
          food={{
            id: 0,
            name: "Loading...",
            amount: 0,
            unit: MeasurementUnit.G,
          }}
        />
      </>
    );
  }

  return (
    <>
      {foods.map((food: Food) => (
        <FoodComp key={food.id} food={food} />
      ))}
    </>
  );
}
