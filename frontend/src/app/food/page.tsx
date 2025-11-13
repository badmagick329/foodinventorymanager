"use client";

import ModifyFoodForm from "@/app/food/[id]/_components/modify-food-form";

export default function NewPage() {
  return (
    <div className="flex w-full max-w-4xl grow flex-col items-center px-2">
      <ModifyFoodForm />
    </div>
  );
}
