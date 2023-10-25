import ShoppingList from "@/components/ShoppingList";
import { Suspense } from "react";

export default function Shopping() {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  return (
    <>
      <Suspense
        fallback={<span className="text-2xl font-semibold">Loading...</span>}
      >
        <ShoppingList baseUrl={BASE_URL} />
      </Suspense>
    </>
  );
}
