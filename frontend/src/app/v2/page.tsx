"use client";
import Main from "@/app/v2/_components/main";
import LoadingCat from "@/components/loading-cat";
import { Food } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

export const dynamic = "force-dynamic";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export default function HomeV2() {
  const {
    data: foods,
    error,
    isPending,
  } = useQuery({
    queryKey: ["foods"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/foods`, {
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
