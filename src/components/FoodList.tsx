import FoodListClient from "./FoodListClient";
import { Food } from "@prisma/client";

// export const dynamic = "force-dynamic",
//   dynamicParams = true,
//   revalidate = 0,
//   fetchCache = "only-no-store",
//   runTime = "nodejs",
//   preferredRegion = "auto";

export default async function FoodList({
  baseUrl,
}: {
  baseUrl: string | undefined;
}) {
  let foods: Food[] | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/foods`, {
      method: "GET",
      cache: "no-store",
      next: {
        tags: ["foods"],
      },
    });
    foods = (await res.json()) as Food[];
  } catch (error) {
    console.log("Error fetching foods");
    console.log(error);
  }

  if (foods === null) {
    return <span className="text-4xl">Could not fetch data 😥</span>;
  }
  return <FoodListClient foods={foods} />;
}
