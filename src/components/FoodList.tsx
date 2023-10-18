import prisma from "../../prisma/client";
import { Food } from "@prisma/client";
import FoodComp from "./foodList/FoodComp";
import { revalidateTag } from "next/cache";
import { getAllFoods } from "@/actions/serverActions";

export const dynamic = "auto",
//   dynamicParams = true,
//   revalidate = 0,
//   fetchCache = "auto",
//   runTime = "nodejs",
  preferredRegion = "auto";

// async function getFoods() {
//   const resp = await fetch("http://localhost:3000/api/foods", {
//     method: "GET",
//     cache: "no-cache",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     next: {
//       tags: ["foods"],
//     },
//   });
//   if (!resp.ok) {
//     const data = await resp.json();
//     // TODO: alternative alert
//     alert(data.message);
//     return;
//   }
//   const foods = await resp.json();
//   revalidateTag("foods");
//   return foods as Food[];
// }

export default async function FoodList() {
  const foods = await getAllFoods();
  if (!foods) return <span className="text-2xl font-semibold">Loading...</span>;
  return <>{foods?.map((food) => <FoodComp key={food.id} food={food} />)}</>;
}
