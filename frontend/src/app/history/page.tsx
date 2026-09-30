"use client";

import ErrorBlock from "@/app/_components/error-block";
import RemovalHistory from "@/app/history/_components/removal-history";
import LoadingCat from "@/components/loading-cat";
import { useQuery } from "@tanstack/react-query";
import type { FoodRemoval } from "@prisma/client";
import { apiFetch, queryKeys } from "@/lib/api-client";
import { API_FOOD_REMOVALS_URL } from "@/lib/urls";

export default function HistoryPage() {
  const { data, error, isPending } = useQuery({
    queryKey: queryKeys.foodRemovals,
    queryFn: () => apiFetch<FoodRemoval[]>(API_FOOD_REMOVALS_URL),
  });

  if (isPending) return <LoadingCat />;
  if (error) return <ErrorBlock error={error} />;
  return <RemovalHistory removals={data} />;
}
