import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FoodFromReceipt } from "@/receipt-reader/parser/types";
import { useState } from "react";

export default function AmountInput({ food }: { food: FoodFromReceipt }) {
  const [amount, setAmount] = useState<string>(food.amount.toString());

  return (
    <div className="flex flex-col gap-1">
      <Label className="px-2 text-xs">Amount</Label>
      <Input
        className="bg-background"
        type="number"
        autoComplete="off"
        min="1"
        step="1"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
          if (e.target.value === "") {
            food.amount = 0;
            return;
          }
          const parsed = parseInt(e.target.value);
          if (isNaN(parsed)) {
            return;
          }
          food.amount = parsed;
        }}
      />
    </div>
  );
}
