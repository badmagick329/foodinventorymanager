"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface FoodNameProps {
  id: number;
  name: string;
}

export default function FoodName({ id, name }: FoodNameProps) {
  const [form, setForm] = useState(false);
  const [newName, setNewName] = useState(name);
  const router = useRouter();
  const editName = async () => {
    const response = await fetch("http://localhost:3000/api/foods", {
      method: "PATCH",
      body: JSON.stringify({
        id,
        values: {
          name: newName,
        },
      }),
    });
    console.log(`Response code: ${response.status}`);
    if (response.status === 400) {
      const resp = await response.json();
      setForm(false);
      setNewName(name);
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
            await editName();
          }}
        >
          <input
            className="input"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn btn-outline btn-info" type="submit">
            Edit
          </button>
        </form>
      </td>
    );
  }
  return <td onClick={(e) => setForm(true)}>{name}</td>;
}
