"use client";

import ErrorBlock from "@/app/_components/error-block";
import RemovalHistory from "@/app/history/_components/removal-history";
import LoadingCat from "@/components/loading-cat";
import { useQuery } from "@tanstack/react-query";
import type { FoodRemoval } from "@prisma/client";

export default function HistoryPage() {
  const { data, error, isPending } = useQuery({
    queryKey: ["food-removals"],
    queryFn: async () => {
      const response = await fetch("/api/food-removals");
      if (!response.ok) throw new Error("Could not load removal history.");
      return response.json() as Promise<FoodRemoval[]>;
    },
  });

  if (isPending) return <LoadingCat />;
  if (error) return <ErrorBlock error={error} />;
  return <RemovalHistory removals={data} />;
}
