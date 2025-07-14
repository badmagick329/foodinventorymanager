import { FoodFromReceipt } from "@/receipt-reader/parser/types";
import { useState } from "react";

export default function AmountInput({
  style,
  foods,
  idx,
}: {
  style: string;
  foods: FoodFromReceipt[];
  idx: number;
}) {
  const [amount, setAmount] = useState<string>(foods[idx].amount.toString());

  return (
    <div className="flex flex-col gap-1">
      <label className="px-2 text-xs">Amount</label>
      <input
        type="number"
        className={style}
        autoComplete="off"
        min="1"
        step="1"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
          if (e.target.value === "") {
            foods[idx].amount = 0;
            return;
          }
          const parsed = parseInt(e.target.value);
          if (isNaN(parsed)) {
            return;
          }
          foods[idx].amount = parsed;
        }}
      />
    </div>
  );
}
