import prisma from "../../prisma/client";
import { Food, MeasurementUnit } from "@prisma/client";
import FoodRemove from "./FoodRemove";

export const dynamic = "auto",
  dynamicParams = true,
  revalidate = 0,
  fetchCache = "auto",
  runTime = "nodejs",
  preferredRegion = "auto";

async function getFoods() {
  const foods = await prisma.food.findMany();
  return foods as Food[];
}

// async function getFoods() {
//   const resp = await fetch("http://localhost:3000/api/foods", {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     cache: "no-cache",
//   });
//   const foods = await resp.json();
//   return foods as Food[];
// }

export default async function FoodList() {
  let foods = null;
  foods = await getFoods();
  if (!foods) {
    return (
      <>
        <h1 className="text-3xl text-white">Loading...</h1>
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
            <FoodRemove id={food.id} />
          </td>
        </tr>
      ))}
    </>
  );
}
