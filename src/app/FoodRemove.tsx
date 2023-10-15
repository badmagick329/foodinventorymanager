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
      const response = await fetch(`http://localhost:3000/api/foods/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      console.log(`Response code: ${response.status}`);
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
