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

export default async function FoodList() {
  const foods = await getAllFoods();
  if (!foods) return <span className="text-2xl font-semibold">Loading...</span>;
  return (
    <div className="flex flex-col w-full items-center gap-2">
      {foods?.map((food) => {
        return <FoodComp key={food.id} food={food} />;
      })}
    </div>
  );
}
