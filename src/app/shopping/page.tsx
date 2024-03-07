import { ShoppingItem } from "@prisma/client";
import ShoppingList from "./_components/shopping-list";

export default async function Shopping() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  let shoppingItems: ShoppingItem[] | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/shoppingitems`, {
      method: "GET",
      cache: "no-store",
      next: {
        tags: ["shoppingitem"],
      },
    });
    shoppingItems = (await res.json()) as ShoppingItem[];
  } catch (error) {
    console.log("Error fetching foods");
    console.log(error);
  }

  if (shoppingItems === null) {
    return <span className="text-4xl">Could not fetch data 😥</span>;
  }
  return <ShoppingList shoppingItems={shoppingItems} />;
}
