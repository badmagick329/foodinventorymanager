"use client";
import { useRouter } from "next/navigation";

interface FormProps extends HTMLFormControlsCollection {
  name: HTMLInputElement;
  amount: HTMLInputElement;
  unit: HTMLInputElement;
}

export default function NewFood() {
  const router = useRouter();

  return (
    <>
      <h1 className="text-3xl text-white">New Food</h1>
      <form
        className="flex flex-col space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const { name, amount, unit } = form.elements as FormProps;
          console.log(
            `Creating new food: ${name.value} ${amount.value} ${unit.value}`,
          );
          const [nameValue, amountValue, unitValue] = [
            name.value,
            amount.value,
            unit.value,
          ];
          console.log("Submit");
          const food = await fetch("http://localhost:3000/api/foods", {
            method: "POST",
            body: JSON.stringify({
              name: nameValue,
              amount: amountValue,
              unit: unitValue,
            }),
          });
          console.log(food);
          router.push("/");
        }}
      >
        <label className="text-white">Name</label>
        <input className="input" type="text" name="name" />
        <label className="text-white">Amount</label>
        <input className="input" type="number" name="amount" />
        <label className="text-white">Unit</label>
        <input className="input" type="text" name="unit" />
        <button className="btn btn-outline btn-info">Add</button>
      </form>
    </>
  );
}
