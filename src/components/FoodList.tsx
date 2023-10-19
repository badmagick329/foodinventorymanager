import { revalidatePath } from "next/cache";
import FoodComp from "./foodList/FoodComp";
import { getAllFoods } from "@/actions/serverActions";

export const dynamic = "auto",
  dynamicParams = true,
  revalidate = 0,
  fetchCache = "auto",
  runTime = "nodejs",
  preferredRegion = "auto";

export default async function FoodList() {
  console.log("About to fetch foods");
  const foods = await getAllFoods();
  console.log(`Foods fetched ${foods}`);
  if (!foods) {
    return <span className="text-2xl font-semibold">Loading...</span>;
  }
  return (
    <div className="flex flex-col w-full items-center gap-2">
      {foods?.map((food) => {
        return <FoodComp key={food.id} food={food} />;
      })}
    </div>
  );
}
