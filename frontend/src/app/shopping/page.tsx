"use client";
import { ShoppingItem } from "@prisma/client";
import ShoppingList from "./_components/shopping-list";
import { useQuery } from "@tanstack/react-query";
import { API_SHOPPING_URL } from "@/lib/urls";
import LoadingCat from "@/components/loading-cat";
import ErrorBlock from "@/app/_components/error-block";
import { apiFetch, queryKeys } from "@/lib/api-client";

export default function Shopping() {
  const { data, error, isPending } = useQuery({
    queryKey: queryKeys.shopping,
    queryFn: () => apiFetch<ShoppingItem[]>(API_SHOPPING_URL),
  });

  if (isPending) return <LoadingCat />;
  if (error) return <ErrorBlock error={error} />;
  return <ShoppingList shoppingItems={data} />;
}
