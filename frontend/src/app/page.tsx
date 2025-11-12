"use client";
import Main from "@/app/_components/main";
import LoadingCat from "@/components/loading-cat";
import { Food } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { FOODS_URL } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default function Home() {
  const {
    data: foods,
    error,
    isPending,
  } = useQuery({
    queryKey: ["foods"],
    queryFn: async () => {
      const res = await fetch(FOODS_URL, {
        method: "GET",
      });
      return (await res.json()) as Food[];
    },
  });

  if (isPending) {
    return <LoadingCat />;
  }

  if (!isPending && error) {
    console.error(error);
    return <span className="text-4xl">Could not fetch data 😥</span>;
  }

  console.log(foods);
  return <Main foods={foods} />;
}
