import { FoodFromReceipt } from "@/receipt-reader/parser/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReceiptItemForm from "./receipt-item-form";
import { Button } from "@/components/ui/button";

export default function ReceiptItems({
  foods,
  sendData,
}: {
  foods: FoodFromReceipt[] | null;
  sendData: () => Promise<string | undefined>;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      {errors && <span className="font-bold text-red-500">{errors}</span>}
      <Button type="submit">Submit</Button>
      <div className="flex flex-wrap justify-center gap-4">
        {foods.map((f, idx) => (
          <ReceiptItemForm
            key={`${f.name}-${f.amount}-${f.unit}-${f.expiry}-${f.storage}`}
            food={f}
            idx={idx}
          />
        ))}
      </div>
    </form>
  );
}
