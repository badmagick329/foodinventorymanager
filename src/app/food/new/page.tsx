"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MeasurementUnit, StorageType } from "@prisma/client";
import { validateFood } from "@/lib/validators";
import { useTransition } from "react";
import { revalidateTag } from "next/cache";
import { createFood as create } from "@/actions/serverActions";
import { parseErrors } from "@/lib/utils";

export default function NewFood() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("unit");
  const [expiry, setExpiry] = useState("");
  const [storage, setStorage] = useState("fridge");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const _createFood = async () => {
    console.log("Validating form");
    console.log(name, amount, unit, expiry, storage);
    const errors = validateFood({
      name: name.trim(),
      unit: unit.trim(),
      amount: amount.trim(),
      expiry: expiry.trim() === "" ? null : expiry.trim(),
      storage: storage.trim(),
    });
    if (errors) {
      // TODO: alternative alert
      alert(parseErrors(errors));
      // alert(errors);
      return;
    }
    console.log("Creating food");
    startTransition(async () => {
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
      if (!response.ok) {
        const data = await response.json();
        // TODO: alternative alert
        alert(data.message);
        return;
      }
      console.log(response);
      router.push("/");
      router.refresh();
    });
  };

  const createFood = async (e: FormData) => {
    console.log("Creating food");
    startTransition(async () => {
      const result = await create(e);
      if (result.error) {
        alert(parseErrors(result.error));
        return;
      }
      console.log(`Received result: ${JSON.stringify(result)}`);
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="p-2 w-full sm:w-3/4 lg:w-1/2">
      <h1 className="text-3xl text-white w-full text-center">
        {isPending ? "Creating..." : "Create Food"}
      </h1>
      <form
        className="flex flex-col space-y-2"
        action={createFood}
        // onSubmit={async (e) => {
        //   e.preventDefault();
        //   await createFood();
        // }}
      >
        <label className="text-white">Name</label>
        <input
          className="input"
          type="text"
          value={name}
          name="name"
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="off"
        />
        <label className="text-white">Amount</label>
        <input
          className="input"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          name="amount"
          onChange={(e) => setAmount(e.target.value)}
          required
          autoComplete="off"
        />
        <label className="text-white">Unit</label>
        <select
          className="input"
          value={unit}
          name="unit"
          onChange={(e) => setUnit(e.target.value)}
          required
        >
          {Object.keys(MeasurementUnit).map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
        <label className="text-white">Expiry</label>
        <input
          className="input"
          type="date"
          value={expiry}
          min={new Date().toISOString().slice(0, 10)}
          name="expiry"
          onChange={(e) => setExpiry(e.target.value)}
        />
        <label className="text-white">Storage</label>
        <select
          className="input"
          value={storage}
          name="storage"
          onChange={(e) => setStorage(e.target.value)}
          required
        >
          {Object.keys(StorageType).map((storage) => (
            <option key={storage} value={storage}>
              {storage}
            </option>
          ))}
        </select>
        <button className="btn btn-outline btn-info" type="submit">
          Add
        </button>
      </form>
    </div>
  );
}
