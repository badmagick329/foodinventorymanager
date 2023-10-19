"use client";
import { Food } from "@prisma/client";
import FoodRemove from "./FoodRemove";
import FoodValue from "./FoodValue";
import { useState } from "react";

interface FoodCompProps {
  food: Food;
}

export enum FoodValueType {
  name = "name",
  amount = "amount",
  unit = "unit",
  expiry = "expiry",
  storage = "storage",
}

export default function FoodComp({ food }: FoodCompProps) {
  const [formOpen, setFormOpen] = useState(false);
  return (
    <div className="flex flex-col w-80 border-2 rounded-md bg-slate-900">
      <div className="flex w-full text-center border-b-2 border-blue-950 border-opacity-50 py-2">
        <FoodValue
          id={food.id}
          value={food.name}
          foodValueType={FoodValueType.name}
          formOpen={formOpen}
          setFormOpen={setFormOpen}
        />
      </div>
      <div className="flex w-full text-center justify-center border-b-2 border-blue-950 border-opacity-50 py-2">
        <FoodValue
          id={food.id}
          value={food.expiry ? food.expiry : ""}
          foodValueType={FoodValueType.expiry}
          formOpen={formOpen}
          setFormOpen={setFormOpen}
        />
      </div>
      <div className="flex w-full justify-start mt-2">
        <div className="flex w-1/4 min-w-fit pl-2">
          <FoodValue
            id={food.id}
            value={food.amount}
            foodValueType={FoodValueType.amount}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
          />
        </div>
        <div className="flex w-3/4 flex-shrink min-w-fit pr-2">
          <FoodValue
            id={food.id}
            value={food.unit}
            foodValueType={FoodValueType.unit}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
          />
        </div>
      </div>
      <div className="flex w-full mt-2">
        <div className="flex w-1/2 items-center pl-2">
          <FoodValue
            id={food.id}
            value={food.storage}
            foodValueType={FoodValueType.storage}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
          />
        </div>
        <div className="flex w-1/2 pr-2">
          <FoodRemove id={food.id} />
        </div>
      </div>
    </div>
  );
}
