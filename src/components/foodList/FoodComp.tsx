"use client";
import { Food } from "@prisma/client";
import FoodValue from "./FoodValue";
import { useState } from "react";
import RemoveButton from "../RemoveButton";
import { removeFood } from "@/actions/serverActions";

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
    <div className="flex flex-col w-80 border-2 rounded-lg border-color-0 bg-color-1 overflow-hidden">
      <div className="flex w-full text-center border-b-2 border-color-0 border-opacity-50 py-2">
        <FoodValue
          id={food.id}
          value={food.name}
          foodValueType={FoodValueType.name}
          formOpen={formOpen}
          setFormOpen={setFormOpen}
        />
      </div>
      <div className="flex w-full text-center justify-center border-b-2 border-color-0 border-opacity-50 py-2">
        <FoodValue
          id={food.id}
          value={food.expiry ? food.expiry : ""}
          foodValueType={FoodValueType.expiry}
          formOpen={formOpen}
          setFormOpen={setFormOpen}
        />
      </div>
      <div className="flex w-1/4 justify-start mt-2">
        <div className="flex w-1/4 min-w-fit pl-2">
          <FoodValue
            id={food.id}
            value={food.amount}
            foodValueType={FoodValueType.amount}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
          />
        </div>
        <div className="flex w-3/4 shrink min-w-fit pr-2">
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
          <RemoveButton id={food.id} removeCallback={removeFood} />
        </div>
      </div>
    </div>
  );
}
