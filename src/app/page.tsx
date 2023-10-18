import Link from "next/link";
import FoodList from "@/components/FoodList";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <Suspense
        fallback={<span className="text-2xl font-semibold">Loading...</span>}
      >
        <Link href="/test">Click me</Link>
        <FoodList />
      </Suspense>
    </>
  );
}
