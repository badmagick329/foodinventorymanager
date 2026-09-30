"use client";
import Main from "@/app/_components/main";
import LoadingCat from "@/components/loading-cat";
import { Food } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { API_FOODS_URL } from "@/lib/urls";
import ErrorBlock from "@/app/_components/error-block";
import { apiFetch, queryKeys } from "@/lib/api-client";

export default function Home() {
  const { data, error, isPending } = useQuery({
    queryKey: queryKeys.foods,
    queryFn: () => apiFetch<Food[]>(API_FOODS_URL),
  });

  if (isPending) return <LoadingCat />;
  if (error) return <ErrorBlock error={error} />;
  return <Main foods={data} />;
}
