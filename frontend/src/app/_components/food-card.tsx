import { removeFood } from "@/actions/serverActions";
import RemoveButton from "@/components/remove-button";
import { getColorByStorage } from "@/lib/utils";
import { Food } from "@prisma/client";
import { useState } from "react";
import FoodValue from "./food-value";

interface FoodCardProps {
  food: Food;
}

export enum FoodValueType {
  name = "name",
  amount = "amount",
  unit = "unit",
  expiry = "expiry",
  storage = "storage",
}

export default function FoodCard({ food }: FoodCardProps) {
  const [formOpen, setFormOpen] = useState(false);
  const cardBgColor = getColorByStorage(food.storage);

  return (
    <div
      className={`flex flex-col w-80 rounded-lg bg-opacity-50 ${cardBgColor}`}
    >
      <div className="flex py-2">
        <FoodValue
          id={food.id}
          value={food.name}
          foodValueType={FoodValueType.name}
          formOpen={formOpen}
          setFormOpen={setFormOpen}
          storageType={food.storage}
        />
      </div>
      <div className="flex flex-col h-full justify-end">
        <div className="flex text-center border-y-2 border-opacity-50 border-slate-950 justify-center py-2">
          <FoodValue
            id={food.id}
            value={food.expiry ? food.expiry : ""}
            foodValueType={FoodValueType.expiry}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
            storageType={food.storage}
          />
        </div>
        <div className="flex gap-2 p-2">
          <FoodValue
            id={food.id}
            value={food.amount}
            foodValueType={FoodValueType.amount}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
            storageType={food.storage}
          />
          <FoodValue
            id={food.id}
            value={food.unit}
            foodValueType={FoodValueType.unit}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
            storageType={food.storage}
          />
        </div>
        <div className="flex justify-between p-2">
          <div className="flex items-center">
            <FoodValue
              id={food.id}
              value={food.storage}
              foodValueType={FoodValueType.storage}
              formOpen={formOpen}
              setFormOpen={setFormOpen}
              storageType={food.storage}
            />
          </div>
          <div>
            <RemoveButton id={food.id} removeCallback={removeFood} />
          </div>
        </div>
      </div>
    </div>
  );
}
