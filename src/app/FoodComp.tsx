import { Food } from "@prisma/client";

interface FoodProps {
  food: Food;
}

export default function FoodComp({ food }: FoodProps) {
  return (
    <tr className="hover:bg-slate-900" key={food.id}>
      <td>{food.name}</td>
      <td>{food.amount}</td>
      <td>{food.unit}</td>
      <td className="flex space-x-2">
        <button className="btn btn-outline btn-info">Edit</button>
        <button className="btn btn-outline btn-info">Delete</button>
      </td>
    </tr>
  );
}
