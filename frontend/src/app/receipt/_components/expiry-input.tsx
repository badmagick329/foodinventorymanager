import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validDateStringOrNull } from "@/lib/utils";
import { FoodFromReceipt } from "@/receipt-reader/parser/types";
import { useState } from "react";

export default function ExpiryInput({ food }: { food: FoodFromReceipt }) {
  const [date, setDate] = useState(food.expiry || "");

  return (
    <div className="flex flex-col gap-1">
      <Label>Expiry</Label>
      <Input
        value={date}
        className="bg-background"
        placeholder="YYYY-MM-DD or Leave blank"
        onChange={(e) => {
          setDate(() => {
            return e.target.value;
          });

          if (e.target.value === "") {
            food.expiry = null;
            return;
          }

          if (validDateStringOrNull(e.target.value)) {
            food.expiry = e.target.value;
            return;
          }
        }}
      />
    </div>
  );
}
