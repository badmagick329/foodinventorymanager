import prisma from "../../prisma/client";
import { Food } from "@prisma/client";
import FoodRemove from "@/components/foodList/FoodRemove";
import FoodAmount from "@/components/foodList/FoodAmount";
import FoodUnit from "@/components/foodList/FoodUnit";
import FoodName from "@/components/foodList/FoodName";
import FoodComp from "./foodList/FoodComp";
import { Suspense } from "react";

export const dynamic = "auto",
  dynamicParams = true,
  revalidate = 0,
  fetchCache = "auto",
  runTime = "nodejs",
  preferredRegion = "auto";

async function getFoods() {
  const foods = await prisma.food.findMany({
    orderBy: [
      {
        id: "desc",
      },
      {
        name: "asc",
      },
    ],
  });
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
  const foods = await getFoods();
  return (
    <>
      <Suspense
        fallback={<span className="text-2xl font-semibold">Loading...</span>}
      >
        {foods.map((food) => (
          <FoodComp key={food.id} food={food} />
        ))}
      </Suspense>
    </>
  );
}

        // {foods.map((food) => (
        //   <FoodComp key={food.id} food={food} />
        // ))}

