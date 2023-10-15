"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MeasurementUnit } from "@prisma/client";

interface FoodUnitProps {
  id: number;
  unit: string;
}

export default function FoodUnit({ id, unit }: FoodUnitProps) {
  const [form, setForm] = useState(false);
  const [newUnit, setNewUnit] = useState(unit);
  const router = useRouter();
  const editAmount = async () => {
    const response = await fetch(`http://localhost:3000/api/foods/${id}`, {
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
      alert(resp.error);
      return;
    }
    console.log(`Edited food with id ${id}`);
    setForm(false);
    router.refresh();
  };
  if (form) {
    return (
      <td>
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
            onChange={(e) => setNewUnit(e.target.value)}
          >
            {Object.keys(MeasurementUnit).map((unit) => (
              <option value={unit}>{unit}</option>
            ))}
          </select>
          <button className="btn btn-outline btn-info" type="submit">
            Edit
          </button>
        </form>
      </td>
    );
  }
  return <td onClick={(e) => setForm(true)}>{unit}</td>;
}
