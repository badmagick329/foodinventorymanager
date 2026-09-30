"use client";

import ModifyFoodForm from "@/app/food/[id]/_components/modify-food-form";
import { Food } from "@prisma/client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_FOODS_URL } from "@/lib/urls";
import ErrorBlock from "@/app/_components/error-block";
import { apiFetch, queryKeys } from "@/lib/api-client";

export default function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, error, isPending } = useQuery({
    queryKey: queryKeys.food(id),
    queryFn: () => apiFetch<Food>(`${API_FOODS_URL}${id}/`),
  });

  if (isPending) return <p>Loading...</p>;
  if (error) return <ErrorBlock error={error} />;

  return (
    <div className="flex w-full max-w-4xl grow flex-col items-center px-2">
      <ModifyFoodForm food={data} />
    </div>
  );
}
