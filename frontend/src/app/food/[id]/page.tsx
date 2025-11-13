"use client";

import ModifyFoodForm from "@/app/food/[id]/_components/modify-food-form";
import { Food } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { API_FOODS_URL } from "@/lib/urls";
import ErrorBlock from "@/app/_components/error-block";

export default function EditPage({ params }: { params: { id: string } }) {
  const {
    data: food,
    error,
    isPending,
  } = useQuery({
    queryKey: ["food", params.id],
    queryFn: async () => {
      const res = await fetch(`${API_FOODS_URL}${params.id}/`, {
        method: "GET",
      });
      return (await res.json()) as Food;
    },
  });
  if (isPending) {
    return <p>Loading...</p>;
  }
  if (error) {
    return <ErrorBlock error={error} />;
  }

  return (
    <div className="flex w-full max-w-4xl grow flex-col items-center px-2">
      <ModifyFoodForm food={food} />
    </div>
  );
}
