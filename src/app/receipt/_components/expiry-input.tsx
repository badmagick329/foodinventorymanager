import { validDateStringOrNull } from "@/lib/utils";
import { FoodFromReceipt } from "@/receipt-reader/lib/types";
import { useState } from "react";

export default function ExpiryInput({
  style,
  foods,
  idx,
}: {
  style: string;
  foods: FoodFromReceipt[];
  idx: number;
}) {
  const [date, setDate] = useState(foods[idx].expiry || "");

  return (
    <div className="flex flex-col gap-1">
      <label className="px-2 text-xs">Expiry</label>
      <input
        type="text"
        className={style}
        value={date}
        placeholder="YYYY-MM-DD or Leave blank"
        onChange={(e) => {
          setDate(() => {
            return e.target.value;
          });
          if (e.target.value === "") {
            foods[idx].expiry = null;
          } else if (validDateStringOrNull(e.target.value)) {
            foods[idx].expiry = e.target.value;
          }
        }}
      />
    </div>
  );
}
