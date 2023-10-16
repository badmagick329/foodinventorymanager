"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MeasurementUnit, StorageType } from "@prisma/client";

export function validateFood(
  name: string,
  unit: string,
  amount: string,
  expiry: string | null,
  storage: string,
) {
  if (!name) {
    return "Name is required";
  }
  if (!unit) {
    return "Amount is required";
  }
  if (isNaN(Number(amount))) {
    return "Amount must be a number";
  }
  if (!unit) {
    return "Unit is required";
  }
  if (!Object.values(MeasurementUnit).includes(unit as MeasurementUnit)) {
    console.log(`Unit is: ${unit}`);
    return "Unit must be one of: " + Object.values(MeasurementUnit).join(", ");
  }
  if (Number(amount) < 0) {
    return "Amount must be greater than 0";
  }
  if (expiry !== null && isNaN(Date.parse(expiry))) {
    return "Expiry must be a valid date";
  }
  if (!Object.values(StorageType).includes(storage as StorageType)) {
    return "Storage must be one of: " + Object.values(StorageType).join(", ");
  }
  return null;
}

export default function NewFood() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState("unit");
  const [expiry, setExpiry] = useState("");
  const [storage, setStorage] = useState("pantry");
  const router = useRouter();

  const createFood = async () => {
    console.log("Validating form");
    console.log("Creating food with: ");
    console.log(name, amount, unit, expiry, storage);
    console.log("Creating food");
    const nameValue = name.trim();
    const amountValue = amount.trim();
    const unitValue = unit.trim();
    const expiryValue = expiry.trim() === "" ? null : expiry.trim();
    const storageValue = storage.trim();
    const error = validateFood(
      nameValue,
      unitValue,
      amountValue,
      expiryValue,
      storageValue,
    );
    if (error) {
      alert(error);
      return;
    }
    const response = await fetch("http://localhost:3000/api/foods", {
      method: "POST",
      body: JSON.stringify({
        name,
        amount,
        unit,
        expiry,
        storage,
      }),
    });
    console.log(response);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="p-2 w-full sm:w-3/4 lg:w-1/2">
      <h1 className="text-3xl text-white w-full text-center">
        Create New Food
      </h1>
      <form
        className="flex flex-col space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await createFood();
        }}
      >
        <label className="text-white">Name</label>
        <input
          className="input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="text-white">Amount</label>
        <input
          className="input"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <label className="text-white">Unit</label>
        <select
          className="input"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        >
          {Object.keys(MeasurementUnit).map((unit) => (
            <option value={unit}>{unit}</option>
          ))}
        </select>
        <label className="text-white">Expiry</label>
        <input
          className="input"
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        />
        <label className="text-white">Storage</label>
        <select
          className="input"
          value={storage}
          onChange={(e) => setStorage(e.target.value)}
        >
          {Object.keys(StorageType).map((storage) => (
            <option value={storage}>{storage}</option>
          ))}
        </select>
        <button className="btn btn-outline btn-info" type="submit">
          Add
        </button>
      </form>
    </div>
  );
}
