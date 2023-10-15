"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewFood() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("");
  const router = useRouter();

  const createFood = async () => {
    console.log("Validating form");
    console.log(name, amount, unit);
    console.log("Creating food");
    const response = await fetch("http://localhost:3000/api/foods", {
      method: "POST",
      body: JSON.stringify({
        name,
        amount,
        unit,
      }),
    });
    console.log(response);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <h1 className="text-3xl text-white">New Food</h1>
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
        <input
          className="input"
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
        <button className="btn btn-outline btn-info" type="submit">
          Add
        </button>
      </form>
    </>
  );
}
