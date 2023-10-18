"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MeasurementUnit } from "@prisma/client";
import { useCallback, useEffect } from "react";

interface FoodUnitProps {
  id: number;
  unit: string;
}

export default function FoodUnit({ id, unit }: FoodUnitProps) {
  const [form, setForm] = useState(false);
  const [newUnit, setNewUnit] = useState(unit);
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
          unit: newUnit,
        },
      }),
    });
    console.log(`Response code: ${response.status}`);
    if (response.status === 400) {
      const resp = await response.json();
      setForm(false);
      setNewUnit(unit);
      // TODO: alternative alert
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
          <select
            className="input"
            value={newUnit}
            onChange={(e) => {
              console.log(`Changing unit to ${e.target.value}`);
              setNewUnit(e.target.value);
            }}
          >
            {Object.keys(MeasurementUnit).map((unit) => (
              <option value={unit}>{unit}</option>
            ))}
          </select>
          <button className="btn btn-outline btn-info" type="submit">
            Edit
          </button>
        </form>
      </span>
    );
  }
  return <span onClick={(e) => setForm(true)}>{unit}</span>;
}
