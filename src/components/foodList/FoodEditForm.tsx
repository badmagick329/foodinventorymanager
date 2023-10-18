"use client";

import { MeasurementUnit, StorageType } from "@prisma/client";
import { useState } from "react";
import { GiConfirmed } from "react-icons/gi";
import { AiOutlineClear } from "react-icons/ai";

interface FormProps {
  id: number;
  value: number | string;
  updater: CallableFunction;
}
import { AiOutlineCheck } from "react-icons/ai";

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
        className="input w-1/2 input-bordered max-w-xs"
        type="number"
        min="0.1"
        step="0.1"
        name="amount"
        value={newValue}
        onChange={(e) => setNewValue(Number(e.target.value))}
        autoComplete="off"
        autoFocus
      />
      <DoneButton />
    </form>
  );
}

export function FoodNameForm({ id, value, updater }: FormProps) {
  const [newValue, setNewValue] = useState(value);
  return (
    <form
      className="flex w-full my-2 justify-center"
      action={async () => {
        await updater(id, newValue);
      }}
    >
      <input
        className="input mx-2"
        type="text"
        name="name"
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        autoComplete="off"
        autoFocus
      />
      <DoneButton />
    </form>
  );
}

export function FoodUnitForm({ id, value, updater }: FormProps) {
  const [newValue, setNewValue] = useState(value);
  return (
    <form
      className="flex space-x-2"
      action={async () => {
        await updater(id, newValue);
      }}
    >
      <select
        className="input"
        value={newValue}
        onChange={(e) => {
          setNewValue(e.target.value);
        }}
        autoFocus
      >
        {Object.keys(MeasurementUnit).map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
      <DoneButton />
    </form>
  );
}

export function FoodExpiryForm({ id, value, updater }: FormProps) {
  const [newValue, setNewValue] = useState(value);
  return (
    <form
      className="flex space-x-2 justify-center"
      action={async () => {
        await updater(id, newValue);
      }}
    >
      <input
        className="input"
        type="date"
        value={newValue}
        min={new Date().toISOString().slice(0, 10)}
        name="expiry"
        onChange={(e) => setNewValue(e.target.value)}
      />
      <DoneButton />
      <button
        className="btn btn-warning btn-outline"
        onClick={() => setNewValue("")}
      >
        <AiOutlineClear />
      </button>
    </form>
  );
}

export function FoodStorageForm({ id, value, updater }: FormProps) {
  const [newValue, setNewValue] = useState(value);
  return (
    <form
      className="flex space-x-2 justify-center"
      action={async () => {
        await updater(id, newValue);
      }}
    >
      <select
        className="input"
        value={newValue}
        onChange={(e) => {
          setNewValue(e.target.value);
        }}
        autoFocus
      >
        {Object.keys(StorageType).map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
      <DoneButton />
    </form>
  );
}

function DoneButton() {
  return (
    <button className="btn btn-outline btn-primary" type="submit">
      <AiOutlineCheck />
    </button>
  );
}
