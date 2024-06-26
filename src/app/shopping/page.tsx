import { getShoppingItems } from "@/actions/serverActions";
import { ShoppingItem } from "@prisma/client";
import ShoppingList from "./_components/shopping-list";

export const dynamic = "force-dynamic";

export default async function Shopping() {
  let shoppingItems: ShoppingItem[] | null = null;
  shoppingItems = await getShoppingItems();

  if (shoppingItems === null) {
    return <span className="text-4xl">Could not fetch data 😥</span>;
  }
  return <ShoppingList shoppingItems={shoppingItems} />;
}
