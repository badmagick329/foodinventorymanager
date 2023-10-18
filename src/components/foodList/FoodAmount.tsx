"use client";

import { useState } from "react";
import { useCallback, useEffect } from "react";
import { updateFoodAmount } from "@/actions/serverActions";

interface FoodAmountProps {
  id: number;
  amount: number;
}

export default function FoodAmount({ id, amount }: FoodAmountProps) {
  const [form, setForm] = useState(false);
  const [newAmount, setNewAmount] = useState(amount);
  const onDismiss = useCallback(() => {
    setForm(false);
  }, [form]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    },
    [onDismiss],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);
  if (form) {
    return (
      <span className="w-full">
        <form
          className="flex space-x-2"
          action={async () => {
            await updateFoodAmount(id, Number(newAmount));
            setForm(false);
          }}
        >
          <input
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            name="amount"
            value={newAmount}
            onChange={(e) => setNewAmount(Number(e.target.value))}
            autoComplete="off"
          />
          <button className="btn btn-outline btn-info" type="submit">
            Edit
          </button>
        </form>
      </span>
    );
  }
  return (
    <span
      className="w-full hover:cursor-pointer hover:bg-slate-800"
      onClick={(e) => setForm(true)}
    >
      {amount}
    </span>
  );
}
