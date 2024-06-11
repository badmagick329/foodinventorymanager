import { FoodFromReceipt } from "@/receipt-reader/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ReceiptItemForm from "./receipt-item-form";

export default function ReceiptItems({
  foods,
  sendData,
}: {
  foods: FoodFromReceipt[] | null;
  sendData: () => Promise<string | undefined>;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!foods) {
      return;
    }

    const err = await sendData();
    if (err) {
      setErrors(err);
      return;
    } else {
      router.push("/");
      router.refresh();
    }
  }

  if (!foods) {
    return null;
  }

  return (
    <form className="flex flex-col items-center gap-4" onSubmit={handleSubmit}>
      {errors && <span className="text-red-500 font-bold">{errors}</span>}
      <button className="btn btn-primary btn-outline" type="submit">
        Submit
      </button>
      <div className="flex justify-center flex-wrap gap-4">
        {foods.map((_, idx) => (
          <ReceiptItemForm key={idx} idx={idx} foods={foods} />
        ))}
      </div>
    </form>
  );
}
