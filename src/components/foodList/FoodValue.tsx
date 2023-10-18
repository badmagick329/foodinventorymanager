"use client";

import { useState } from "react";
import { useCallback, useEffect } from "react";
import { updateFoodAmount, updateFoodName } from "@/actions/serverActions";
import { FoodAmountForm, FoodNameForm } from "./FoodEditForm";
import { FoodValueType } from "./FoodComp";

interface Props {
  id: number;
  value: number | string;
  foodValueType: FoodValueType;
}

export default function FoodValue({ id, value, foodValueType }: Props) {
  const [form, setForm] = useState(false);
  const onDismiss = useCallback(() => {
    setForm(false);
  }, [form]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    },
    [onDismiss],
  );

  function renderForm() {
    switch (foodValueType) {
      case "name":
        return (
          <FoodNameForm
            id={id}
            value={value as string}
            updater={async (id: number, value: string) => {
              await updateFoodName(id, value);
              setForm(false);
            }}
          />
        );
      case "amount":
        return (
          <FoodAmountForm
            id={id}
            value={Number(value)}
            updater={async (id: number, value: string) => {
              await updateFoodAmount(id, Number(value));
              setForm(false);
            }}
          />
        );
      default:
        return (
          <span className="text-2xl font-semibold">{foodValueType}???</span>
        );
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);
  if (form) {
    return <span className="w-full">{renderForm()}</span>;
  }
  return (
    <span
      className="w-full hover:cursor-pointer hover:bg-slate-800"
      onClick={(e) => setForm(true)}
    >
      {value}
    </span>
  );
}
