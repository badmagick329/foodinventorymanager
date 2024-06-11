import { FoodFromReceipt } from "@/receipt-reader/lib/types";
import { useState } from "react";
import AmountInput from "./amount-input";
import ExpiryInput from "./expiry-input";
import NameInput from "./name-input";
import StorageInput from "./storage-input";
import UnitInput from "./unit-input";

export default function ReceiptItemForm({
  idx,
  foods,
}: {
  idx: number;
  foods: FoodFromReceipt[];
}) {
  const [show, setShow] = useState(true);
  const inputStyle = "input input-bordered text-sm min-w-[320px]";
  if (!show) {
    return null;
  }

  function removeItem() {
    foods[idx].name = "";
    setShow(false);
  }

  return (
    <div className="flex flex-col items-center gap-2 bg-slate-800 rounded-md p-2">
      <div className="flex justify-between w-full">
        <span className="text-xl">Item {idx + 1}</span>
        <button
          className="hover:bg-slate-400 rounded-md py-1 px-2"
          onClick={removeItem}
        >
          ❌
        </button>
      </div>
      <NameInput style={inputStyle} foods={foods} idx={idx} />
      <ExpiryInput style={inputStyle} foods={foods} idx={idx} />
      <StorageInput style={inputStyle} foods={foods} idx={idx} />
      <AmountInput style={inputStyle} foods={foods} idx={idx} />
      <UnitInput style={inputStyle} foods={foods} idx={idx} />
    </div>
  );
}
