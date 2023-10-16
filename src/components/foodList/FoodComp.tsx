import { Food } from "@prisma/client";
import FoodName from "./FoodName";
import FoodAmount from "./FoodAmount";
import FoodUnit from "./FoodUnit";
import FoodRemove from "./FoodRemove";

interface FoodUnitProps {
  food: Food;
}

export default function FoodComp({ food }: FoodUnitProps) {
  return (
    <div className="flex flex-col w-3/4 p-2 sm:w-1/2 lg:w-1/2 border-2 rounded-lg mb-4">
      <div className="flex flex-row justify-between w-full gap-2">
        <FoodName id={food.id} name={food.name} />
        <div className="flex gap-1">
          <FoodAmount id={food.id} amount={food.amount} />
          <FoodUnit id={food.id} unit={food.unit} />
        </div>
      </div>
      <div className="flex flex-row justify-between w-full gap-2">
        {food.expiry ? (
          <span className="text-xl">{food.expiry}</span>
        ) : (
          <span className="text-xl text-gray-700">No Expiry</span>
        )}
        <div className="flex gap-2">
          <span className="text-xl">{food.storage}</span>
          <FoodRemove id={food.id} />
        </div>
      </div>
    </div>
  );
}
