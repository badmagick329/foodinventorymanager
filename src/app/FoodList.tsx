import prisma from "../../prisma/client";
import { Food, MeasurementUnit } from "@prisma/client";

export const dynamic = "auto",
  dynamicParams = true,
  revalidate = 1,
  fetchCache = "auto",
  runTime = "nodejs",
  preferredRegion = "auto";

async function getFoods() {
  const foods = await prisma.food.findMany();
  return foods as Food[];
}

export default async function FoodList() {
  let foods = null;
  foods = await getFoods();
  if (!foods) {
    return (
      <>
        <tr className="hover:bg-slate-900" key="...">
          <td>Loading</td>
          <td>...</td>
          <td>...</td>
          <td className="flex space-x-2">
            <button className="btn btn-outline btn-info">Edit</button>
            <button className="btn btn-outline btn-info">Delete</button>
          </td>
        </tr>
      </>
    );
  }
  return (
    <>
      {foods.map((food: Food) => (
        <tr className="hover:bg-slate-900" key={food.id}>
          <td>{food.name}</td>
          <td>{food.amount}</td>
          <td>{food.unit}</td>
          <td className="flex space-x-2">
            <button className="btn btn-outline btn-info">Edit</button>
            <button className="btn btn-outline btn-error">Delete</button>
          </td>
        </tr>
      ))}
    </>
  );
}
