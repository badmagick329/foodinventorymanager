import { FoodFromReceipt } from "@/receipt-reader/lib/types";
import { useState } from "react";
import { unitValues } from "@/receipt-reader/lib/types";

export default function UnitInput({
  style,
  foods,
  idx,
}: {
  style: string;
  foods: FoodFromReceipt[];
  idx: number;
}) {
  const [isChanged, setIsChanged] = useState(true);

  return (
    <div className="flex flex-col gap-1">
      <label className="px-2 text-xs">Unit</label>
      <select
        className={style}
        value={foods[idx].unit}
        onChange={(e) => {
          foods[idx].unit = e.target.value;
          setIsChanged(!isChanged);
        }}
      >
        {unitValues.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
    </div>
  );
}
