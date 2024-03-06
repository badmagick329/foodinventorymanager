import FoodList from "@/app/_components/food-list";
import { Food } from "@prisma/client";

export default async function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
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
  return <FoodList foods={foods} />;
}
