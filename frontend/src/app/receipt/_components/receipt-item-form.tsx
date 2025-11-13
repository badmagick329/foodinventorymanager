import { FoodFromReceipt } from "@/receipt-reader/parser/types";
import { useState } from "react";
import AmountInput from "./amount-input";
import ExpiryInput from "./expiry-input";
import NameInput from "./name-input";
import StorageInput from "./storage-input";
import UnitInput from "./unit-input";

export default function ReceiptItemForm({
  food,
  idx,
}: {
  food: FoodFromReceipt;
  idx: number;
}) {
  const [show, setShow] = useState(true);
  if (!show) {
    return null;
  }

  function removeItem() {
    food.name = "";
    setShow(false);
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-md bg-secondary p-2">
      <div className="flex w-full justify-between">
        <span className="text-xl">Item {idx + 1}</span>
        <button
          className="rounded-md px-2 py-1 hover:bg-slate-400"
          onClick={removeItem}
        >
          ❌
        </button>
      </div>
      <NameInput food={food} />
      <ExpiryInput food={food} />
      <StorageInput food={food} />
      <AmountInput food={food} />
      <UnitInput food={food} />
    </div>
  );
}
