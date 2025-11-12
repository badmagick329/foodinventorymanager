"use client";
import { ShoppingItem } from "@prisma/client";
import ShoppingList from "./_components/shopping-list";
import { useQuery } from "@tanstack/react-query";
import { API_SHOPPING_URL } from "@/lib/urls";
import LoadingCat from "@/components/loading-cat";
import ErrorBlock from "@/app/_components/error-block";

export default function Shopping() {
  const {
    data: shoppingItems,
    error,
    isPending,
  } = useQuery({
    queryKey: ["shopping"],
    queryFn: async () => {
      const res = await fetch(API_SHOPPING_URL, { method: "GET" });
      const json = await res.json();
      console.log("got shopping items:");
      console.log(json);
      return json as ShoppingItem[];
    },
  });
  if (isPending) {
    return <LoadingCat />;
  }

  if (error) {
    return <ErrorBlock error={error} />;
  }

  return <ShoppingList shoppingItems={shoppingItems} />;
}
