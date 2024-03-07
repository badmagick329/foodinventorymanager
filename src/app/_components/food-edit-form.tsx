import { MeasurementUnit, StorageType } from "@prisma/client";
import { useState } from "react";
import { AiOutlineClear } from "react-icons/ai";

interface FormProps {
  id: number;
  value: number | string;
  updater: CallableFunction;
}
import { AiOutlineCheck } from "react-icons/ai";

function calcStepSize(value: number | string) {
  if (typeof value === "string") {
    value = Number(value);
  }
  if (isNaN(value)) {
    return "0.1";
  }

  if (value > 1000) {
    return "100";
  } else if (value > 100) {
    return "10";
  } else if (value > 20) {
    return "1";
  }
  return "0.1";
}

export function FoodAmountForm({ id, value, updater }: FormProps) {
  const [newValue, setNewValue] = useState(value);
  const stepSize = calcStepSize(value);

  return (
    <form
      className="flex gap-x-2"
      action={async () => {
        await updater(id, newValue);
      }}
    >
      <input
        className="max-w-[120px] input input-bordered"
        type="number"
        min={stepSize}
        step={stepSize}
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
      className="flex justify-center px-4 py-2"
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
      className="flex gap-2"
      action={async () => {
        await updater(id, newValue);
      }}
    >
      <select
        className="rounded-md px-2"
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
        className="btn btn-outline btn-warning"
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
    <button className="btn btn-outline text-green-300" type="submit">
      <AiOutlineCheck />
    </button>
  );
}
