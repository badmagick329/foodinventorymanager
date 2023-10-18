"use client";

import { useState } from "react";
import { useCallback, useEffect } from "react";
import { updateFoodName } from "@/actions/serverActions";

interface FoodNameProps {
  id: number;
  name: string;
}

export default function FoodName({ id, name }: FoodNameProps) {
  const [form, setForm] = useState(false);
  const [newName, setNewName] = useState(name);
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
            await updateFoodName(id, newName);
            setForm(false);
          }}
        >
          <input
            className="input"
            type="text"
            name="name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoComplete="off"
            autoFocus
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
      {name}
    </span>
  );
}
