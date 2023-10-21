import Link from "next/link";
import FoodList from "@/components/FoodList";
import { Suspense } from "react";

export default function Home() {
  const BASE_URL = process.env.BASE_URL;
  return (
    <>
      <Suspense
        fallback={<span className="text-2xl font-semibold">Loading...</span>}
      >
        <FoodList baseUrl={BASE_URL} />
      </Suspense>
    </>
  );
}
