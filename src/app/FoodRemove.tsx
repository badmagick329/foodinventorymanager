"use client";

import { useRouter } from "next/navigation";

interface FoodRemoveProps {
  id: number;
}

export default function FoodRemove({ id }: FoodRemoveProps) {
  const router = useRouter();
  const removeFood = async () => {
    const confirmed = confirm("Are you sure?");
    console.log(`Removing food with id ${id}`);
    if (confirmed) {
      router.refresh();
      console.log(`Removed food with id ${id}`);
    }
  };
  return (
    <button className="btn btn-outline btn-error" onClick={removeFood}>
      Remove
    </button>
  );
}
