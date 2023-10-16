"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCallback, useEffect } from "react";

interface FoodAmountProps {
  id: number;
  amount: number;
}

export default function FoodAmount({ id, amount }: FoodAmountProps) {
  const [form, setForm] = useState(false);
  const [newAmount, setNewAmount] = useState(amount);
  const router = useRouter();
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
  const editAmount = async () => {
    const response = await fetch("http://localhost:3000/api/foods", {
      method: "PATCH",
      body: JSON.stringify({
        id,
        values: {
          amount: newAmount,
        },
      }),
    });
    console.log(`Response code: ${response.status}`);
    if (response.status === 400) {
      const resp = await response.json();
      setForm(false);
      setNewAmount(amount);
      alert(resp.error);
      return;
    }
    console.log(`Edited food with id ${id}`);
    setForm(false);
    router.refresh();
  };
  if (form) {
    return (
      <span>
        <form
          className="flex space-x-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await editAmount();
          }}
        >
          <input
            className="input"
            type="number"
            step="0.1"
            value={newAmount}
            onChange={(e) => setNewAmount(Number(e.target.value))}
          />
          <button className="btn btn-outline btn-info" type="submit">
            Edit
          </button>
        </form>
      </span>
    );
  }
  return <span onClick={(e) => setForm(true)}>{amount}</span>;
}
