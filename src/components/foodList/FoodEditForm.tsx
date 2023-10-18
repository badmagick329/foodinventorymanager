"use client";

import { useState } from "react";

interface FormProps {
  id: number;
  value: number | string;
  updater: CallableFunction;
}

export function FoodAmountForm({ id, value, updater }: FormProps) {
  const [newValue, setNewValue] = useState(value);
  return (
    <form
      className="flex space-x-2"
      action={async () => {
        await updater(id, newValue);
      }}
    >
      <input
        className="input"
        type="number"
        min="0.01"
        step="0.01"
        name="amount"
        value={newValue}
        onChange={(e) => setNewValue(Number(e.target.value))}
        autoComplete="off"
        autoFocus
      />
      <button className="btn btn-outline btn-info" type="submit">
        Edit
      </button>
    </form>
  );
}

export function FoodNameForm({ id, value, updater }: FormProps) {
  const [newValue, setNewValue] = useState(value);
  return (
    <form
      className="flex space-x-2"
      action={async () => {
        await updater(id, newValue);
      }}
    >
      <input
        className="input"
        type="text"
        name="name"
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        autoComplete="off"
        autoFocus
      />
      <button className="btn btn-outline btn-info" type="submit">
        Edit
      </button>
    </form>
  );
}
