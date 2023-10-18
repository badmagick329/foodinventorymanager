import { Food } from "@prisma/client";
import FoodName from "./FoodName";
import FoodAmount from "./FoodAmount";
import FoodUnit from "./FoodUnit";
import FoodRemove from "./FoodRemove";
import FoodValue from "./FoodValue";

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
  return (
    <div className="flex flex-col w-full p-2 sm:w-1/2 lg:w-1/2 border-2 rounded-lg mb-4">
      <div className="flex gap-2 w-full">
        <div className="flex w-1/2">
          <FoodName id={food.id} name={food.name} />
        </div>
        <div className="flex w-1/2 self-end space-x-2">
          <FoodValue
            id={food.id}
            value={food.amount}
            foodValueType={FoodValueType.amount}
          />
          <FoodUnit id={food.id} unit={food.unit} />
        </div>
      </div>
      <div className="flex gap-2 w-full">
        <div className="w-1/2">
          {food.expiry ? (
            <span className="text-xl">{food.expiry}</span>
          ) : (
            <span className="text-xl text-gray-700">No Expiry</span>
          )}
        </div>
        <div className="flex w-1/2 self-end space-x-2">
          <span className="text-xl">{food.storage}</span>
          <FoodRemove id={food.id} />
        </div>
      </div>
    </div>
  );
}
